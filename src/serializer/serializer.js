var methodMissing = function(method) {
	return new Error('Your serializer failed to implement the \'' + method + '\' method.');
};

/**
 * An interface for a serializer. A serializer is used to convert
 * objects back and forth between the JSON that the server uses,
 * and the records that are used on the client side.
 *
 * @class {Serializer}
 */
EG.Serializer = Em.Object.extend({

	/**
	 * The store that the records will be loaded into.
	 * This can be used for fetching models and their metadata.
	 */
	store: null,

	/**
	 * Converts a record to JSON for sending over the wire.
	 *
	 * Current options:
	 * includeId: true to include the ID in the JSON, should default to false
	 *
	 * @param {Model} record The record to serialize
	 * @param {Object} options Any options that were passed by the adapter
	 * @returns {Object} JSON representation of record
	 */
	serialize: function(record, options) {
		throw methodMissing('serialize');
	},

	/**
	 * Converts a payload from the server into one or more records to
	 * be loaded into the store. The method should use the options
	 * object to obtain any information it needs to correctly form
	 * the records. This method should return an enumerable of records
	 * no matter how many records the server sent back.
	 *
	 * Current options:
	 * isQuery: true to preserver the top-level `ids` key, defaults to false
	 *
	 * @param {Object} payload
	 * @param {Object} options Any options that were passed by the adapter
	 * @returns {Object} Normalized JSON Payload
	 */
	deserialize: function(payload, options) {
		throw methodMissing('deserialize');
	}
});
