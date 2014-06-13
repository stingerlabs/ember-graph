var Promise = Em.RSVP.Promise;
var map = Em.ArrayPolyfills.map;
var forEach = Em.ArrayPolyfills.forEach;
var indexOf = Em.ArrayPolyfills.indexOf;

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
			var deserialized = this.deserialize(json, { recordType: typeKey, requestType: 'findRecord', id: id });

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

			var deserialized = map.call(json, function(record) {
				return this.deserialize(record, { recordType: typeKey, requestType: 'findMany', ids: ids });
			}, this);

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
			var deserialized = map.call(json, function(record) {
				return this.deserialize(record, { recordType: typeKey, requestType: 'findRecord' });
			}, this);

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
			var deserialized = map.call(json, function(record) {
				return this.deserialize(record, { recordType: typeKey, requestType: 'findRecord' });
			}, this);

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
		var deserializeOptions = { requestType: 'findRecord', recordType: options.recordType, id: record.id };
		var deserialized = this.get('serializer').deserialize(payload, deserializeOptions);
		return deserialized[options.recordType][0];
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
		var HAS_MANY_KEY = EG.Model.HAS_MANY_KEY;
		var HAS_ONE_KEY = EG.Model.HAS_ONE_KEY;

		// A small cache that keeps records we've already retrieved and modified
		var recordCache = {};
		var getRecord = function(typeKey, id) {
			if (!recordCache[typeKey + '.' + id]) {
				recordCache[typeKey + '.' + id] = this.retrieveRecord(typeKey, id);
			}

			return recordCache[typeKey + '.' + id];
		}.bind(this);

		// Helper functions to (dis)connect new relationships
		var store = this.get('store');
		var connectRelationshipTo = function(typeKey, id, name, value) {
			var model = store.modelForType(typeKey);
			var meta = model.metaForRelationship(name);
			var record = getRecord(typeKey, id);

			if (meta.kind === HAS_MANY_KEY) {
				record.links[name].push(value);
			} else if (meta.kind === HAS_ONE_KEY) {
				if (record.links[name] !== null) {
					disconnectRelationshipFrom(typeKey, id, name, record.links[name]);
				}

				record.links[name] = value;
			} else {
				Em.assert('Bad relationship kind');
			}
		};
		var disconnectRelationshipFrom = function(typeKey, id, name, value) {
			var model = store.modelForType(typeKey);
			var meta = model.metaForRelationship(name);
			var record = getRecord(typeKey, id);

			if (meta.kind === HAS_MANY_KEY) {
				record.links[name].splice(indexOf.call(record.links[name], value), 1);
			} else if (meta.kind === HAS_ONE_KEY) {
				if (record.links[name] === value) {
					record.links[name] = null;
				}
			} else {
				Em.assert('Bad relationship kind');
			}
		};

		// Serialize the created record and store it in the cache
		var json = this.serialize(record, { requestType: 'createRecord' });
		json.id = this.generateId(record);
		recordCache[record.typeKey + '.' + json.id] = json;

		// Connect all of the necessary relationships
		record.constructor.eachRelationship(function(name, meta) {
			if (!meta.inverse) {
				return;
			}

			if (json.links[name] === null || (Em.isArray(json.links[name]) && json.links[name].length <= 0)) {
				return;
			}

			var value = record.get('_' + name);

			if (meta.kind === HAS_MANY_KEY) {
				forEach.call(value, function(id) {
					connectRelationshipTo(meta.relatedType, id, meta.inverse, json.id);
				});
			} else if (meta.kind === HAS_ONE_KEY) {
				connectRelationshipTo(meta.relatedType, value, meta.inverse, json.id);
			} else {
				Em.assert('Bad relationship kind');
			}
		}, this);

		// Gather the modifications
		//modifications.push({ typeKey: record.typeKey, id: json.id, data: json });

		var modifications = map.call(Em.keys(recordCache), function(key) {
			return {
				typeKey: key.substring(0, key.indexOf('.')),
				id: recordCache[key].id,
				data: recordCache[key]
			};
		});

		this.modifyRecords(modifications);

		return json;
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