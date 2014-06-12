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
	 * @return {Promise} A promise that resolves to the created record
	 */
	createRecord: function(record) {
		var url = this.buildUrl(record.typeKey, null);
		var json = this.serialize(record, { requestType: 'createRecord' });

		return this.ajax(url, 'POST', json).then(function(payload) {
			return this.deserialize(payload, { requestType: 'createRecord', recordType: record.typeKey });
		}.bind(this));
	},

	/**
	 * Sends a `GET` request to `/{pluralized_type}/{id}`.
	 *
	 * @method findRecord
	 * @param {String} typeKey
	 * @param {String} id
	 * @return {Promise} A promise that resolves to the requested record
	 */
	findRecord: function(typeKey, id) {
		var url = this.buildUrl(typeKey, id);

		return this.ajax(url, 'GET').then(function(payload) {
			return this.deserialize(payload, { requestType: 'findRecord', recordType: typeKey, id: id });
		}.bind(this));
	},

	/**
	 * Sends a `GET` request to `/{pluralized_type}/{id},{id},{id}`
	 *
	 * @method findMany
	 * @param {String} typeKey
	 * @param {String[]} ids
	 * @return {Promise} A promise that resolves to an array of requested records
	 */
	findMany: function(typeKey, ids) {
		var url = this.buildUrl(typeKey, ids.join(','));

		return this.ajax(url, 'GET').then(function(payload) {
			return this.deserialize(payload, { requestType: 'findMany', recordType: typeKey, ids: ids });
		}.bind(this));
	},

	/**
	 * Sends a `GET` request to `/{pluralized_type}`.
	 *
	 * @method findAll
	 * @param {String} typeKey
	 * @return {Promise} A promise that resolves to an array of requested records
	 */
	findAll: function(typeKey) {
		var url = this.buildUrl(typeKey, null);

		return this.ajax(url, 'GET').then(function(payload) {
			return this.deserialize(payload, { requestType: 'findAll', recordType: typeKey });
		}.bind(this));
	},

	/**
	 * Sends a `GET` request to `/{pluralized_type}?option=value`.
	 *
	 * @method findQuery
	 * @param {String} typeKey
	 * @param {Object} query An object with query parameters to serialize into the URL
	 * @return {Promise} A promise that resolves to an array of requested records
	 */
	findQuery: function(typeKey, query) {
		var options = {};

		Em.keys(query).forEach(function(key) {
			options[key] = '' + query[key];
		});

		var url = this.buildUrl(typeKey, null, options);

		return this.ajax(url, 'GET').then(function(payload) {
			return this.deserialize(payload, { requestType: 'findQuery', recordType: typeKey, query: query });
		}.bind(this));
	},

	/**
	 * Sends a `PATCH` request to `/{pluralized_type}/{id}` with the record's
	 * changes serialized to JSON change operations.
	 *
	 * @method updateRecord
	 * @param {Model} record
	 * @return {Promise} A promise that resolves to the updated record
	 */
	updateRecord: function(record) {
		var url = this.buildUrl(record.typeKey, record.get('id'));
		var json = this.serialize(record, { requestType: 'updateRecord' });

		if (json.length <= 0) {
			return Em.RSVP.resolve();
		}

		return this.ajax(url, 'PATCH', json).then(function(payload) {
			return this.deserialize(payload, { requestType: 'updateRecord', recordType: record.typeKey });
		}.bind(this));
	},

	/**
	 * Sends a `DELETE` request to `/{singularized_type}/{id}`.
	 *
	 * @method deleteRecord
	 * @param {Model} record
	 * @return {Promise} A promise that resolves on success and rejects on failure
	 */
	deleteRecord: function(record) {
		var url = this.buildUrl(record.typeKey, record.get('id'));

		return this.ajax(url, 'DELETE').then(function(payload) {
			var options = { requestType: 'deleteRecord', recordType: record.typeKey };
			return this.deserialize(payload, options);
		}.bind(this));
	},

	/**
	 * This function will build the URL that the request will be posted to.
	 * The options must be strings, but they don't have to be escaped,
	 * this function will do that.
	 *
	 * @method buildUrl
	 * @param {String} typeKey
	 * @param {String} [id]
	 * @param {Object} [options]
	 * @return {String}
	 * @protected
	 */
	buildUrl: function(typeKey, id, options) {
		var url = this.get('prefix') + '/' + EG.String.pluralize(typeKey);

		if (id) {
			url += '/' + id;
		}

		if (options) {
			Em.keys(options).forEach(function(key, index) {
				url += ((index === 0) ? '?' : '&') + key + '=' + encodeURIComponent(options[key]);
			});
		}

		return url;
	},

	/**
	 * This property is used by the adapter when forming the URL for requests.
	 * The adapter normally makes requests to the current location. So the URL
	 * looks like `/users/6`. If you want to add a different host, or a prefix,
	 * override this property.
	 *
	 * Warning: Do **not** include a trailing slash. The adapter won't check for
	 * mistakes, so just don't do it.
	 *
	 * @property prefix
	 * @type String
	 * @default ''
	 */
	prefix: Em.computed(function() {
		return '';
	}).property(),

	/**
	 * This method sends the request to the server.
	 * The response is processed in the Ember run-loop.
	 *
	 * @method ajax
	 * @param {String} url
	 * @param {String} verb `GET`, `POST`, `PATCH` or `DELETE`
	 * @param {String} [body=undefined]
	 * @return {Promise}
	 * @protected
	 */
	ajax: function(url, verb, body) {
		var headers = this.headers(url, verb, body);

		return new Em.RSVP.Promise(function(resolve, reject) {
			$.ajax({
				cache: false,
				contentType: 'application/json',
				data: (body === undefined ? undefined : (Em.typeOf(body) === 'string' ? body : JSON.stringify(body))),
				headers: headers,
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
	},

	/**
	 * This is a small hook to allow including extra headers in the AJAX request.
	 *
	 * @method headers
	 * @param {String} url
	 * @param {String} verb `GET`, `POST`, `PATCH` or `DELETE`
	 * @param {String} [body=undefined]
	 * @return {Object} Headers to give to jQuery `ajax` function
	 * @protected
	 */
	headers: function(url, verb, body) {
		return {};
	}
});