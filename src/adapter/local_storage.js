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
				return Promise.resolve(this.get('emptyDatabase'));
			}
		} catch (error) {
			return Promise.reject(error);
		}
	},

	setDatabase: function(db) {
		try {
			var key = this.get('localStorageKey');
			localStorage[key] = JSON.stringify(db);
			return Promise.resolve();
		} catch (error) {
			return Promise.reject(error);
		}
	}

});