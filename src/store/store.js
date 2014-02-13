/**
 * The store is used to manage all records in the application.
 * Ideally, there should only be one store for an application.
 *
 * @type {Store}
 */
Eg.Store = Em.Object.extend({

	/**
	 * The number of milliseconds after a record in the cache expires
	 * and must be re-fetched from the server. Leave at Infinity for
	 * now, as finite timeouts will likely cause a lot of bugs.
	 */
	cacheTimeout: Infinity,

	/**
	 * Contains the records cached in the store. The keys are type names,
	 * and the values are nested objects keyed at the ID of the record.
	 *
	 * @type {Object.<String, Model>}
	 */
	_records: null,

	/**
	 * Holds all currently registered model subtypes. (typeKey -> Model)
	 *
	 * @type {Object.<String, Model>}
	 */
	_types: null,

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
		this.set('_queuedRelationships', {});

		var adapter = this.get('adapter');

		if (adapter === null) {
			return;
		}

		if (!(adapter instanceof Eg.Adapter)) {
			this.set('adapter', adapter.create());
		}

		this.set('adapter.store', this);
	},

	/**
	 * Creates a new subclass of Model.
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
	 * Creates a record of the specified type. If the JSON has an ID,
	 * then the record 'created' is a permanent record from the server.
	 * If it contains no ID, the store assumes that it's new.
	 *
	 * @param {String} typeKey
	 * @param {Object} json
	 * @returns {Model}
	 */
	createRecord: function(typeKey, json) {
		json = json || {};

		var record = this.modelForType(typeKey)._create();
		record.set('store', this);
		record.set('id', Eg.Model.temporaryIdPrefix + Eg.util.generateGUID());

		this.set('_records.' + typeKey + '.' + record.get('id'), {
			record: record,
			timestamp: new Date().getTime()
		});

		record._loadData(json);

		return record;
	},

	/**
	 * Loads an already created record into the store. This method
	 * should probably only be used by the store or adapter.
	 *
	 * @param typeKey
	 * @param json
	 */
	_loadRecord: function(typeKey, json) {
		var record = this.modelForType(typeKey)._create();
		record.set('store', this);
		record.set('id', json.id);

		this.set('_records.' + typeKey + '.' + json.id, {
			record: record,
			timestamp: new Date().getTime()
		});

		if (this._hasQueuedRelationships(typeKey, json.id)) {
			this._connectQueuedRelationships(record);
		}

		record._loadData(json);

		return record;
	},

	/**
	 * Returns all records of the given type that are in the cache.
	 *
	 * @param {String} typeKey
	 * @returns {Array} Array of records of the given type
	 * @private
	 */
	_recordsForType: function(typeKey) {
		var records = this.get('_records.' + typeKey) || {};
		var timeout = new Date().getTime() - this.get('cacheTimeout');

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
	 * @param {String} typeKey
	 * @param {String|String[]|Object} options
	 * @returns {PromiseObject|PromiseArray}
	 */
	find: function(typeKey, options) {
		if (typeof options === 'string') {
			return this._findSingle(typeKey, options);
		} else if (Em.isArray(options)) {
			return this._findMany(typeKey, options);
		} else if (typeof options === 'object') {
			return this._findQuery(typeKey, options);
		} else {
			return this._findAll(typeKey);
		}
	},

	/**
	 * Returns the record directly if the record is cached in the store.
	 * Otherwise returns null.
	 *
	 * @param {String} typeKey
	 * @param {String} id
	 * @returns {Model}
	 * @private
	 */
	getRecord: function(typeKey, id) {
		var store = this.get('_records');
		var records = store[typeKey] || (store[typeKey] = {});
		var timeout = new Date().getTime() - this.get('cacheTimeout');

		if (records[id]) {
			return (records[id].timestamp >= timeout ? records[id].record : null);
		} else {
			return null;
		}
	},

	/**
	 * Gets a single record from the adapter as a PromiseObject.
	 *
	 * @param {String} type
	 * @param {String} id
	 * @return {PromiseObject}
	 * @private
	 */
	_findSingle: function(type, id) {
		var record = this.getRecord(type, id);
		var promise;

		if (record) {
			promise = Em.RSVP.Promise.resolve(record);
		} else {
			promise = this.get('adapter').findRecord(type, id).then(function(payload) {
				this._extractPayload(payload);
				return this.getRecord(type, id);
			}.bind(this));
		}

		return Eg.PromiseObject.create({ promise: promise });
	},

	/**
	 * Gets many records from the adapter as a PromiseArray.
	 *
	 * @param {String} type
	 * @param {String[]} ids
	 * @returns {PromiseArray}
	 * @private
	 */
	_findMany: function(type, ids) {
		ids = ids || [];
		var set = new Em.Set(ids);

		ids.forEach(function(id) {
			if (this.getRecord(type, id) !== null) {
				set.removeObject(id);
			}
		}, this);

		var promise;

		if (set.length === 0) {
			promise = Em.RSVP.Promise.resolve(ids.map(function(id) {
				return this.getRecord(type, id);
			}, this));
		} else {
			promise = this.get('adapter').findMany(type, set.toArray()).then(function(payload) {
				this._extractPayload(payload);

				return ids.map(function(id) {
					return this.getRecord(type, id);
				}, this).toArray();
			}.bind(this));
		}

		return Eg.PromiseArray.create({ promise: promise });
	},

	/**
	 * Gets all of the records of a type from the adapter as a PromiseArray.
	 *
	 * @param {String} type
	 * @returns {PromiseArray}
	 * @private
	 */
	_findAll: function(type) {
		var ids = this._recordsForType(type).mapBy('id');
		var promise = this.get('adapter').findAll(type, ids).then(function(payload) {
			this._extractPayload(payload);
			return this._recordsForType(type);
		}.bind(this));

		return Eg.PromiseArray.create({ promise: promise });
	},

	/**
	 * Gets records for a query from the adapter as a PromiseArray.
	 *
	 * @param {String} typeKey
	 * @param {Object} options
	 * @returns {PromiseArray}
	 * @private
	 */
	_findQuery: function(typeKey, options) {
		var currentIds = this._recordsForType(typeKey).mapBy('id');
		var promise = this.get('adapter').findQuery(typeKey, options, currentIds).then(function(payload) {
			var ids = payload.ids;
			delete payload.ids;
			this._extractPayload(payload);

			return ids.map(function(id) {
				return this.getRecord(typeKey, id);
			}, this);
		}.bind(this));

		return Eg.PromiseArray.create({ promise: promise });
	},

	/**
	 * Returns true if the record is cached in the store, false otherwise.
	 *
	 * @param {String|Model} type
	 * @param {String} id
	 * @returns {Boolean}
	 */
	hasRecord: function(type, id) {
		return this.getRecord(type, id) !== null;
	},

	/**
	 * @param {Model} record
	 * @returns {Promise} The saved record
	 */
	saveRecord: function(record) {
		var _this = this;
		var type = record.typeKey;
		var isNew = record.get('isNew');
		var tempId = record.get('id');

		record.set('isSaving', true);

		if (isNew) {
			return this.get('adapter').createRecord(record).then(function(payload) {
				record.set('id', payload.id);
				record.set('isSaving', false);
				delete payload.id;

				var records = _this.get('_records.' + type);
				delete records[tempId];
				records[record.get('id')] = {
					timestamp: new Date().getTime(),
					record: record
				};

				this._extractPayload(payload);
				return record;
			}.bind(this));
		} else {
			return this.get('adapter').updateRecord(record).then(function(payload) {
				this._extractPayload(payload);
				record.set('isSaving', false);
				return record;
			}.bind(this));
		}
	},

	/**
	 * @param {Model} record
	 * @returns {Promise} Nothing on success, catch for error
	 */
	deleteRecord: function(record) {
		var type = record.typeKey;
		var id = record.get('id');
		var records = (this.get('_records.' + type) || {});

		record.set('isSaving', true);
		record.set('isDeleted', true);

		return this.get('adapter').deleteRecord(record).then(function(payload) {
			this._extractPayload(payload);
			record.set('isSaving', false);
			delete this.get('_records.' + type)[id];
		}.bind(this));
	},

	/**
	 * @param {Model} record
	 * @returns {Promise} The reloaded record
	 */
	reloadRecord: function(record) {
		Eg.debug.assert('You can\'t reload record `' + record.typeKey + ':' +
			record.get('id') + '` while it\'s dirty.', !record.get('isDirty'));
		record.set('isReloading', true);

		return this.get('adapter').find(record.typeKey, record.get('id')).then(function(payload) {
			this._extractPayload(payload);
			record.set('isReloading', false);
			return record;
		}.bind(this));
	},

	_extractPayload: function(payload) {
		Em.keys(payload).forEach(function(typeKey) {
			var type = this.modelForType(typeKey);

			payload[typeKey].forEach(function(json) {
				var record = this.getRecord(typeKey, json.id);

				if (record) {
					// TODO: Reloading dirty records
					if (!record.get('isDirty')) {
						record._loadData(json);
					} else {
						Eg.debug.warn('The record `' + typeKey + ':' + json.id + '` was attempted to be' +
							'reloaded while dirty.');
					}
				} else {
					this._loadRecord(typeKey, json);
				}
			}, this);
		}, this);
	}
});
