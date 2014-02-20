/**
 * @class LocalStorageAdapter
 */
EG.LocalStorageAdapter = EG.SynchronousAdapter.extend({

	/**
	 * If you would like to bootstrap the local storage with fixture data,
	 * put the type key of the model you would like to bootstrap in this
	 * array. For instance, if you put 'user' in the array, upon initialization,
	 * the adapter will check if it has been initialized before. If it
	 * hasn't, it will load User.FIXTURES into the local storage.
	 * This is useful for debugging purposes when you want to use fixture
	 * data, but still want the ability for changes to persist page loads.
	 *
	 * To reload the newest version of your fixture data, delete the
	 * `ember-graph.models.initialized` key in the local storage.
	 *
	 * @type {String[]}
	 */
	fixtures: [],

	init: function() {
		Em.assert('Your browser doesn\'t support localStorage functionality.', !!window.localStorage);

		localStorage['ember-graph'] = localStorage['ember-graph'] || {};
		localStorage['models'] = localStorage['models'] || {};

		if (!Em.get(localStorage, 'ember-graph.models.initialized')) {
			var store = this.get('store');
			this.get('fixtures').forEach(function(typeKey) {
				(store.modelForType(typeKey).FIXTURES || []).forEach(function(fixture) {
					this._setRecord(typeKey, fixture);
				}, this);
			}, this);
		}

		localStorage['ember-graph']['models']['initialized'] = true;
	},

	/**
	 * @param {String} typeKey
	 * @param {String} id
	 * @return {Object}
	 * @private
	 */
	_getRecord: function(typeKey, id) {
		return JSON.parse(Em.get(localStorage, 'ember-graph.models.' + typeKey + '.id') || 'null');
	},

	/**
	 * @param {String} typeKey
	 * @returns {Array}
	 * @private
	 */
	_getRecords: function(typeKey) {
		var all = Em.get(localStorage, 'ember-graph.models.' + typeKey) || {};
		return all.map(function(id) {
			return JSON.parse(all[id]);
		});
	},

	/**
	 * @param {String} typeKey
	 * @param {Object} json
	 * @private
	 */
	_setRecord: function(typeKey, json) {
		localStorage['ember-graph.models.' + typeKey] = localStorage['ember-graph.models.' + typeKey] || {};
		localStorage['ember-graph.models.' + typeKey + '.' + json.id] = JSON.stringify(json);
	},

	/**
	 * @param {String} typeKey
	 * @param {String} id
	 * @private
	 */
	_deleteRecord: function(typeKey, id) {
		localStorage['ember-graph.models.' + typeKey] = localStorage['ember-graph.models.' + typeKey] || {};
		delete localStorage['ember-graph.models.' + typeKey + '.' + id];
	}
});