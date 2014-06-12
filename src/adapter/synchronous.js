var Promise = Em.RSVP.Promise;
var map = Ember.ArrayPolyfills.map;

/**
 * An abstract base class that allows easy integration of synchronous
 * data stores. Examples include in-memory, local storage and web SQL.
 * To extend this adapter, you must implement
 * {{link-to-method 'SynchronousAdapter' 'retrieveRecords'}} and
 * {{link-to-method 'SynchronousAdapter' 'modifyRecords'}}. You may
 * also override {{link-to-method 'SynchronousAdapter' 'generateId'}}
 * if you wish to customize the IDs that new records are assigned.
 *
 * If any operations fail (for any reason), throw an error and
 * the adapter will take care of rejecting the right promises.
 *
 * @class SynchronousAdapter
 * @extends Adapter
 * @constructor
 */
EG.SynchronousAdapter = EG.Adapter.extend({

	/**
	 * This adapter requires the built-in JSON serializer to function properly.
	 *
	 * @property serializer
	 * @type JSONSerializer
	 * @final
	 */
	serializer: Em.computed(function() {
		return this.get('container').lookup('serializer:json');
	}).property().readOnly(),

	createRecord: function(record) {
		try {
			var json = this.serverCreateRecord(record);
			var payload = { meta: { newId: json.id } };
			payload[EG.String.pluralize(record.typeKey)] = [json];

			return Promise.resolve(payload);
		} catch (e) {
			Em.warn(e && e.stack);
			return Promise.reject();
		}
	},

	findRecord: function(typeKey, id) {
		try {
			var json = this.retrieveRecord(typeKey, id);
			var deserialized = this.deserialize(json, { requestType: 'findRecord', id: id });

			var payload = {};
			payload[EG.String.pluralize(typeKey)] = [deserialized];

			return Promise.resolve(payload);
		} catch (e) {
			Em.warn(e && e.stack);
			return Promise.reject();
		}
	},

	findMany: function(typeKey, ids) {
		try {
			var json = map.call(ids, function(id) {
				return this.retrieveRecord(typeKey, id);
			}, this);

			var deserialized = this.deserialize(json, { requestType: 'findMany', ids: ids });

			var payload = {};
			payload[EG.String.pluralize(typeKey)] = deserialized;

			return Promise.resolve(payload);
		} catch (e) {
			Em.warn(e && e.stack);
			return Promise.reject();
		}
	},

	findAll: function(typeKey) {
		try {
			var json = this.retrieveRecords(typeKey);
			var deserialized = this.deserialize(json, { requestType: 'findAll' });

			var payload = {};
			payload[EG.String.pluralize(typeKey)] = deserialized;

			return Promise.resolve(payload);
		} catch (e) {
			Em.warn(e && e.stack);
			return Promise.reject();
		}
	},

	findQuery: function(typeKey, query) {
		try {
			var json = this.retrieveRecords(typeKey, query);
			var deserialized = this.deserialize(json, { requestType: 'findAll', query: query });

			var payload = {};
			payload[EG.String.pluralize(typeKey)] = deserialized;

			return Promise.resolve(payload);
		} catch (e) {
			Em.warn(e && e.stack);
			return Promise.reject();
		}
	},

	updateRecord: function(record) {
		try {
			var json = this.serverUpdateRecord(record);

			var payload = {};
			payload[EG.String.pluralize(record.typeKey)] = [json];

			return Promise.resolve(payload);
		} catch (e) {
			Em.warn(e && e.stack);
			return Promise.reject();
		}
	},

	deleteRecord: function(record) {
		try {
			this.serverDeleteRecord(record);
			return Promise.resolve();
		} catch (e) {
			Em.warn(e && e.stack);
			return Promise.reject();
		}
	},

	/**
	 * Serializes a single record to its JSON format.
	 *
	 * @method serialize
	 * @param {Model} record
	 * @param {Object} options
	 * @return {Object} Serialized record
	 * @protected
	 */
	serialize: function(record, options) {
		var payload = this.get('serializer').serialize(record, options);
		return payload[EG.String.pluralize(record.typeKey)][0];
	},

	/**
	 * Deserializes a single record from its JSON format.
	 *
	 * @method deserialize
	 * @param {JSON} record
	 * @param {Object} options
	 * @return {Object} Normalized JSON payload
	 * @protected
	 */
	deserialize: function(record, options) {
		var payload = {};
		payload[EG.String.pluralize(options.recordType)] = [record];
	},

	/**
	 * Generates an ID for a newly created record.
	 *
	 * @method generateId
	 * @param {Model} record
	 * @return {String}
	 * @protected
	 */
	generateId: function(record) {
		return EG.generateUUID();
	},

	/**
	 * Retrieves a single record from the data store.
	 *
	 * @method retrieveRecord
	 * @param {String} typeKey
	 * @param {String} id
	 * @return {JSON}
	 * @protected
	 * @category abstract
	 */
	retrieveRecord: EG.required('retrieveRecord'),

	/**
	 * Retrieves records from the data store. If 'query`
	 * is `undefined`, it should return all records of
	 * the given type. Otherwise it should only return
	 * the records that match the given query.
	 *
	 * @method retrieveRecords
	 * @param {String} typeKey
	 * @param {Object} query
	 * @return {JSON} Array of records
	 * @protected
	 * @category abstract
	 */
	retrieveRecords: EG.required('retrieveRecords'),

	/**
	 * Modifies a set of records. The records should be updated in a transaction.
	 * Either all of the records are updated, or none of them. If the records
	 * aren't updated together, corrupted data is possible.
	 *
	 * The `updates` parameter is a list of objects that have the following fields:
	 *
	 * - `typeKey`: The type of the record to modify.
	 * - `id`: The ID of the record to modify.
	 * - `data`: The data that represents the updated version of the record.
	 *     If the value is `undefined`, the record should be removed from the store.
	 *
	 * @method modifyRecords
	 * @param {Object[]} updates
	 * @protected
	 * @category abstract
	 */
	modifyRecords: EG.required('modifyRecords'),

	/**
	 * Creates the record as if it were the server. It serializes
	 * the record, generates an ID, puts the record in the store
	 * and connects any relationships it needs to.
	 *
	 * @method serverCreateRecord
	 * @param {Model} record
	 * @return {JSON} Created record
	 * @protected
	 */
	serverCreateRecord: function(record) {

	},

	/**
	 * Updates the record as if it were the server. It serializes
	 * the record, puts the record in the store and connects any
	 * relationships it needs to.
	 *
	 * @method serverUpdateRecord
	 * @param {Model} record
	 * @return {JSON} Updated version of record
	 * @protected
	 */
	serverUpdateRecord: function(record) {

	},

	/**
	 * Deletes the record and its relationships from the store.
	 *
	 * @method serverDeleteRecord
	 * @param {Model} record
	 * @protected
	 */
	serverDeleteRecord: function(record) {

	}

});