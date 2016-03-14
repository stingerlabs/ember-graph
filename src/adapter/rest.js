import $ from 'jquery';
import Ember from 'ember';
import Adapter from 'ember-graph/adapter/adapter';

import { pluralize } from 'ember-graph/util/inflector';
import { computed } from 'ember-graph/util/computed';

const Promise = Ember.RSVP.Promise;

/**
 * An adapter that communicates with REST back-ends. The requests made all follow the
 * {{link-to 'JSON API' 'http://jsonapi.org/format/'}} standard. Because the standard
 * is constantly evolving, you should check the documentation for the individual
 * methods to ensure that they're doing what you expect.
 *
 * @class RESTAdapter
 * @extends Adapter
 * @constructor
 */
export default Adapter.extend({

	urlLengthLimit: 2048,

	/**
	 * Sends a `POST` request to `/{pluralized_type}` with the serialized record as the body.
	 *
	 * @method createRecord
	 * @param {Model} record
	 * @return {Promise} A promise that resolves to the created record
	 */
	createRecord: function(record) {
		var _this = this;
		var typeKey = record.get('typeKey');
		var url = this.buildUrl(typeKey);
		var json = this.serialize(record, { requestType: 'createRecord', recordType: typeKey });

		return this.ajax(url, 'POST', json).then(function(payload) {
			return _this.deserialize(payload, { requestType: 'createRecord', recordType: typeKey });
		});
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
		var _this = this;
		var url = this.buildUrl(typeKey, id);

		return this.ajax(url, 'GET').then(function(payload) {
			return _this.deserialize(payload, { requestType: 'findRecord', recordType: typeKey, id: id });
		});
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
		const url = this.buildUrl(typeKey, ids.join(','));

		if (window.location.origin.length + url.length <= this.get('urlLengthLimit')) {
			return this.ajax(url, 'GET').then((payload) => {
				return this.deserialize(payload, { requestType: 'findMany', recordType: typeKey, ids: ids });
			});
		}

		const urls = this.buildMultipleUrls(typeKey, ids);
		const promises = urls.map((url) => this.ajax(url, 'GET'));

		return Promise.all(promises).then((payloads) => {
			const payload = this.mergePayloads(payloads);
			return this.deserialize(payload, { requestType: 'findMany', recordType: typeKey, ids });
		});
	},

	/**
	 * Sends a `GET` request to `/{pluralized_type}`.
	 *
	 * @method findAll
	 * @param {String} typeKey
	 * @return {Promise} A promise that resolves to an array of requested records
	 */
	findAll: function(typeKey) {
		var _this = this;
		var url = this.buildUrl(typeKey);

		return this.ajax(url, 'GET').then(function(payload) {
			return _this.deserialize(payload, { requestType: 'findAll', recordType: typeKey });
		});
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
		var _this = this;
		var options = {};

		Object.keys(query).forEach(function(key) {
			options[key] = '' + query[key];
		});

		var url = this.buildUrl(typeKey, null, options);

		return this.ajax(url, 'GET').then(function(payload) {
			return _this.deserialize(payload, { requestType: 'findQuery', recordType: typeKey, query: query });
		});
	},

	/**
	 * Sends a `PATCH` request to `/{pluralized_type}/{id}` with the record's
	 * changes serialized to JSON change operations. The change operations
	 * use the path format described by the standard. See the example below:
	 *
	 * ```json
	 * [
	 *     { op: "replace", path: "/title", value: "Getting Started With Ember-Graph" },
	 *     { op: "replace", path: "/links/author", value: "24" },
	 *     { op: "add", path: "/links/tags/-", value: "73" },
	 *     { op: "remove", path: "/links/109" }
	 * ]
	 * ```
	 *
	 * @method updateRecord
	 * @param {Model} record
	 * @return {Promise} A promise that resolves to the updated record
	 */
	updateRecord: function(record) {
		var _this = this;
		var url = this.buildUrl(record.typeKey, record.get('id'));
		var json = this.serialize(record, { requestType: 'updateRecord' });

		if (json.length <= 0) {
			return Promise.resolve();
		}

		return this.ajax(url, 'PATCH', json).then(function(payload) {
			return _this.deserialize(payload, { requestType: 'updateRecord', recordType: record.typeKey });
		});
	},

	/**
	 * Sends a `DELETE` request to `/{pluralized_type}/{id}`.
	 *
	 * @method deleteRecord
	 * @param {Model} record
	 * @return {Promise} A promise that resolves on success and rejects on failure
	 */
	deleteRecord: function(record) {
		var _this = this;
		var url = this.buildUrl(record.typeKey, record.get('id'));

		return this.ajax(url, 'DELETE').then(function(payload) {
			var options = { requestType: 'deleteRecord', recordType: record.typeKey };
			return _this.deserialize(payload, options);
		});
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
		var url = this.get('prefix') + '/' + pluralize(typeKey);

		if (id) {
			url += '/' + id;
		}

		if (options) {
			Object.keys(options).forEach(function(key, index) {
				url += ((index === 0) ? '?' : '&') + key + '=' + encodeURIComponent(options[key]);
			});
		}

		return url;
	},

	buildMultipleUrls(typeKey, ids) {
		const base = this.get('prefix') + '/' + pluralize(typeKey) + '/';
		const baseLength = (window.location.origin.length + base.length);
		const lengthLimit = this.get('urlLengthLimit');

		const idArrays = ids.reduce((idArrays, id) => {
			const idArray = idArrays[idArrays.length - 1];

			if (baseLength + idArray.join(',').length + id.length + 1 <= lengthLimit) {
				idArray.push(id);
			} else {
				idArrays.push([id]);
			}

			return idArrays;
		}, [[]]);

		return idArrays.map((idArray) => base + idArray.join(','));
	},

	mergePayloads(payloads) {
		const mergeObjects = (a, b) => {
			const merged = Ember.merge(Ember.copy(a, true), b);

			for (let key in b) {
				if (b.hasOwnProperty(key) && a.hasOwnProperty(key)) {
					if (Ember.isArray(b[key])) {
						merged[key] = a[key].concat(b[key]);
					} else if (b[key] && typeof b[key] === 'object') {
						merged[key] = mergeObjects(a[key], b[key]);
					}
				}
			}

			return merged;
		};

		return payloads.reduce(mergeObjects, {});
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
	prefix: computed({
		get() {
			return '';
		}
	}),

	/**
	 * This method sends the request to the server.
	 * The response is processed in the Ember run-loop.
	 *
	 * @method ajax
	 * @param {String} url
	 * @param {String} verb `GET`, `POST`, `PATCH` or `DELETE`
	 * @param {String} [body]
	 * @return {Promise}
	 * @protected
	 */
	ajax: function(url, verb, body) {
		var headers = this.headers(url, verb, body);

		return new Promise(function(resolve, reject) {
			$.ajax({
				cache: false,
				contentType: 'application/json',
				data: body && (Ember.typeOf(body) === 'string' ? body : JSON.stringify(body)),
				headers: headers,
				processData: false,
				type: verb,
				url: url,

				error: function(jqXHR, textStatus, error) {
					Ember.run(null, reject, error);
				},

				success: function(data, status, jqXHR) {
					Ember.run(null, resolve, data);
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
	 * @param {String} [body]
	 * @return {Object} Headers to give to jQuery `ajax` function
	 * @protected
	 */
	headers: function(url, verb, body) {
		return {};
	}
});