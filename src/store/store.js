var map = Em.ArrayPolyfills.map;

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
	 * A boolean for whether or not to reload dirty records. If this is
	 * true, data from the server will be merged with the data on the
	 * client according to the other options defined on this class.
	 * If it's false, calling reload on a dirty record will throw an
	 * error, and any side loaded data from the server will be discarded.
	 *
	 * Note: If this is turned off, no relationship can be reloaded if
	 * either of the records is dirty. So if the server says that
	 * record 1 is connected to record 2, and you reload record 1, which
	 * is clean, Ember-Graph will abort the reload if record 2 is dirty.
	 * This is a particularly annoying corner case that can be mostly
	 * avoided in two ways: either enable reloadDirty, or ensure that
	 * records are changed and then saved or rollback back in the same
	 * 'action'. (Don't let users perform different modifications at
	 * the same time.)
	 *
	 * @property reloadDirty
	 * @for Store
	 * @type Boolean
	 * @final
	 */
	reloadDirty: true,

	/**
	 * If reloadDirty is true, this determines which side the store will
	 * settle conflicts for. If true, new client side relationships always
	 * take precedence over server side relationships loaded when the
	 * record is dirty. If false, server side relationships will overwrite
	 * any temporary client side relationships on reload.
	 *
	 * Note: This only affects relationships. Attributes aren't as tricky,
	 * so the server data can be loaded without affecting the client data.
	 * To have the server overwrite client data, use the option below.
	 *
	 * @property sideWithClientOnConflict
	 * @for Store
	 * @type Boolean
	 * @final
	 */
	sideWithClientOnConflict: true,

	/**
	 * If reloadDirty is true, this will overwrite client attributes on
	 * reload. Because of the more simplistic nature of attributes, it is
	 * recommended to keep this false. The server data will still be loaded
	 * into the record and can be activated at any time by rolling back
	 * attribute changes on the record.
	 *
	 * @property overwriteClientAttributes
	 * @for Store
	 * @type Boolean
	 * @final
	 */
	overwriteClientAttributes: false,

	/**
	 * Stores the models used so far. This not ony caches them so we don't
	 * have to hit the container, but it also let's use know that the
	 * typeKey has been property injected into them.
	 *
	 * @property modelCache
	 * @type {Object}
	 * @final
	 * @private
	 */
	modelCache: {},

	/**
	 * Contains the records cached in the store. The keys are type names,
	 * and the values are nested objects keyed at the ID of the record.
	 *
	 * @property recordCache
	 * @type {RecordCache}
	 * @final
	 * @private
	 */
	recordCache: {},

	/**
	 * Stores adapters as they're looked up in the container.
	 *
	 * @property adapterCache
	 * @type Object
	 * @final
	 * @private
	 */
	adapterCache: {},

	initializeCaches: Em.on('init', function() {
		this.setProperties({
			modelCache: {},
			recordCache: new EG.RecordCache(this.get('cacheTimeout')),
			adapterCache: {}
		});
	}),

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
		var modelCache = this.get('modelCache');

		if (!modelCache[typeKey]) {
			var factory = this.get('container').lookupFactory('model:' + typeKey);
			factory.reopen({ typeKey: typeKey });
			factory.reopenClass({ typeKey: typeKey });
			modelCache[typeKey] = factory;
		}

		return modelCache[typeKey];
	},

	/**
	 * Creates a record of the specified type. The record starts in a blank
	 * state, meaning all attributes are `undefined`, all hasOne relationships
	 * are `null` and all hasMany relationships are `[]`. But before the record
	 * can be saved to the server, all relationships and attributes must be
	 * initialized (except for `serverOnly` ones). Even optional attributes
	 * and relationships must have their values filled in explicitly.
	 *
	 * @method createRecord
	 * @param {String} typeKey
	 * @param {Object} json
	 * @return {Model}
	 */
	createRecord: function(typeKey, json) {
		var record = this.modelForType(typeKey).create(this);
		this.get('recordCache').storeRecord(record);
		record.initializeRecord(json || {});
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
		return this.get('recordCache').getRecords(typeKey);
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
		return this.get('recordCache').getRecord(typeKey, id);
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
		switch (Em.typeOf(options)) {
			case 'string':
				return this._findSingle(typeKey, options);
			case 'array':
				return this._findMany(typeKey, options);
			case 'object':
				return this._findQuery(typeKey, options);
			case 'undefined':
				if (arguments.length === 1) {
					return this._findAll(typeKey);
				}
				/* falls through */
			default:
				throw new Em.Error('A bad `find` call was made to the store.');
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
			var records = payload.meta.matchedRecords;
			this.extractPayload(payload);

			return map.call(records, function(record) {
				return this.getRecord(record.type, record.id);
			}.bind(this));
		}.bind(this));

		return EG.PromiseArray.create({ promise: promise });
	},

	/**
	 * Persists a record (new or old) to the server.
	 *
	 * @method saveRecord
	 * @param {Model} record
	 * @return {Promise} Resolves to the saved record
	 */
	saveRecord: function(record) {
		if (!record.get('isNew')) {
			return this.updateRecord(record);
		}

		if (!record.isInitialized()) {
			throw new Em.Error('Can\'t save an uninitialized record.');
		}

		var _this = this;
		var typeKey = record.get('typeKey');

		return this.adapterFor(typeKey).createRecord(record).then(function(payload) {
			var tempId = record.get('id');
			var newId = Em.get(payload, 'meta.createdRecord.id');

			if (!newId) {
				if (payload[typeKey].length === 1) {
					newId = payload[typeKey][0].id;
				} else {
					throw new Em.Error('Missing `createdRecord` meta attribute.');
				}
			}

			record.set('id', newId);

			var recordCache = _this.get('recordCache');
			recordCache.deleteRecord(typeKey, tempId);
			recordCache.storeRecord(record);
			_this.updateRelationshipsWithNewId(typeKey, tempId, newId);

			_this.extractPayload(payload);
			return record;
		});
	},

	/**
	 * Saves an old record's changes to the server.
	 *
	 * @method updateRecord
	 * @param {Model} record
	 * @return {Promise} Resolves to the saved record
	 */
	updateRecord: function(record) {
		var _this = this;

		var recordJson = {
			id: record.get('id')
		};

		record.constructor.eachAttribute(function(name) {
			recordJson[name] = record.get(name);
		});

		record.constructor.eachRelationship(function(name) {
			recordJson[name] = record.get('_' + name);
		});

		var potentialPayload = {};
		potentialPayload[record.get('typeKey')] = [recordJson];

		return this.adapterFor(record.get('typeKey')).updateRecord(record).then(function(payload) {
			_this.extractPayload(payload || potentialPayload);
			return record;
		});
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

		var _this = this;
		var typeKey = record.get('typeKey');
		var id = record.get('id');

		if (record.get('isNew')) {
			this.deleteRecordFromStore(typeKey, id);
			return Em.RSVP.resolve();
		}

		return this.adapterFor(typeKey).deleteRecord(record).then(function(payload) {
			_this.deleteRecordFromStore(typeKey, id);
			_this.pushPayload(payload);
		});
	},

	/**
	 * Deletes a record from the store, removing its relationships and unloading it.
	 * This should only be used when a record has already been deleted from the server.
	 *
	 * @method deleteRecordFromStore
	 * @param {String} typeKey
	 * @param {String} id
	 * @private
	 */
	deleteRecordFromStore: function(typeKey, id) {
		this.deleteRelationshipsForRecord(typeKey, id);
		this.get('recordCache').deleteRecord(typeKey, id);

		// TODO: #49
		// record.set('store', null);
	},

	/**
	 * Reloads a record from the server.
	 *
	 * @method reloadRecord
	 * @param {Model} record
	 * @return {Promise} Resolves to the reloaded record
	 */
	reloadRecord: function(record) {
		if (record.get('isDirty') && !this.get('reloadDirty')) {
			throw new Em.Error('Can\'t reload a record while it\'s dirty and `reloadDirty` is turned off.');
		}

		return this.adapterFor(record.typeKey).findRecord(record.typeKey, record.get('id')).then(function(payload) {
			this.extractPayload(payload);
			return record;
		}.bind(this));
	},

	/**
	 * @method extractPayload
	 * @deprecated Renamed to `pushPayload` to be more familiar to Ember-Data users.
	 */
	extractPayload: EG.deprecateMethod('`extractPayload` is deprecated in favor of `pushPayload`', 'pushPayload'),

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
	 *         {
	 *             id: "1",
	 *             title: "Introduction To Ember-Graph",
	 *             tags: []
	 *         },
	 *         {
	 *             id: "2",
	 *             title: "Defining Models",
	 *             tags: [{ "type": "tag", "id": "1" }, { "type": "tag", "id": "3" }]
	 *         },
	 *         {
	 *             id: "3",
	 *             title: "Connecting to a REST API",
	 *             tags: [{ "type": "tag", "id": "2" }]
	 *         }
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
	 * @method pushPayload
	 * @param {Object} payload
	 */
	pushPayload: function(payload) {
		if (!payload || Em.keys(payload).length === 0) {
			return;
		}

		// TODO: In addition, this is a meta attribute that allows you to easily remove
		// records from the store. The `meta` object may contain an object array
		// called `deletedRecords` that tells the store which records have been
		// deleted. The objects should contain a `type` and `id` field. Any
		// records included in the array will be removed from the store.
		delete payload.meta;

		Em.changeProperties(function() {
			var reloadDirty = this.get('reloadDirty');

			Em.keys(payload).forEach(function(typeKey) {
				var model = this.modelForType(typeKey);

				payload[typeKey].forEach(function(json) {
					var record = this.getRecord(typeKey, json.id);

					if (record) {
						if (!record.get('isDirty') || reloadDirty) {
							record.loadDataFromServer(json);
						}
					} else {
						record = model.create(this);
						record.set('id', json.id);

						this.get('recordCache').storeRecord(record);
						this.connectQueuedRelationships(record);
						record.loadDataFromServer(json);
					}
				}, this);
			}, this);
		}, this);
	},

	/**
	 * Unloads a record from the store. To get the record, back you must
	 * fetch it from your server again. If the record is dirty when this
	 * is called, an error will be thrown unless you set `discardChanges`
	 * to `true`.
	 *
	 * @method unloadRecord
	 * @param {Model} record
	 * @param {Boolean} [discardChanges=false]
	 */
	unloadRecord: function(record, discardChanges) {
		if (!discardChanges && record.get('isDirty')) {
			throw new Em.Error('Can\'t unload a dirty record.');
		}

		Em.changeProperties(function() {
			record.rollback();

			this.queueConnectedRelationships(record);
			this.get('recordCache').deleteRecord(record.get('typeKey'), record.get('id'));
			record.set('store', null);
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
		return this.get('container').lookup('type:' + typeName);
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
