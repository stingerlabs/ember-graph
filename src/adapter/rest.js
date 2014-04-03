EG.RESTAdapter = EG.Adapter.extend({

	/**
	 * Persists a record to the server. This method returns normalized JSON
	 * as the other methods do, but the normalized JSON must contain one
	 * extra field. It must contain an `id` field that represents the
	 * permanent ID of the record that was created. This helps distinguish
	 * it from any other records of that same type that may have been
	 * returned from the server.
	 *
	 * @param {Model} record The record to persist
	 * @returns {Promise} A promise that resolves to normalized JSON
	 */
	createRecord: function(record) {
		var url = this._buildUrl(record.typeKey, null);
		var json = this.serialize(record, { includeId: false });

		return this._ajax(url, 'POST', {}, json).then(function(payload) {
			return this.deserialize(payload, { isCreatedRecord: true });
		}.bind(this));
	},

	/**
	 * Fetch a record from the server.
	 *
	 * @param {String|} typeKey
	 * @param {String} id The ID of the record to fetch
	 * @returns {Promise} A promise that resolves to normalized JSON
	 */
	findRecord: function(typeKey, id) {
		var url = this._buildUrl(typeKey, id);

		return this._ajax(url, 'GET').then(function(payload) {
			return this.deserialize(payload);
		}.bind(this));
	},

	/**
	 * The same as find, only it should load several records. The
	 * promise can return any type of enumerable containing the records.
	 *
	 * @param {String} typeKey
	 * @param {String[]} ids Enumerable of IDs
	 * @returns {Promise} A promise that resolves to normalized JSON
	 */
	findMany: function(typeKey, ids) {
		var url = this._buildUrl(typeKey, ids.join());

		return this._ajax(url, 'GET').then(function(payload) {
			return this.deserialize(payload);
		}.bind(this));
	},

	/**
	 * The same as find, only it should load all records of the given type.
	 * The promise can return any type of enumerable containing the records.
	 *
	 * @param {String} typeKey
	 * @returns {Promise} A promise that resolves to normalized JSON
	 */
	findAll: function(typeKey) {
		var url = this._buildUrl(typeKey, null);

		return this._ajax(url, 'GET').then(function(payload) {
			return this.deserialize(payload);
		}.bind(this));
	},

	/**
	 * This method returns normalized JSON as the other methods do, but
	 * the normalized JSON must contain one extra field. It must contain
	 * an `ids` field that represents the IDs of the records that matched
	 * the query. This helps distinguish them from any other records of
	 * that same type that may have been returned from the server.
	 *
	 * @param {String} typeKey
	 * @param {Object} query The query parameters that were passed into `find` earlier
	 * @returns {Promise} A promise that resolves to normalized JSON
	 */
	findQuery: function(typeKey, query) {
		var options = {};

		Em.keys(query).forEach(function(key) {
			options[key] = '' + query[key];
		});

		var url = this._buildUrl(typeKey, null, options);

		return this._ajax(url, 'GET').then(function(payload) {
			return this.deserialize(payload, { isQuery: true });
		}.bind(this));
	},

	/**
	 * Update the given record.
	 *
	 * @param {Model} record The model to save
	 * @returns {Promise} A promise that resolves to normalized JSON
	 */
	updateRecord: function(record) {
		var url = this._buildUrl(record.typeKey, record.get('id'));
		var json = this.serialize(record, { includeId: true });

		return this._ajax(url, 'PUT', {}, json).then(function(payload) {
			return this.deserialize(payload);
		}.bind(this));
	},

	/**
	 * Update the given record.
	 *
	 * @param {Model} record The model to save
	 * @returns {Promise} A promise that resolves to normalized JSON
	 */
	deleteRecord: function(record) {
		var url = this._buildUrl(record.typeKey, record.get('id'));

		return this._ajax(url, 'DELETE').then(function(payload) {
			return this.deserialize(payload) || {};
		}.bind(this));
	},

	/**
	 * This function will build the URL that the request will be posted to.
	 * If an ID is provided, it will used the singular version of the
	 * typeKey given (`/user/52`). If no ID is provided, it uses the plural
	 * version of the typeKey given (`/users`). Either way, it appends the
	 * options passed in as query parameters. The options must be strings,
	 * but they don't have to be escaped, this function will do that.
	 *
	 * @param {String} typeKey
	 * @param {String} id
	 * @param {Object.<String,String>} [options]
	 * @returns {String}
	 * @private
	 */
	_buildUrl: function(typeKey, id, options) {
		var url = this.get('prefix') + '/';

		if (id) {
			url += (typeKey + '/' + id);
		} else {
			url += EG.String.pluralize(typeKey);
		}

		if (options) {
			Em.keys(options).forEach(function(key, index) {
				url += ((index === 0) ? '?' : '&') + key + '=' + encodeURIComponent(options[key]);
			});
		}

		return url;
	},

	/**
	 * This hook is called by the adapter when forming the URL for requests.
	 * The adapter normally makes requests to the current location. So the URL
	 * looks like `/user/6`. If you want to add a different host, or a prefix,
	 * override this hook.
	 *
	 * Warning: Do NOT put a trailing slash. The adapter won't check for
	 * mistakes, so just don't do it.
	 *
	 * @private
	 */
	prefix: Em.computed(function() {
		return '';
	}).property(),

	/**
	 * This method sends the request to the server.
	 * The response is processed in the Ember run-loop.
	 *
	 * @param {String} url
	 * @param {String} verb GET, POST, PUT or DELETE
	 * @param {Object.<String, String>} [headers]
	 * @param {String} [body]
	 * @returns {Promise}
	 * @private
	 */
	_ajax: function(url, verb, headers, body) {
		return new Em.RSVP.Promise(function(resolve, reject) {
			$.ajax({
				cache: false,
				contentType: 'application/json',
				data: (body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body))),
				headers: headers || {},
				processData: false,
				type: verb,
				url: url,

				error: function(jqXHR, textStatus, error) {
					Em.run(null, reject, error);
				},

				success: function(data, status, jqXHR) {
					Em.run(null, resolve, data);
				}
			});
		});
	}
});