/**
 * This is an interface that can be implemented to provide a persistence
 * engine for an Ember-Graph application. The engine doesn't have to
 * know anything about Ember-Graph or relationships in order to function,
 * it just needs to be able to store and retrieve records and relationships
 * by type and ID. If you can implement the basic storage functionality,
 * {{link-to-class 'EmberGraphDatabaseAdapter'}} will take care of ensuring
 * relationship integrity. Two good use cases are in memory and local
 * storage persistence. (Both of which come with Ember-Graph in the
 * {{link-to-class 'MemoryAdapter'}} and
 * {{link-to-class 'LocalStorageAdapter}}).
 *
 * There are two JSON data types that the persistence engine must store and
 * retrieve: records and relationships. Records holds attributes and
 * relationships hold data describing which records it links to. Examples
 * of both can be found below.
 *
 * Record:
 * ```json
 * {
 *     "id": "94",
 *     "title": "First Post",
 *     "posted_on": 1402870305305
 * }
 * ```
 *
 * Relationship:
 * ```json
 * {
 *     "id": "3",
 *     "typeKey1": "post",
 *     "id1": "94",
 *     "relationship1": "comments",
 *     "typeKey2": "comment",
 *     "id2": "160",
 *     "relationship2": "post"
 * }
 * ```
 *
 * @class EmberGraphDatabase
 * @extends Object
 * @constructor
 * @category abstract
 */
EG.EmberGraphDatabase = Em.Object.extend({

	/**
	 * Fetches a single record, along with its relationships, from
	 * the database. The resolved object should have a `record`
	 * property that holds the record, and a `relationships` property
	 * that holds all of the relationships that connect to the record.
	 *
	 * @method getRecord
	 * @param {String} typeKey
	 * @param {String} id
	 * @return {Promise}
	 */
	getRecord: EG.abstractMethod('getRecord'),

	/**
	 * Similar to {{link-to-method 'EmberGraphDatabase' 'getRecord'}},
	 * only it returns an array of objects that represent records.
	 *
	 * @method getRecords
	 * @param {String} typeKey
	 * @param {String[]} ids
	 * @return {Promise}
	 */
	getRecords: EG.abstractMethod('getRecords'),

	/**
	 * Similar to {{link-to-method 'EmberGraphDatabase' 'getRecord'}},
	 * only it returns an array of objects that contains every
	 * record of the given type.
	 *
	 * @method getRecordsOfType
	 * @param {String} typeKey
	 * @return {Promise}
	 */
	getRecordsOfType: EG.abstractMethod('getRecordsOfType'),

	/**
	 * Similar to {{link-to-method 'EmberGraphDatabase' 'getRecord'}},
	 * only it returns an array of objects that contains all of
	 * the records that matched the given query.
	 *
	 * @method queryRecords
	 * @param {String} typeKey
	 * @param {Object} query
	 * @return {Promise}
	 */
	queryRecords: EG.abstractMethod('queryRecords'),

	/**
	 * Atomically applies a set of changes. Either all of the changes
	 * should succeed or they should all fail.  If they aren't applied
	 * together, the relationships could be left in an inconsistent
	 * state.
	 *
	 * The `recordChanges` parameter is a list of objects that contain
	 * the following properties:
	 *
	 * - `typeKey`: The type of record to change.
	 * - `id`: The ID of the record to change.
	 * - `data`: The new state of the record. (If `undefined`, delete the record.)
	 *
	 * The `relationshipChanges` parameter is a list of objects that
	 * contain the following properties:
	 *
	 * - `id`: The ID of the relationship to add/delete.
	 * - `data`: The new relationship. (If `undefined`, delete the relationship.)
	 *
	 * @method applyChanges
	 * @param {Object[]} recordChanges
	 * @param {Object[]} relationshipChanges
	 * @return {Promise}
	 */
	applyChanges: EG.abstractMethod('applyChanges')

});