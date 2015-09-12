import Ember from 'ember';
import EmberGraphAdapter from 'ember-graph/adapter/ember_graph/adapter';

const Promise = Ember.RSVP.Promise;

/**
 * This adapter stores all of your changes in memory, mainly for testing
 * purposes. To initialize the memory with an initial data set, override
 * the {{link-to-method 'MemoryAdapter' 'getInitialPayload'}} hook to
 * return the data that you want to load into memory.
 *
 * To customize the the behavior for getting or saving records, you can
 * override any of the following methods:
 * {{link-to-method 'MemoryAdapter' 'serverFindRecord'}},
 * {{link-to-method 'MemoryAdapter' 'serverFindMany'}},
 * {{link-to-method 'MemoryAdapter' 'serverFindAll'}},
 * {{link-to-method 'MemoryAdapter' 'serverCreateRecord'}},
 * {{link-to-method 'MemoryAdapter' 'serverDeleteRecord'}},
 * {{link-to-method 'MemoryAdapter' 'serverUpdateRecord'}}.
 *
 * @class MemoryAdapter
 * @extends EmberGraphAdapter
 */
export default EmberGraphAdapter.extend({

	database: null,

	getDatabase: function() {
		try {
			var database = this.get('database');

			if (database) {
				return Promise.resolve(database);
			} else {
				return Promise.resolve({ records: {}, relationships: [] });
			}
		} catch (error) {
			return Promise.reject(error);
		}
	},

	setDatabase: function(database) {
		try {
			this.set('database', database);
			return Promise.resolve(database);
		} catch (error) {
			return Promise.reject(error);
		}
	},

	shouldInitializeDatabase: function() {
		return true;
	},

	/**
	 * Initializes the database (if configured to do so).
	 * This function is called at adapter initialization
	 * (which is probably when it's looked up by the container).
	 *
	 * @method initializeDatabase
	 * @private
	 */
	initializeDatabase: function() {
		this._super();
	},

	initializeDatabaseOnInit: Ember.on('init', function() {
		this.initializeDatabase();
	})

});