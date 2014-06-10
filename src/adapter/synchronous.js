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

	},

	findRecord: function(typeKey, id) {

	},

	findMany: function(typeKey, ids) {

	},

	findAll: function(typeKey) {

	},

	findQuery: function(typeKey, query) {

	},

	updateRecord: function(record) {

	},

	deleteRecord: function(record) {

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
	 * Retrieves records from the data store. The `options` parameter
	 * can either be an array or object. If it's an array, it will
	 * be an array of objects with the following fields:
	 *
	 * - `typeKey`: The type of the record to retrieve.
	 * - `id`: The ID of the record to retrieve.
	 *
	 * This function should return an array of the records requested,
	 * in the order that they were requested.
	 *
	 * If the `options` parameter is an object, it's a query. The
	 * `typeKey` field will tell you the type of object while the
	 * `query` field will give you the query. If `query` is
	 * `undefined`, it should return all records of the given type.
	 * Note that you do not have to implement the query version if
	 * your application will not call `store.find(typeKey)` or
	 * `store.find(typeKey, query)`.
	 *
	 * @method retrieveRecords
	 * @param {Object|Array} options
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
	modifyRecords: EG.required('modifyRecords')

});