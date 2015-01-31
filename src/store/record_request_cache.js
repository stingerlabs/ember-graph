EG.RecordRequestCache = Em.Object.extend({

	cache: null,

	initializeCache: function() {
		this.set('cache', Ember.Object.create());
	}.on('init'),

	_getAndCreateTypeCache: function(typeKey) {
		if (!this.get('cache.' + typeKey)) {
			var cache = Em.Object.create({
				all: null,
				single: {},
				multiple: {},
				query: {}
			});

			this.set('cache.' + typeKey, cache);
		}

		return this.get('cache.' + typeKey);
	},

	savePendingRequest: function(typeKey /*, options, request */) {
		var options = (arguments.length > 2 ? arguments[1] : undefined);
		var request = (arguments.length > 2 ? arguments[2] : arguments[1]);

		switch(Em.typeOf(options)) {
			case 'string':
			case 'number':
				this._savePendingSingleRequest(typeKey, options + '', request);
				break;
			case 'array':
				this._savePendingManyRequest(typeKey, options.toArray(), request);
				break;
			case 'object':
				this._savePendingQueryRequest(typeKey, options, request);
				break;
			case 'undefined':
				this._savePendingAllRequest(typeKey, request);
				break;
		}
	},

	_savePendingSingleRequest: function(typeKey, id, request) {
		var cache = this._getAndCreateTypeCache(typeKey).get('single');

		cache[id] = request;

		var callback = function() {
			cache[id] = null;
		};

		request.then(callback, callback);
	},

	_savePendingManyRequest: function(typeKey, ids, request) {
		var cache = this._getAndCreateTypeCache(typeKey).get('multiple');
		var idString = ids.map(function(id) {
			return id + '';
		}).sort().join(',');

		cache[idString] = request;

		var callback = function() {
			cache[idString] = null;
		};

		request.then(callback, callback);
	},

	_savePendingQueryRequest: function(typeKey, query, request) {
		// TODO
	},

	_savePendingAllRequest: function(typeKey, request) {
		var cache = this._getAndCreateTypeCache(typeKey);

		cache.set('all', request);

		var callback = function() {
			cache.set('all', null);
		};

		request.then(callback, callback);
	},

	getPendingRequest: function(typeKey, options) {
		switch (Em.typeOf(options)) {
			case 'string':
			case 'number':
				return this._getPendingSingleRequest(typeKey, options + '');
			case 'array':
				return this._getPendingManyRequest(typeKey, options.toArray());
			case 'object':
				return this._getPendingQueryRequest(typeKey, options);
			case 'undefined':
				return this._getPendingAllRequest(typeKey);
			default:
				return null;
		}
	},

	_getPendingSingleRequest: function(typeKey, id) {
		var cache = this._getAndCreateTypeCache(typeKey);

		var all = cache.get('all');
		if (all) {
			return all;
		}

		var single = cache.get('single')[id];
		if (single) {
			return single;
		}

		var multiple = cache.get('multiple');
		for (var key in multiple) {
			if (multiple.hasOwnProperty(key)) {
				if (key.split(',').indexOf(id) >= 0) {
					return multiple[key];
				}
			}
		}

		return null;
	},

	_getPendingManyRequest: function(typeKey, ids) {
		var cache = this._getAndCreateTypeCache(typeKey);

		var all = cache.get('all');
		if (all) {
			return all;
		}

		var idString = ids.map(function(id) {
			return id + '';
		}).sort().join(',');

		var multiple = cache.get('multiple');
		for (var key in multiple) {
			if (multiple.hasOwnProperty(key)) {
				if (key === idString) {
					return multiple[key];
				}
			}
		}

		return null;
	},

	_getPendingQueryRequest: function(typeKey, query) {
		// TODO
		return null;
	},

	_getPendingAllRequest: function(typeKey) {
		var cache = this._getAndCreateTypeCache(typeKey);
		return cache.get('all') || null;
	}

});