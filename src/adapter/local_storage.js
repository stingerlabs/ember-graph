var Promise = Em.RSVP.Promise;

/**
 * @class LocalStorageAdapter
 * @extends EmberGraphAdapter
 */
EG.LocalStorageAdapter = EG.EmberGraphAdapter.extend({

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

	initializeDatabaseOnInit: Em.on('init', function() {
		this.initializeDatabase();
	})

});