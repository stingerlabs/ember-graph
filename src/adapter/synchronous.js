var removeEmpty = function(item) {
	return !Em.isEmpty(item);
};

/**
 * @class SynchronousAdapter
 */
EG.SynchronousAdapter = Eg.Adapter.extend({
	/**
	 * @param {String} typeKey
	 * @param {String} id
	 * @return {Object} Serialized JSON Object
	 * @protected
	 */
	_getRecord: Em.required(),

	/**
	 * @param {String} typeKey
	 * @returns {Object[]} Serialized JSON Objects
	 * @protected
	 */
	_getRecords: Em.required(),

	/**
	 * @param {Model} record
	 * @protected
	 */
	_setRecord: Em.required(),

	/**
	 * @param {String} typeKey
	 * @param {String} id
	 * @protected
	 */
	_deleteRecord: Em.required(),

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
		record.set('id', Eg.util.generateGUID());
		this._setRecord(record);
		return Em.RSVP.Promise.resolve({});
	},

	/**
	 * Fetch a record from the server.
	 *
	 * @param {String|} typeKey
	 * @param {String} id The ID of the record to fetch
	 * @returns {Promise} A promise that resolves to normalized JSON
	 */
	findRecord: function(typeKey, id) {
		var json = {};
		json[typeKey] = [this._getRecord(typeKey, id)].filter(removeEmpty);
		return Em.RSVP.Promise.resolve(this.deserialize(json));
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
		var json = {};
		json[typeKey] = ids.map(function(id) {
			return this._getRecord(typeKey, id);
		}, this).filter(removeEmpty);
		return Em.RSVP.Promise.resolve(this.deserialize(json));
	},

	/**
	 * The same as find, only it should load all records of the given type.
	 * The promise can return any type of enumerable containing the records.
	 *
	 * @param {String} typeKey
	 * @returns {Promise} A promise that resolves to normalized JSON
	 */
	findAll: function(typeKey) {
		var json = {};
		json[typeKey] = this._getRecords(typeKey);
		return Em.RSVP.Promise.resolve(this.deserialize(json));
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
		throw new Error('Your adapter doesn\'t implement `findQuery`.');
	},

	/**
	 * Update the given record.
	 *
	 * @param {Model} record The model to save
	 * @returns {Promise} A promise that resolves to normalized JSON
	 */
	updateRecord: function(record) {
		this._setRecord(record);
		return Em.RSVP.Promise.resolve({});
	},

	/**
	 * Update the given record.
	 *
	 * @param {Model} record The model to save
	 * @returns {Promise} A promise that resolves to normalized JSON
	 */
	deleteRecord: function(record) {
		this._deleteRecord(record.typeKey, record.get('id'));
		return Em.RSVP.Promise.resolve({});
	}
});