/**
 * The store is used to manage all records in the application.
 * Ideally, there should only be one store for an application.
 *
 * @type {Store}
 */
Eg.Store = Em.Object.extend({

	/**
	 * The number of milliseconds after a record in the cache expires
	 * and must be re-fetched from the server.
	 */
	cacheTimeout: Infinity,

	/**
	 * Contains the records cached in the store. The keys are type names,
	 * and the values are nested objects keyed at the ID of the record.
	 */
	_records: {},

	/**
	 * Holds all currently registered model subtypes. (typeKey -> Model)
	 */
	_types: {},

	/**
	 * The adapter used by the store to communicate with the server.
	 * This should be overridden by `create` or `extend`. It can
	 * either be an adapter instance or adapter subclass.
	 *
	 * @type {Adapter}
	 */
	adapter: null,

	/**
	 * Initializes all of the variables properly
	 */
	init: function() {
		this.set('_records', {});
		this.set('_types', {});

		var adapter = this.get('adapter');

		if (adapter === null) {
			return;
		}

		if (!(adapter instanceof Eg.Adapter)) {
			this.set('adapter', adapter.create());
		}
	},

	/**
	 * Cretes a new subclass of Model.
	 *
	 * @param {String} typeKey The name of the new type
	 * @param {String} [parentKey] The parent type, if inheriting from a custom type
	 * @param {Array} [mixins] The mixins to create the type with
	 * @param {Object} options The attributes and relationships of the type
	 * @returns {Model}
	 */
	createModel: function(typeKey, parentKey, mixins, options) {
		Eg.debug.assert('The type \'' + typeKey + '\' already exists.', !this._types.hasOwnProperty(typeKey));

		options = arguments[arguments.length -1];

		var base = Eg.Model;
		if (typeof parentKey === 'string') {
			Eg.debug.assert('The type \'' + parentKey + '\' doesn\'t exist.', this._types.hasOwnProperty(parentKey));
			base = this.get('_types.' + parentKey);
		}

		mixins = (Em.isArray(mixins) ? mixins : (Em.isArray(parentKey) ? parentKey : []));

		var subclass = base._extend(typeKey, mixins, options);

		this.set('_types.' + typeKey, subclass);
		this.set('_records.' + typeKey, {});
		return subclass;
	},

	/**
	 * @param {String} typeKey
	 * @returns {Model}
	 */
	modelForType: function(typeKey) {
		Eg.debug.assert('The type \'' + typeKey + '\' doesn\'t exist.', this.get('_types').hasOwnProperty(typeKey));
		return this.get('_types.' + typeKey);
	},

	/**
	 * Creates a new record of the specified type.
	 *
	 * @param {String} typeKey
	 * @param {Object} json
	 * @returns {Model}
	 */
	createRecord: function(typeKey, json) {
		json = json || {};

		var record = this.modelForType(typeKey)._create();
		record._create(json);
		record.set('store', this);

		// TODO: Connect relationships

		this.set('_records.' + typeKey + '.' + record.get('id'), {
			record: record,
			timestamp: new Date().getTime()
		});

		return record;
	},

	/**
	 * Returns all records of the given type that are in the cache.
	 *
	 * @param {String|Model} type
	 * @returns {Array} Array of records of the given type
	 * @private
	 */
	_recordsForType: function(type) {
		var records = this.get('_records.' + type) || {};
		var timeout = new Date().getTime() - this.get('cacheTimeout');

		type = (typeof type === 'string' ? type : type.typeKey);

		return Em.keys(records).map(function(id) {
			var recordShell = records[id];

			if (recordShell.timestamp >= timeout) {
				return recordShell.record;
			} else {
				return undefined;
			}
		});
	},

	/**
	 * Fetches a record (or records), either from the cache or from the server.
	 * Options can be different types which have different functions:
	 *
	 * ID String - Fetches a single record by ID
	 * ID Enumerable - Fetches many records by the IDs
	 * Object - A query that is passed to the adapter
	 * undefined - Fetches all records of a type
	 *
	 * @param {String|Model} type
	 * @param {String|Enumerable|Object} options
	 * @returns {PromiseObject|PromiseArray}
	 */
	find: function(type, options) {
		type = (typeof type === 'string' ? type : type.typeKey);

		if (typeof options === 'string') {
			return this._findSingle(type, options);
		} else if (Em.isArray(options)) {
			return this._findMany(type, options);
		} else if (typeof options === 'object') {
			return this._findQuery(type);
		} else {
			return this._findAll(type);
		}
	},

	/**
	 * Returns the record directly if the record is cached in the store.
	 * Otherwise returns null.
	 *
	 * @param {String|Model} type
	 * @param {String} id
	 * @returns {Model}
	 * @private
	 */
	_getRecord: function(type, id) {
		type = (typeof type === 'string' ? type : type.typeKey);
		var store = this.get('_records');
		var records = store[type] || (store[type] = {});
		var timeout = new Date().getTime() - this.get('cacheTimeout');

		if (records[id]) {
			return (records[id].timestamp >= timeout ? records[id].record : null);
		} else {
			return null;
		}
	},

	/**
	 * Gets a record in the form of a promise. If the record is in
	 * the cache, the promise resolves immediately. If the record
	 * isn't in the cache, the promise will resolve when the adapter
	 * resolves it's promise to get it from the server.
	 *
	 * @param {String|Model} type
	 * @param {String} id
	 * @returns {Promise}
	 * @private
	 */
	_findSinglePromise: function(type, id) {
		var record = this._getRecord(type, id);

		if (record) {
			return Em.RSVP.Promise.resolve(record);
		} else {
			return this.get('adapter').findRecord(type, id);
		}
	},

	/**
	 * Gets a single record from the adapter as a PromiseObject.
	 * @private
	 */
	_findSingle: function(type, id) {
		return Eg.PromiseObject.create({
			promise: this._findSinglePromise(type, id)
		});
	},

	/**
	 * Gets many records from the adapter as a PromiseArray.
	 * @private
	 */
	_findMany: function(type, ids) {
		return Eg.PromiseArray.create({
			promise: Em.RSVP.Promise.all(ids.map(function(id) {
				return this._findSinglePromise(type, id);
			}, this))
		});
	},

	/**
	 * Gets all of the records of a type from the adapter as a PromiseArray.
	 * @private
	 */
	_findAll: function(type) {
		var ids = this._recordsForType(type).mapBy('id');

		return Eg.PromiseArray.create({
			promise: this.get('adapter').findAll(type, ids).then(function(value) {
				return value.toArray();
			})
		});
	},

	/**
	 * Gets records for a query from the adapter as a PromiseArray.
	 * @private
	 */
	_findQuery: function(type, options) {
		var ids = this._recordsForType(type).mapBy('id');

		return Eg.PromiseArray.create({
			promise: this.get('adapter').findQuery(type, options, ids).then(function(value) {
				return value.toArray();
			})
		});
	},

	/**
	 * Returns true if the record is cached in the store, false otherwise.
	 *
	 * @param {String|Model} type
	 * @param {String} id
	 * @returns {Boolean}
	 */
	hasRecord: function(type, id) {
		return this._getRecord(type, id) !== null;
	},

	/**
	 * @param {Model} record
	 * @returns {Promise} The new record
	 */
	saveRecord: function(record) {
		var _this = this;
		var type = record.typeKey;
		var isNew = record.get('isNew');
		var tempId = record.get('id');

		record.set('isSaving', true);

		if (isNew) {
			return this.get('adapter').createRecord(record).then(function(createdRecord) {
				record.set('isSaving', false);

				var records = _this.get('_records.' + type);

				delete records[tempId];
				records[createdRecord.get('id')] = {
					timestamp: new Date().getTime(),
					record: createdRecord
				};

				return createdRecord;
			});
		} else {
			return this.get('adapter').updateRecord(record).then(function(savedRecord) {
				record.set('isSaving', false);
				return savedRecord;
			});
		}
	},

	/**
	 * @param {Model} record
	 * @returns {Promise} True or false if the operation succeeds
	 */
	deleteRecord: function(record) {
		var type = record.typeKey;
		var id = record.get('id');
		var records = (this.get('_records.' + type) || {});

		record.set('isSaving', true);
		record.set('isDeleted', true);

		return this.get('adapter').deleteRecord(record).then(function() {
			record.set('isSaving', false);
			delete this.get('_records.' + type)[id];
		}.bind(this));
	},

	/**
	 * @param {Model} record
	 * @returns {Promise} True or false if the operation succeeds
	 */
	reloadRecord: function(record) {
		record.set('isReloading', true);

		return this.get('adapter').find(record.typeKey, record.get('id')).then(function(reloadedRecord) {
			record._reloadRecord(reloadedRecord);
			record.set('isReloading', false);
			return true;
		}).catch(function() {
			return false;
		});
	}
});
