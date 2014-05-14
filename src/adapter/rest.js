/**
 * An adapter that communicates with REST back-ends.
 *
 * @class RESTAdapter
 * @extends Adapter
 */
EG.RESTAdapter = EG.Adapter.extend({

	/**
	 * Sends a `POST` request to `/{pluralized_type}` with the serialized record as the body.
	 *
	 * @method createRecord
	 * @param {Model} record
	 * @returns {Promise} A promise that resolves to the created record
	 */
	createRecord: function(record) {
		var url = this._buildUrl(record.typeKey, null);
		var json = this.serialize(record, { includeId: false });

		return this._ajax(url, 'POST', {}, json).then(function(payload) {
			return this.deserialize(payload, { isCreatedRecord: true });
		}.bind(this));
	},

	/**
	 * Sends a `GET` request to `/{singularized_type}/{id}`.
	 *
	 * @method findRecord
	 * @param {String} typeKey
	 * @param {String} id
	 * @returns {Promise} A promise that resolves to the requested record
	 */
	findRecord: function(typeKey, id) {
		var url = this._buildUrl(typeKey, id);

		return this._ajax(url, 'GET').then(function(payload) {
			return this.deserialize(payload);
		}.bind(this));
	},

	/**
	 * Sends a `GET` request to `/{singularized_type}/{id},{id},{id}`
	 *
	 * @method findMany
	 * @param {String} typeKey
	 * @param {String[]} ids
	 * @returns {Promise} A promise that resolves to an array of requested records
	 */
	findMany: function(typeKey, ids) {
		var url = this._buildUrl(typeKey, ids.join(','));

		return this._ajax(url, 'GET').then(function(payload) {
			return this.deserialize(payload);
		}.bind(this));
	},

	/**
	 * Sends a `GET` request to `/{pluralized_type}`.
	 *
	 * @method findAll
	 * @param {String} typeKey
	 * @returns {Promise} A promise that resolves to an array of requested records
	 */
	findAll: function(typeKey) {
		var url = this._buildUrl(typeKey, null);

		return this._ajax(url, 'GET').then(function(payload) {
			return this.deserialize(payload);
		}.bind(this));
	},

	/**
	 * Sends a `GET` request to `/{pluralized_type}?option=value`.
	 *
	 * @method findQuery
	 * @param {String} typeKey
	 * @param {Object} query An object with query parameters to serialize into the URL
	 * @returns {Promise} A promise that resolves to an array of requested records
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
	 * Sends a `PUT` request to `/{singularized_type}/{id}` with the serialized record as the body.
	 *
	 * @method updateRecord
	 * @param {Model} record
	 * @returns {Promise} A promise that resolves to the updated record
	 */
	updateRecord: function(record) {
		var url = this._buildUrl(record.typeKey, record.get('id'));
		var json = this.serialize(record, { includeId: true });

		return this._ajax(url, 'PUT', {}, json).then(function(payload) {
			return this.deserialize(payload);
		}.bind(this));
	},

	/**
	 * Sends a `DELETE` request to `/{singularized_type}/{id}`.
	 *
	 * @method deleteRecord
	 * @param {Model} record
	 * @returns {Promise} A promise that resolves on success and rejects on failure
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
	 * typeKey given (`/user/52`). If no ID is provided (or is null), it uses
	 * the plural version of the typeKey given (`/users`). Either way, it
	 * appends the options passed in as query parameters. The options must
	 * be strings, but they don't have to be escaped, this function will do that.
	 *
	 * @method _buildUrl
	 * @param {String} typeKey
	 * @param {String} id
	 * @param {Object} [options]
	 * @returns {String}
	 * @protected
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
	 * @property prefix
	 * @protected
	 */
	prefix: Em.computed(function() {
		return '';
	}).property(),

	/**
	 * This method sends the request to the server.
	 * The response is processed in the Ember run-loop.
	 *
	 * @method _ajax
	 * @param {String} url
	 * @param {String} verb `GET`, `POST`, `PUT` or `DELETE`
	 * @param {Object} [headers]
	 * @param {String} [body]
	 * @returns {Promise}
	 * @protected
	 */
	_ajax: function(url, verb, headers, body) {
		return new Em.RSVP.Promise(function(resolve, reject) {
			$.ajax({
				cache: false,
				contentType: 'application/json',
				data: (body === undefined ? undefined : (Em.typeOf(body) === 'string' ? body : JSON.stringify(body))),
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