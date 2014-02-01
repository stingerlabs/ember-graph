var missingMethod = function(method) {
	return new Error('Your adapter failed to implement the \'' + method + '\' method.');
};

/**
 * An interface for an adapter. And adapter is used to communicated with
 * the server. The adapter is never called directly, its methods are
 * called by the store to perform its operations.
 *
 * @class {Adapter}
 */
Eg.Adapter = Em.Object.extend({

	/**
	 * Should be overridden with a serializer or serializer subclass.
	 * This class will proxy to the serializer for the serialize
	 * methods of this class.
	 */
	serializer: null,

	/**
	 * Persists a record to the server. When the record is returned
	 * in the promise, it should contain a finalized ID.
	 *
	 * @param {Model} record The record to persist
	 * @returns {Promise} A promise that resolves to the created record
	 */
	createRecord: function(record) {
		throw missingMethod('createRecord');
	},

	/**
	 * Fetch a record from the server. The adapter should load the
	 * returned JSON into a record and resolve it in the promise.
	 *
	 * @param {String|Model} type A type string or Model subclass
	 * @param {String} id The ID of the record to fetch
	 * @returns {Promise} A promise that resolves to the fetched record
	 */
	findRecord: function(type, id) {
		throw missingMethod('findRecord');
	},

	/**
	 * The same as find, only it should load several records. The
	 * promise can return any type of enumerable containing the records.
	 *
	 * @param {String|Model} type A type string or Model subclass
	 * @param {Enumerable} ids Enumerable of IDs
	 * @returns {Promise} A promise that resolves to an enumerable of fetched records
	 */
	findMany: function(type, ids) {
		throw missingMethod('findMany');
	},

	/**
	 * The same as find, only it should load all records of the given type.
	 * The promise can return any type of enumerable containing the records.
	 *
	 * @param {String|Model} type A type string or Model subclass
	 * @returns {Promise} A promise that resolves to an enumerable of fetched records
	 */
	findAll: function(type) {
		throw missingMethod('findAll');
	},

	/**
	 * The same as find, only it should load several records that match the passed query.
	 * The promise can return any type of enumerable containing the records.
	 *
	 * @param {String|Model} type A type string or Model subclass
	 * @param {Object} query The query parameters that were passed into `find` earlier
	 * @returns {Promise} A promise that resolves to an enumerable of fetched records
	 */
	findQuery: function(type, query) {
		throw missingMethod('findQuery');
	},

	/**
	 * Update the given record.
	 *
	 * @param {Model} record The model to save
	 * @returns {Promise} A promise that resolves to the updated record
	 */
	updateRecord: function(record) {
		throw missingMethod('updateRecord');
	},

	/**
	 * Update the given record.
	 *
	 * @param {Model} record The model to save
	 * @returns {Promise} A promise that resolves to true or false
	 */
	deleteRecord: function(record) {
		throw missingMethod('deleteRecord');
	},

	/**
	 * Proxies to the serializer of this class.
	 */
	serialize: function(record, options) {
		return this.get('serializer').serialize(record, options);
	},

	/**
	 * Proxies to the serializer of this class.
	 */
	deserialize: function(payload, options) {
		return this.get('serializer').deserialize(payload, options);
	}
});
