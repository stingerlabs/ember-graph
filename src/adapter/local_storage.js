import Ember from 'ember';
import EmberGraphAdapter from 'ember-graph/adapter/ember_graph/adapter';

const Promise = Ember.RSVP.Promise;

/**
 * This adapter will store all of your application data in the browser's
 * localStorage. This adapter can be useful for caching data on the client,
 * or for testing purposes. If you want to initialize the localStorage
 * with an initial data set, override the
 * {{link-to-method 'LocalStorageAdapter' 'shouldInitializeDatabase'}} and
 * {{link-to-method 'LocalStorageAdapter' 'getInitialPayload'}} hooks.
 *
 * To customize the the behavior for getting or saving records, you can
 * override any of the following methods:
 * {{link-to-method 'LocalStorageAdapter' 'serverFindRecord'}},
 * {{link-to-method 'LocalStorageAdapter' 'serverFindMany'}},
 * {{link-to-method 'LocalStorageAdapter' 'serverFindAll'}},
 * {{link-to-method 'LocalStorageAdapter' 'serverCreateRecord'}},
 * {{link-to-method 'LocalStorageAdapter' 'serverDeleteRecord'}},
 * {{link-to-method 'LocalStorageAdapter' 'serverUpdateRecord'}}.
 *
 * @class LocalStorageAdapter
 * @extends EmberGraphAdapter
 */
export default EmberGraphAdapter.extend({

	/**
	 * @property localStorageKey
	 * @default 'ember-graph.db'
	 * @final
	 * @protected
	 */
	localStorageKey: 'ember-graph.db',

	getDatabase: function() {
		try {
			var key = this.get('localStorageKey');
			var value = localStorage[key];

			if (value) {
				return Promise.resolve(JSON.parse(value));
			} else {
				return Promise.resolve({ records: {}, relationships: [] });
			}
		} catch (error) {
			return Promise.reject(error);
		}
	},

	setDatabase: function(db) {
		try {
			var key = this.get('localStorageKey');
			localStorage[key] = JSON.stringify(db);
			return Promise.resolve(db);
		} catch (error) {
			return Promise.reject(error);
		}
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