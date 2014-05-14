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

		if (!JSON.parse(localStorage['ember-graph.models.initialized'] || 'false')) {
			var store = this.get('store');
			var adapter = EG.FixtureAdapter.create({ store: store });
			this.get('fixtures').forEach(function(typeKey) {
				(store.modelForType(typeKey).FIXTURES || []).forEach(function(fixture) {
					var id = fixture.id;
					var json = JSON.stringify(adapter._getRecord(typeKey, id));
					localStorage['ember-graph.models.' + typeKey + '.' + id] = json;
				}, this);
			}, this);
		}

		localStorage['ember-graph.models.initialized'] = 'true';

		return this._super();
	},

	/**
	 * @param {String} typeKey
	 * @param {String} id
	 * @return {Object} Serialized JSON Object
	 * @private
	 */
	_getRecord: function(typeKey, id) {
		var recordString = localStorage['ember-graph.models.' + typeKey + '.' + id];

		if (Em.typeOf(recordString) === 'string') {
			return JSON.parse(recordString);
		} else {
			return null;
		}
	},

	/**
	 * @param {String} typeKey
	 * @returns {Object[]} Serialized JSON Objects
	 * @private
	 */
	_getRecords: function(typeKey) {
		return Em.keys(localStorage).filter(function(key) {
			return EG.String.startsWith(key, 'ember-graph.models.' + typeKey);
		}).map(function(key) {
			var parts = (/ember-graph\.models\.(.+)\.(.+)/g).exec(key);
			return this._getRecord(parts[1], parts[2]);
		}, this);
	},

	/**
	 * @param {Model} record
	 * @private
	 */
	_setRecord: function(record) {
		var json = this.serialize(record, { includeId: true });
		localStorage['ember-graph.models.' + record.typeKey + '.' + json.id] = JSON.stringify(json);
	},

	/**
	 * @param {String} typeKey
	 * @param {String} id
	 * @private
	 */
	_deleteRecord: function(typeKey, id) {
		delete localStorage['ember-graph.models.' + typeKey + '.' + id];
	}
});