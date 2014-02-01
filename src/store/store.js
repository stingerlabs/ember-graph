/**
 * The store is used to manage all records in the application.
 * Ideally, there should only be one store for an application.
 *
 * @type {Store}
 */
Eg.Store = Em.Object.extend({

	/**
	 * The adapter used by the store to communicate with the server.
	 * This should be overridden by `create` or `extend`.
	 */
	adapter: null,

	/**
	 * Registers records with the store, so they can be cached and fetched
	 * in other places. You should only load a record into one store at a time.
	 *
	 * @param {Model|Enumerable} records The record(s) to load into the store
	 */
	loadRecord: function(records) {

	},

	/**
	 * Fetches a record, either from the cache or from the server. If the ID
	 * is omitted, it attempts to find all records of that type. If the ID
	 * is a list of IDs, it will fetch all of the records. If the ID is an object,
	 * it will pass the object along as query parameters. A single ID will return
	 * a PromiseObject, all others return a PromiseArray.
	 *
	 * @param {String|Model} type
	 * @param {String|Enumerable|Object} id
	 * @returns {PromiseObject|PromiseArray}
	 */
	findRecord: function(type, id) {

	},

	/**
	 * Returns true if the record is cached in the store.
	 *
	 * @param {String|Model} type
	 * @param {String} id
	 * @returns {Boolean}
	 */
	hasRecord: function(type, id) {

	},

	/**
	 * @param {Model} record
	 * @returns {Promise}
	 */
	saveRecord: function(record) {

	},

	/**
	 * @param {Model} record
	 * @returns {Promise}
	 */
	deleteRecord: function(record) {

	}
});

Eg.Store.reopenClass({

	/**
	 * The number of milliseconds after a record in the cache expires
	 * and must be re-fetched from the server.
	 */
	cacheTimeout: 0
});
