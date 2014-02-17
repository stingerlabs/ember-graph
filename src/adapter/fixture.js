var removeEmpty = function(item) {
	return !Em.isEmpty(item);
};

/**
 * @class FixtureAdapter
 */
Eg.FixtureAdapter = Eg.Adapter.extend({

	/**
	 * typeKey -> record ID -> Record
	 *
	 * @type {Object.<String, Object.<String, Object>>
	 */
	_fixtures: null,

	/**
	 * Initializes the _fixtures object.
	 */
	init: function() {
		var adapter = this._super();
		this.set('_fixtures', {});
		return adapter;
	},

	/**
	 * Register models with the adapter.
	 *
	 * @param {String} typeKey
	 * @param {Object[]} fixtures
	 */
	registerFixtures: function(typeKey, fixtures) {
		var _fixtures = this.get('_fixtures');
		_fixtures[typeKey] = _fixtures[typeKey] || {};

		var type = this.get('store').modelForType(typeKey);
		var verify = function(record) {
			if (typeof record.id !== 'string') {
				throw new Error('Fixture records must have an `id` property.');
			}

			type.eachAttribute(function(name, meta) {
				if (meta.isRequired && !record.hasOwnProperty(name)) {
					throw new Error('Your fixture record was missing the `' + name + '` property.');
				}
			});

			type.eachRelationship(function(name, meta) {
				if (meta.isRequired && !record.hasOwnProperty(name)) {
					throw new Error('Your fixture record was missing the `' + name + '` relationship.');
				}
			});
		};

		fixtures.forEach(function(record) {
			verify(record);
			_fixtures[typeKey][record.id] = record;
		}, this);
	},

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
		var json = this.serialize(record);
		this.get('_fixtures')[record.typeKey][json.id] = json;
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
		json[typeKey] = [this.get('_fixtures')[typeKey][id]].filter(removeEmpty);
		return Em.RSVP.Promise.resolve(json);
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
			return this.get('_fixtures')[typeKey][id];
		}, this).filter(removeEmpty);
		return Em.RSVP.Promise.resolve(json);
	},

	/**
	 * The same as find, only it should load all records of the given type.
	 * The promise can return any type of enumerable containing the records.
	 *
	 * @param {String} typeKey
	 * @param {String[]} ids The IDs of records of this type that the store already has
	 * @returns {Promise} A promise that resolves to normalized JSON
	 */
	findAll: function(typeKey, ids) {
		return this.findMany(typeKey, Em.keys(this.get('_fixtures')[typeKey]));
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
	 * @param {String[]} ids The IDs of records of this type that the store already has
	 * @returns {Promise} A promise that resolves to normalized JSON
	 */
	findQuery: function(typeKey, query, ids) {
		throw new Error('The fixture adapter doesn\'t implement `findQuery`.');
	},

	/**
	 * Update the given record.
	 *
	 * @param {Model} record The model to save
	 * @returns {Promise} A promise that resolves to normalized JSON
	 */
	updateRecord: function(record) {
		var json = this.serialize(record);
		this.get('_fixtures')[record.typeKey][json.id] = json;
		return Em.RSVP.Promise.resolve({});
	},

	/**
	 * Update the given record.
	 *
	 * @param {Model} record The model to save
	 * @returns {Promise} A promise that resolves to normalized JSON
	 */
	deleteRecord: function(record) {
		delete this.get('_fixtures')[record.typeKey][record.get('id')];
		return Em.RSVP.Promise.resolve({});
	},

	/**
	 * Proxies to the serializer of this class.
	 */
	serialize: function(record, options) {
		var json = {};

		json.id = record.get('id');

		record.constructor.eachAttribute(function(name, meta) {
			json[name] = record.get(name);
		});

		record.constructor.eachRelationship(function(name, meta) {
			json[name] = record.get(name);

			if (meta.kind === Eg.Model.HAS_MANY_KEY) {
				json[name] = json[name].toArray();
			}
		});

		return json;
	}
});