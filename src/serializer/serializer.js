import Ember from 'ember';

import { abstractMethod } from 'ember-graph/util/util';

/**
 * An interface for a serializer. A serializer is used to convert
 * objects back and forth between the JSON that the server uses,
 * and the records that are used on the client side.
 *
 * @class Serializer
 */
export default Ember.Object.extend({

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
	serialize: abstractMethod('serialize'),

	/**
	 * Takes a payload from the server and converts it into a normalized
	 * JSON payload that the store can use. Details about the format
	 * can be found in the {{link-to-method 'Store' 'pushPayload'}}
	 * documentation.
	 *
	 * In addition to the format described by the store, the store
	 * may require some additional information. This information should
	 * be included in the `meta` object. The attributes required by the
	 * store are:
	 *
	 * - `matchedRecords`: This is an array of objects (with `type` and
	 *     `id` fields) that tell which records were matched on a query.
	 *     This helps distinguish queried records from records of the
	 *     same type that may have been side loaded. If this property
	 *     doesn't exist, the adapter will assume that all objects
	 *     of that type were returned by the query.
	 * - `createdRecord`: This is a single object (with `type` and `id`)
	 *     that tells the adapter which record was created as the result
	 *     of a `createRecord` request. Again, this helps distinguish
	 *     the record from other records of the same type.
	 *
	 * To determine whether those meta attributes are required or not, the
	 * `requestType` option can be used. The built-in Ember-Graph adapters
	 * will pass one of the following values: `findRecord`, `findMany`,
	 * `findAll`, `findQuery`, `createRecord`, `updateRecord`, `deleteRecord`.
	 * If the value is `findQuery`, then the `matchedRecords` meta attribute is
	 * required. If the value is `createRecord`, then the `createdRecord` meta
	 * attribute is required.
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
	deserialize: abstractMethod('deserialize')
});
