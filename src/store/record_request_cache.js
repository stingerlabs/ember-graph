import Ember from 'ember';

export default Ember.Object.extend({

	cache: null,

	initializeCache: function() {
		this.set('cache', Ember.Object.create());
	}.on('init'),

	_getAndCreateTypeCache(typeKey) {
		if (!this.get('cache.' + typeKey)) {
			const cache = Ember.Object.create({
				all: null,
				single: {},
				multiple: {},
				query: {}
			});

			this.set(`cache.${typeKey}`, cache);
		}

		return this.get(`cache.${typeKey}`);
	},

	savePendingRequest(typeKey /* options, request */) { // eslint-disable-line no-inline-comments
		const options = (arguments.length > 2 ? arguments[1] : undefined);
		const request = (arguments.length > 2 ? arguments[2] : arguments[1]);

		switch (Ember.typeOf(options)) {
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

	_savePendingSingleRequest(typeKey, id, request) {
		const cache = this._getAndCreateTypeCache(typeKey).get('single');

		cache[id] = request;

		const callback = () => {
			cache[id] = null;
		};

		request.then(callback, callback);
	},

	_savePendingManyRequest(typeKey, ids, request) {
		const cache = this._getAndCreateTypeCache(typeKey).get('multiple');
		const idString = ids.map((id) => id + '').sort().join(',');

		cache[idString] = request;

		const callback = () => {
			cache[idString] = null;
		};

		request.then(callback, callback);
	},

	_savePendingQueryRequest(typeKey, query, request) {
		// TODO
	},

	_savePendingAllRequest(typeKey, request) {
		const cache = this._getAndCreateTypeCache(typeKey);

		cache.set('all', request);

		const callback = () => {
			cache.set('all', null);
		};

		request.then(callback, callback);
	},

	getPendingRequest(typeKey, options) {
		switch (Ember.typeOf(options)) {
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

	_getPendingSingleRequest(typeKey, id) {
		const cache = this._getAndCreateTypeCache(typeKey);

		const all = cache.get('all');
		if (all) {
			return all;
		}

		const single = cache.get('single')[id];
		if (single) {
			return single;
		}

		const multiple = cache.get('multiple');
		for (let key in multiple) {
			if (multiple.hasOwnProperty(key)) {
				if (key.split(',').indexOf(id) >= 0) {
					return multiple[key];
				}
			}
		}

		return null;
	},

	_getPendingManyRequest(typeKey, ids) {
		const cache = this._getAndCreateTypeCache(typeKey);

		const all = cache.get('all');
		if (all) {
			return all;
		}

		const idString = ids.map((id) => id + '').sort().join(',');

		const multiple = cache.get('multiple');
		for (var key in multiple) {
			if (multiple.hasOwnProperty(key)) {
				if (key === idString) {
					return multiple[key];
				}
			}
		}

		return null;
	},

	_getPendingQueryRequest(typeKey, query) {
		// TODO
		return null;
	},

	_getPendingAllRequest(typeKey) {
		var cache = this._getAndCreateTypeCache(typeKey);
		return cache.get('all') || null;
	}

});