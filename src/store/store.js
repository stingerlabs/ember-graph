/**
 * The store is used to manage all records in the application.
 * Ideally, there should only be one store for an application.
 *
 * @type {Store}
 */
EG.Store = Em.Object.extend({

	/**
	 * The adapter to use if an application adapter is not found.
	 *
	 * @type {String}
	 */
	defaultAdapter: 'rest',

	/**
	 * The application's container.
	 */
	container: null,

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
	_records: {},

	/**
	 * The adapter used by the store to communicate with the server.
	 * The adapter is found by looking for App.ApplicationAdapter.
	 * If not found, defaults to the REST adapter.
	 *
	 * @type {Adapter}
	 * @private
	 */
	adapter: Em.computed(function() {
		var container = this.get('container');
		var adapter = container.lookup('adapter:application') ||
			container.lookup('adapter:' + this.get('defaultAdapter'));

		Em.assert('A valid adapter could not be found.', EG.Adapter.detectInstance(adapter));

		return adapter;
	}).property(),

	/**
	 * Initializes all of the variables properly
	 */
	init: function() {
		this.set('_records', {});
		this.set('_types', {});
		this.set('_relationships', {});
		this.set('_queuedRelationships', {});
	},

	/**
	 * Gets a record from the store's cached records (including timestamp).
	 *
	 * @param {String} typeKey
	 * @param {String} id
	 * @private
	 */
	_getRecord: function(typeKey, id) {
		var records = this.get('_records');
		records[typeKey] = records[typeKey] || {};
		return records[typeKey][id];
	},

	/**
	 * Puts a record into the store's cached records.
	 * Overwrites the old instance of it if it exists.
	 *
	 * @param {String} typeKey
	 * @param {Model} record
	 * @private
	 */
	_setRecord: function(typeKey, record) {
		var records = this.get('_records');
		records[typeKey] = records[typeKey] || {};
		records[typeKey][record.get('id')] = {
			record: record,
			timestamp: new Date().getTime()
		};
	},

	/**
	 * Deletes a record from the store's cached records.
	 *
	 * @param {Store} typeKey
	 * @param {String} id
	 * @private
	 */
	_deleteRecord: function(typeKey, id) {
		var records = this.get('_records');
		records[typeKey] = records[typeKey] || {};
		delete records[typeKey][id];
	},

	/**
	 * @param {String} typeKey
	 * @returns {Model}
	 */
	modelForType: function(typeKey) {
		this._modelCache = this._modelCache || {};
		var factory = this.get('container').lookupFactory('model:' + typeKey);

		if (!this._modelCache[typeKey]) {
			this._modelCache[typeKey] = factory;
			factory.reopen({ typeKey: typeKey });
			factory.reopenClass({ typeKey: typeKey });
		}

		return factory;
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
		record.set('id', EG.Model.temporaryIdPrefix + EG.util.generateGUID());

		this._setRecord(typeKey, record);

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

		this._setRecord(typeKey, record);

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
		} else if (typeof options === 'object' && !!options) {
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
		var record = this._getRecord(typeKey, id);
		var timeout = new Date().getTime() - this.get('cacheTimeout');

		if (record && record.record) {
			return (record.timestamp >= timeout ? record.record : null);
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
				this.extractPayload(payload);
				return this.getRecord(type, id);
			}.bind(this));
		}

		return EG.PromiseObject.create({ promise: promise });
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
				this.extractPayload(payload);

				return ids.map(function(id) {
					return this.getRecord(type, id);
				}, this).toArray();
			}.bind(this));
		}

		return EG.PromiseArray.create({ promise: promise });
	},

	/**
	 * Gets all of the records of a type from the adapter as a PromiseArray.
	 *
	 * @param {String} type
	 * @returns {PromiseArray}
	 * @private
	 */
	_findAll: function(type) {
		var promise = this.get('adapter').findAll(type).then(function(payload) {
			this.extractPayload(payload);
			return this._recordsForType(type);
		}.bind(this));

		return EG.PromiseArray.create({ promise: promise });
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
		var promise = this.get('adapter').findQuery(typeKey, options).then(function(payload) {
			var ids = payload.meta.ids;
			this.extractPayload(payload);

			return ids.map(function(id) {
				return this.getRecord(typeKey, id);
			}, this);
		}.bind(this));

		return EG.PromiseArray.create({ promise: promise });
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
		var type = record.typeKey;
		var isNew = record.get('isNew');
		var tempId = record.get('id');

		record.set('isSaving', true);

		if (isNew) {
			return this.get('adapter').createRecord(record).then(function(payload) {
				record.set('id', payload.meta.newId);
				record.set('isSaving', false);

				this._deleteRecord(type, tempId);
				this._setRecord(type, record);

				this.extractPayload(payload);
				return record;
			}.bind(this));
		} else {
			return this.get('adapter').updateRecord(record).then(function(payload) {
				this.extractPayload(payload);
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
			this._deleteRelationshipsForRecord(type, id);
			this.extractPayload(payload);
			record.set('isSaving', false);
			this._deleteRecord(type, id);
		}.bind(this));
	},

	/**
	 * @param {Model} record
	 * @returns {Promise} The reloaded record
	 */
	reloadRecord: function(record) {
		Em.assert('You can\'t reload record `' + record.typeKey + ':' +
			record.get('id') + '` while it\'s dirty.', !record.get('isDirty'));
		record.set('isReloading', true);

		return this.get('adapter').find(record.typeKey, record.get('id')).then(function(payload) {
			this.extractPayload(payload);
			record.set('isReloading', false);
			return record;
		}.bind(this));
	},

	/**
	 * Takes a normalized JSON payload and loads it into the store.
	 *
	 * @param {Object} payload Normalized JSON
	 */
	extractPayload: function(payload) {
		var reloadDirty = this.get('reloadDirty');

		Em.keys(payload).forEach(function(typeKey) {
			if (typeKey === 'meta') {
				return;
			}

			var type = this.modelForType(typeKey);

			payload[typeKey].forEach(function(json) {
				var record = this.getRecord(typeKey, json.id);

				if (record) {
					if (!record.get('isDirty') || reloadDirty) {
						record._loadData(json);
					}
				} else {
					this._loadRecord(typeKey, json);
				}
			}, this);
		}, this);
	},

	/**
	 * Returns an AttributeType instance for the given type.
	 * @param type
	 */
	attributeTypeFor: function(type) {
		var attributeType = this.get('container').lookup('type:' + type);
		Em.assert('Can\'t find an attribute type for the \'' + type + '\' type.', !!attributeType);
		return attributeType;
	}
});
