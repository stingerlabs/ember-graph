/**
 * The store is used to manage all records in the application.
 * Ideally, there should only be one store for an application.
 *
 * @class Store
 * @constructor
 */
EG.Store = Em.Object.extend({

	/**
	 * The number of milliseconds after a record in the cache expires
	 * and must be re-fetched from the server. Leave at Infinity for
	 * now, as finite timeouts will likely cause a lot of bugs.
	 *
	 * @property cacheTimeout
	 * @type Number
	 * @default Infinity
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
	 * Stores adapters as they're looked up in the container.
	 *
	 * @property adapterCache
	 * @type Object
	 * @final
	 * @private
	 */
	adapterCache: {},

	/**
	 * Initializes all of the variables properly
	 */
	init: function() {
		this._super();
		this.set('_records', {});
		this.set('_types', {});
		this.set('_relationships', {});
		this.set('_queuedRelationships', {});
		this.set('adapterCache', {});
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
	 * Looks up the model for the specified typeKey. The `typeKey` property
	 * isn't available on the class or its instances until the type is
	 * looked up with this method for the first time.
	 *
	 * @method modelForType
	 * @param {String} typeKey
	 * @return {Class}
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
	 * Creates a record of the specified type.
	 *
	 * @method createRecord
	 * @param {String} typeKey
	 * @param {Object} json
	 * @return {Model}
	 */
	createRecord: function(typeKey, json) {
		json = json || {};

		var record = this.modelForType(typeKey)._create();
		record.set('store', this);
		record.set('id', EG.Model.temporaryIdPrefix + EG.generateUUID());

		this._setRecord(typeKey, record);

		record.loadData(json);

		return record;
	},

	/**
	 * Loads an already created record into the store. This method
	 * should probably only be used by the store or adapter.
	 *
	 * @param typeKey
	 * @param json
	 * @deprecated Use `extractPayload` instead
	 */
	_loadRecord: function(typeKey, json) {
		var record = this.modelForType(typeKey)._create();
		record.set('store', this);
		record.set('id', json.id);

		this._setRecord(typeKey, record);

		if (this._hasQueuedRelationships(typeKey, json.id)) {
			this._connectQueuedRelationships(record);
		}

		record.loadData(json);

		return record;
	},

	/**
	 * Returns all records of the given type that are in the cache.
	 *
	 * @method cachedRecordsFor
	 * @param {String} typeKey
	 * @return {Model[]}
	 */
	cachedRecordsFor: function(typeKey) {
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
	 * The type of `options` determines the behavior of this method:
	 *
	 * - `string` fetches a single record by ID
	 * - `string[]` fetches several records by the IDs
	 * - `object` fetches records according to the given query object
	 * - `undefined` fetches all records of the given type
	 *
	 * Any other value, including `null`, will result in an error being thrown.
     *
	 * @method find
	 * @param {String} typeKey
	 * @param {String|String[]|Object} [options]
	 * @return {PromiseObject|PromiseArray}
	 */
	find: function(typeKey, options) {
		if (arguments.length > 1 && !options) {
			throw new Ember.Error('A bad `find` call was made to the store.');
		}

		switch (Em.typeOf(options)) {
			case 'string':
				return this._findSingle(typeKey, options);
			case 'array':
				return this._findMany(typeKey, options);
			case 'object':
				return this._findQuery(typeKey, options);
			case 'undefined':
				return this._findAll(typeKey);
			default:
				throw new Ember.Error('A bad `find` call was made to the store.');
		}
	},

	/**
	 * Returns the record directly if the record is cached in the store.
	 * Otherwise returns `null`.
	 *
	 * @method getRecord
	 * @param {String} typeKey
	 * @param {String} id
	 * @return {Model}
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
	 * @param {String} typeKey
	 * @param {String} id
	 * @return {PromiseObject}
	 * @private
	 */
	_findSingle: function(typeKey, id) {
		var record = this.getRecord(typeKey, id);
		var promise;

		if (record) {
			promise = Em.RSVP.Promise.resolve(record);
		} else {
			promise = this.adapterFor(typeKey).findRecord(typeKey, id).then(function(payload) {
				this.extractPayload(payload);
				return this.getRecord(typeKey, id);
			}.bind(this));
		}

		return EG.ModelPromiseObject.create({
			id: id,
			typeKey: typeKey,
			promise: promise
		});
	},

	/**
	 * Gets many records from the adapter as a PromiseArray.
	 *
	 * @param {String} typeKey
	 * @param {String[]} ids
	 * @return {PromiseArray}
	 * @private
	 */
	_findMany: function(typeKey, ids) {
		ids = ids || [];
		var set = new Em.Set(ids);

		ids.forEach(function(id) {
			if (this.getRecord(typeKey, id) !== null) {
				set.removeObject(id);
			}
		}, this);

		var promise;

		if (set.length === 0) {
			promise = Em.RSVP.Promise.resolve(ids.map(function(id) {
				return this.getRecord(typeKey, id);
			}, this));
		} else {
			promise = this.adapterFor(typeKey).findMany(typeKey, set.toArray()).then(function(payload) {
				this.extractPayload(payload);

				return ids.map(function(id) {
					return this.getRecord(typeKey, id);
				}, this).toArray();
			}.bind(this));
		}

		return EG.PromiseArray.create({ promise: promise });
	},

	/**
	 * Gets all of the records of a type from the adapter as a PromiseArray.
	 *
	 * @param {String} typeKey
	 * @return {PromiseArray}
	 * @private
	 */
	_findAll: function(typeKey) {
		var promise = this.adapterFor(typeKey).findAll(typeKey).then(function(payload) {
			this.extractPayload(payload);
			return this.cachedRecordsFor(typeKey);
		}.bind(this));

		return EG.PromiseArray.create({ promise: promise });
	},

	/**
	 * Gets records for a query from the adapter as a PromiseArray.
	 *
	 * @param {String} typeKey
	 * @param {Object} options
	 * @return {PromiseArray}
	 * @private
	 */
	_findQuery: function(typeKey, options) {
		var promise = this.adapterFor(typeKey).findQuery(typeKey, options).then(function(payload) {
			var ids = payload.meta.ids;
			this.extractPayload(payload);

			return ids.map(function(id) {
				return this.getRecord(typeKey, id);
			}, this);
		}.bind(this));

		return EG.PromiseArray.create({ promise: promise });
	},

	/**
	 * Returns `true` if the record is cached in the store, `false` otherwise.
	 *
	 * @method hasRecord
	 * @param {String} typeKey
	 * @param {String} id
	 * @return {Boolean}
	 */
	hasRecord: function(typeKey, id) {
		return this.getRecord(typeKey, id) !== null;
	},

	/**
	 * Persists a record (new or old) to the server.
	 *
	 * @method saveRecord
	 * @param {Model} record
	 * @return {Promise} Resolves to the saved record
	 */
	saveRecord: function(record) {
		var type = record.typeKey;
		var isNew = record.get('isNew');
		var tempId = record.get('id');

		if (isNew) {
			return this.adapterFor(record.typeKey).createRecord(record).then(function(payload) {
				record.set('id', payload.meta.newId);

				this._deleteRecord(type, tempId);
				this._setRecord(type, record);

				this.extractPayload(payload);
				return record;
			}.bind(this));
		} else {
			return this.adapterFor(record.typeKey).updateRecord(record).then(function(payload) {
				this.extractPayload(payload);
				return record;
			}.bind(this));
		}
	},

	/**
	 * Deletes a record from the server.
	 *
	 * @method deleteRecord
	 * @param {Model} record
	 * @return {Promise}
	 */
	deleteRecord: function(record) {
		if (record.get('isCreating')) {
			return Em.RSVP.reject('Can\'t delete a record before it\'s created.');
		}

		var type = record.typeKey;
		var id = record.get('id');

		if (record.get('isNew')) {
			this._deleteRelationshipsForRecord(type, id);
			this._deleteRecord(type, id);
			record.set('store', null);
			return Em.RSVP.resolve();
		}

		return this.adapterFor(record.typeKey).deleteRecord(record).then(function(payload) {
			this._deleteRelationshipsForRecord(type, id);
			this.extractPayload(payload);
			this._deleteRecord(type, id);
			record.set('store', null);
		}.bind(this));
	},

	/**
	 * Reloads a record from the server.
	 *
	 * @method reloadRecord
	 * @param {Model} record
	 * @return {Promise} Resolves to the reloaded record
	 */
	reloadRecord: function(record) {
		Em.assert('You can\'t reload record `' + record.typeKey + ':' +
			record.get('id') + '` while it\'s dirty.', !record.get('isDirty'));

		return this.adapterFor(record.typeKey).findRecord(record.typeKey, record.get('id')).then(function(payload) {
			this.extractPayload(payload);
			return record;
		}.bind(this));
	},

	/**
	 * Takes a normalized payload from the server and load the
	 * record into the store. This format is called normalized JSON
	 * and allows you to easily load multiple records in at once.
	 * Normalized JSON is a single object that contains keys that are
	 * model type names, and whose values are arrays of JSON records.
	 * In addition, there is a single `meta` key that contains some
	 * extra information that the store may need. For example, say
	 * that the following models were defined:
	 *
	 * ```js
	 * App.Post = EG.Model.extend({
	 *     title: EG.attr({ type: 'string' }),
	 *     tags: EG.hasMany({ relatedType: 'tag', inverse: null })
	 * });
	 *
	 * App.Tag = EG.Model.extend({
	 *     name: EG.attr({ type: 'string' })
	 * });
	 * ```
	 *
	 * A normalized JSON payload for these models might look like this:
	 *
	 * ```json
	 * {
	 *     "post": [
	 *         { id: "1", title: "Introduction To Ember-Graph", tags: [] },
	 *         { id: "2", title: "Defining Models", tags: ["1", "3"] },
	 *         { id: "3", title: "Connecting to a REST API", tags: ["2"] }
	 *     ],
	 *     "tag": [
	 *         { id: "1", name: "relationship" },
	 *         { id: "2", name: "adapter" },
	 *         { id: "3", name: "store" }
	 *     ],
	 *     "meta": {}
	 * }
	 * ```
	 *
	 * Notice that the names of the types are in singular form. Also, the
	 * records contain all attributes and relationships in the top level.
	 * In addition, all IDs (either of records or in relationships) must
	 * be strings, not numbers.
	 *
	 * This format allows records to be easily loaded into the store even
	 * if they weren't specifically requested (side-loading). The store
	 * doesn't care how or where the records come from, as long as they can
	 * be converted to this form.
	 *
	 * @method extractPayload
	 * @param {Object} payload
	 */
	extractPayload: function(payload) {
		payload = payload || {};

		Em.changeProperties(function() {
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
							record.loadData(json);
						}
					} else {
						this._loadRecord(typeKey, json);
					}
				}, this);
			}, this);
		}, this);
	},

	/**
	 * Returns an `AttributeType` instance for the given named type.
	 *
	 * @method attributeTypeFor
	 * @param {String} typeName
	 * @return {AttributeType}
	 */
	attributeTypeFor: function(typeName) {
		var attributeType = this.get('container').lookup('type:' + typeName);
		Em.assert('Can\'t find an attribute type for the \'' + typeName + '\' type.', !!attributeType);
		return attributeType;
	},

	/**
	 * Gets the adapter for the specified type. First, it looks for a type-specific
	 * adapter. If one isn't found, it looks for the application adapter. If that
	 * isn't found, it uses the default {{link-to-class 'RESTAdapter'}}.
	 *
	 * Note that this method will cache the results, so your adapter configuration
	 * must be finalized before the app starts up.
	 *
	 * @method adapterFor
	 * @param {String} typeKey
	 * @return {Adapter}
	 * @protected
	 */
	adapterFor: function(typeKey) {
		var adapterCache = this.get('adapterCache');

		if (!adapterCache[typeKey]) {
			var container = this.get('container');

			adapterCache[typeKey] = container.lookup('adapter:' + typeKey) ||
				container.lookup('adapter:application') ||
				container.lookup('adapter:rest');
		}

		return adapterCache[typeKey];
	}
});
