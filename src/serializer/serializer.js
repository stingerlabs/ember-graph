/**
 * An interface for a serializer. A serializer is used to convert
 * objects back and forth between the JSON that the server uses,
 * and the records that are used on the client side.
 *
 * @class Serializer
 */
EG.Serializer = Em.Object.extend({

	/**
	 * The store that the records will be loaded into. This
	 * property is injected by the container on startup.
	 * This can be used for fetching models and their metadata.
	 *
	 * @property store
	 * @type Store
	 * @final
	 */
	store: null,

	/**
	 * Converts a record to a JSON payload that can be sent to
	 * the server. The options object is a general object where any options
	 * necessary can be passed in from the adapter. The built-in Ember-Graph
	 * adapters pass in just one option: `requestType`. This lets the
	 * serializer know what kind of request will made using the payload
	 * returned from this call. The value of `requestType` will be one of
	 * either `createRecord` or `updateRecord`. If you write a custom
	 * adapter or serializer, you're free to pass in any other options
	 * you may need.
	 *
	 * @method serialize
	 * @param {Model} record The record to serialize
	 * @param {Object} [options] Any options that were passed by the adapter
	 * @return {JSON} JSON payload to send to server
	 * @abstract
	 */
	serialize: EG.abstractMethod('serialize'),

	/**
	 * Takes a payload from the server and converts it into a normalized
	 * JSON payload that the store can use. Details about the format
	 * can be found in the {{link-to-method 'Store' 'extractPayload'}}
	 * documentation.
	 *
	 * In addition to the format described by the store, the adapter
	 * may require some additional information. This information should
	 * be included in the `meta` object. The attributes required by the
	 * built-in Ember-Graph adapters are:
	 *
	 * - `queryIds`: This is an array of IDs that represents the records
	 *     returned as the result of a query. This helps the adapter in the
	 *     case that addition records of the same type were side-loaded.
	 * - `newId`: This tells the adapter which record was just created. Again,
	 *     this helps the adapter differentiate the newly created record in
	 *     case other records of the same type were side-loaded.
	 *
	 * To determine whether those meta attributes are required or not, the
	 * `requestType` option can be used. The built-in Ember-Graph adapters
	 * will pass one of the following values: `findRecord`, `findMany`,
	 * `findAll`, `findQuery`, `createRecord`, `updateRecord`, `deleteRecord`.
	 * If the value is `findQuery`, then the `queryIds` meta attribute is
	 * required. If the value is `createRecord`, then the `newId` meta
	 * attribute is required.
	 *
	 * TODO: Implement...
	 *
	 * There's also an optional attribute that can be given for any call:
	 *
	 * - `deletedRecords`: This attribute is given to the store to let it
	 *     know that records were deleted from the server and that the store
	 *     should unload them. This allows you to remove records from the
	 *     store as easily as you can add them. The format of this attribute
	 *     can be seen in the example below:
	 *
	 * ```json
	 * {
	 *     "deletedRecords": [
	 *         { typeKey: "user", id: "3" },
	 *         { typeKey: "post", id: "10" },
	 *         { typeKey: "post", id: "11" },
	 *         { typeKey: "tag", id: "674" }
	 *     ]
	 * }
	 * ```
	 *
	 * In addition to `requestType`, the following options are available:
	 *
	 * - `recordType`: The type of record that the request was performed on
	 * - `id`:  The ID of the record referred to by a `findRecord`,
	 *     `updateRecord` or `deleteRecord` request
	 * - `ids`: The IDs of the records requested by a `findMany` request
	 * - `query`: The query submitted to the `findQuery` request
	 *
	 * @method deserialize
	 * @param {JSON} payload
	 * @param {Object} [options] Any options that were passed by the adapter
	 * @return {Object} Normalized JSON payload
	 * @abstract
	 */
	deserialize: EG.abstractMethod('deserialize')
});
