/**
 * An interface for an adapter. And adapter is used to communicate with
 * the server. The adapter is never called directly, its methods are
 * called by the store to perform its operations.
 *
 * The adapter should return normalized JSON from its operations. Details
 * about normalized JSON can be found in the {{link-to-method 'Store' 'extractPayload'}}
 * documentation.
 *
 * @class Adapter
 * @constructor
 * @category abstract
 */
EG.Adapter = Em.Object.extend({

	/**
	 * The store that this adapter belongs to.
	 * This might be needed to get models and their metadata.
	 *
	 * @property store
	 * @type Store
	 * @final
	 */
	store: null,

	/**
	 * The serializer to use if an application serializer is not found.
	 *
	 * @property defaultSerializer
	 * @type String
	 * @default 'json'
	 */
	defaultSerializer: 'json',

	/**
	 * The serializer used to convert records and payload to the correct formats.
	 * The adapter will attempt to use the application serializer, and if one
	 * isn't found, it will used the serializer specified by
	 * {{link-to-property 'Adapter' 'defaultSerializer'}}.
	 *
	 * @property serializer
	 * @type Serializer
	 */
	serializer: Em.computed(function() {
		var container = this.get('container');
		var serializer = container.lookup('serializer:application') ||
			container.lookup('serializer:' + this.get('defaultSerializer'));

		Em.assert('A valid serializer could not be found.', EG.Serializer.detectInstance(serializer));

		return serializer;
	}).property().readOnly(),

	/**
	 * Persists a record to the server. The returned JSON
	 * must include the `newId` meta attribute as described
	 * {{link-to-method 'here' 'Serializer' 'deserialize'}}.
	 *
	 * @method createRecord
	 * @param {Model} record
	 * @return {Promise} Resolves to the normalized JSON
	 * @category abstract
	 */
	createRecord: EG.required('createRecord'),

	/**
	 * Fetch a record from the server.
	 *
	 * @method findRecord
	 * @param {String} typeKey
	 * @param {String} id
	 * @return {Promise} Resolves to the normalized JSON
	 * @category abstract
	 */
	findRecord: EG.required('findRecord'),

	/**
	 * The same as find, only it should load several records.
	 *
	 * @method findMany
	 * @param {String} typeKey
	 * @param {String[]} ids
	 * @return {Promise} Resolves to the normalized JSON
	 * @category abstract
	 */
	findMany: EG.required('findMany'),

	/**
	 * The same as find, only it should load all records of the given type.
	 *
	 * @method findAll
	 * @param {String} typeKey
	 * @return {Promise} Resolves to the normalized JSON
	 * @category abstract
	 */
	findAll: EG.required('findAll'),

	/**
	 * Queries the server for records of the given type. The resolved
	 * JSON should include the `queryIds` meta attribute as
	 * described {{link-to-method 'here' 'Serializer' 'deserialize'}}.
	 *
	 * @method findQuery
	 * @param {String} typeKey
	 * @param {Object} query The query object passed into the store's `find` method
	 * @return {Promise} Resolves to the normalized JSON
	 * @category abstract
	 */
	findQuery: EG.required('findQuery'),

	/**
	 * Saves the record's changes to the server.
	 *
	 * @method updateRecord
	 * @param {Model} record
	 * @return {Promise} Resolves to the normalized JSON
	 * @category abstract
	 */
	updateRecord: EG.required('updateRecord'),

	/**
	 * Deletes the record.
	 *
	 * @method deleteRecord
	 * @param {Model} record
	 * @return {Promise} Resolves to the normalized JSON
	 * @category abstract
	 */
	deleteRecord: EG.required('deleteRecord'),

	/**
	 * Serializes the given record. By default, it defers to the serializer.
	 *
	 * @method serialize
	 * @param {Model} record
	 * @param {Object} options
	 * @return {Object} Serialized record
	 * @protected
	 */
	serialize: function(record, options) {
		return this.get('serializer').serialize(record, options);
	},

	/**
	 * Deserializes the given payload. By default, it defers to the serializer.
	 *
	 * @method deserialize
	 * @param {JSON} payload
	 * @param {Object} options
	 * @return {Object} Normalized JSON payload
	 * @protected
	 */
	deserialize: function(payload, options) {
		return this.get('serializer').deserialize(payload, options);
	}
});
