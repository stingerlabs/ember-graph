var missingMethod = function(method) {
	return new Error('Your adapter failed to implement the \'' + method + '\' method.');
};

/**
 * An interface for an adapter. And adapter is used to communicated with
 * the server. The adapter is never called directly, its methods are
 * called by the store to perform its operations.
 *
 * The adapter should return normalized JSON from its operations. Normalized JSON
 * is a single object whose keys are the type names of the records being returned.
 * The JSON cannot contain any other keys. The value of each key will be the
 * records of that type that were returned by the server. The records must be
 * in normalized JSON form which means that they must contain an `id` field,
 * and they must contain the required attributes and relationships to
 * create a record of that type.
 *
 * Example:
 * {
 *     user: [{ id: 3, posts: [1,2] }],
 *     post: [{ id: 1 }, { id: 2 }]
 * }
 *
 * @class {Adapter}
 */
Eg.Adapter = Em.Object.extend({

	/**
	 * The store that this adapter belongs to.
	 * This might be needed to get models and their metadata.
	 */
	store: null,

	/**
	 * Should be overridden with a serializer instance. This class will
	 * proxy to the serializer for the serialize methods of this class.
	 */
	serializer: null,

	/**
	 * Observer method to set the store property on the serializer.
	 * @private
	 */
	_serializerDidChange: function() {
		var serializer = this.get('serializer');

		if (serializer) {
			serializer.set('store', this.get('store'));
		}
	}.observes('serializer').on('init'),

	/**
	 * Persists a record to the server. This method returns normalized JSON
	 * as the other methods do, but the normalized JSON must contain one
	 * extra field. It must contain an `id` field that represents the
	 * permanent ID of the record that was created. This helps distinguish
	 * it from any other records of that same type that may have been
	 * returned from the server.
	 *
	 * @param {Model} record The record to persist
	 * @returns {Promise} A promise that resolves to normalized JSON
	 */
	createRecord: function(record) {
		throw missingMethod('createRecord');
	},

	/**
	 * Fetch a record from the server.
	 *
	 * @param {String|Model} type A type string or Model subclass
	 * @param {String} id The ID of the record to fetch
	 * @returns {Promise} A promise that resolves to normalized JSON
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
	 * @returns {Promise} A promise that resolves to normalized JSON
	 */
	findMany: function(type, ids) {
		throw missingMethod('findMany');
	},

	/**
	 * The same as find, only it should load all records of the given type.
	 * The promise can return any type of enumerable containing the records.
	 *
	 * @param {String|Model} type A type string or Model subclass
	 * @param {Enumerable} ids The IDs of records of this type that the store already has
	 * @returns {Promise} A promise that resolves to normalized JSON
	 */
	findAll: function(type, ids) {
		throw missingMethod('findAll');
	},

	/**
	 * This method returns normalized JSON as the other methods do, but
	 * the normalized JSON must contain one extra field. It must contain
	 * an `ids` field that represents the IDs of the records that matched
	 * the query. This helps distinguish them from any other records of
	 * that same type that may have been returned from the server.
	 *
	 * @param {String|Model} type A type string or Model subclass
	 * @param {Object} query The query parameters that were passed into `find` earlier
	 * @param {Enumerable} ids The IDs of records of this type that the store already has
	 * @returns {Promise} A promise that resolves to normalized JSON
	 */
	findQuery: function(type, query, ids) {
		throw missingMethod('findQuery');
	},

	/**
	 * Update the given record.
	 *
	 * @param {Model} record The model to save
	 * @returns {Promise} A promise that resolves to normalized JSON
	 */
	updateRecord: function(record) {
		throw missingMethod('updateRecord');
	},

	/**
	 * Update the given record.
	 *
	 * @param {Model} record The model to save
	 * @returns {Promise} A promise that resolves to normalized JSON
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
