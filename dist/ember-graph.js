(function() {
'use strict';

var define = this.define;
var require = this.require;

var declareModuleLoader = function() {
	var DEFINITIONS = {};
	var MODULES = {};

	var evaluateModule = function(name) {
		if (!DEFINITIONS[name]) {
			throw new Error('Module not found: ' + name);
		}

		var exports = {};
		var dependencies = DEFINITIONS[name].dependencies.map(function(name) {
			if (name === 'exports') {
				return exports;
			} else {
				return require(name);
			}
		});

		DEFINITIONS[name].definition.apply(null, dependencies);

		MODULES[name] = exports;
		DEFINITIONS[name] = null;

		return exports;
	};

	define = function(name, dependencies, definition) {
		DEFINITIONS[name] = {
			dependencies: dependencies,
			definition: definition
		};
	};

	require = function(name) {
		if (!MODULES[name]) {
			MODULES[name] = evaluateModule(name);
		}

		return MODULES[name];
	};
};

var declareGlobalModule = function(global) {
	define('ember-graph', ['exports', 'ember'], function(exports, Ember) {
		/**
		 * @module ember-graph
		 * @main ember-graph
		 */
		global.EmberGraph = global.EG = Ember['default'].Namespace.create();
		exports['default'] = global.EmberGraph;
	});
};

// This is probably a poor way of detecting Ember CLI. Should work for now...
if (!define || !define.petal) {
	declareModuleLoader();
}

var global = this;

try {
	if (!require('ember')) {
		throw null;
	}
} catch (e) {
	define('ember', ['exports'], function(exports) {
		exports['default'] = global.Ember;
	});
}

try {
	if (!require('jquery')) {
		throw null;
	}
} catch (e) {
	define('jquery', ['exports'], function(exports) {
		exports['default'] = global.jQuery;
	});
}

declareGlobalModule(this);

define('ember-graph/adapter/adapter', ['exports', 'ember', 'ember-graph/util/util'], function (exports, _ember, _emberGraphUtilUtil) {

	/**
  * An interface for an adapter. And adapter is used to communicate with
  * the server. The adapter is never called directly, its methods are
  * called by the store to perform its operations.
  *
  * The adapter should return normalized JSON from its operations. Details
  * about normalized JSON can be found in the {{link-to-method 'Store' 'pushPayload'}}
  * documentation.
  *
  * @class Adapter
  * @constructor
  * @category abstract
  */
	exports.default = _ember.default.Object.extend({

		/**
   * The store that this adapter belongs to.
   * This might be needed to get models and their metadata.
   *
   * @property store
   * @type Store
   * @final
   */
		store: null,

		/**
   * Persists a record to the server. The returned JSON
   * must include the `newId` meta attribute as described
   * {{link-to-method 'here' 'Serializer' 'deserialize'}}.
   *
   * @method createRecord
   * @param {Model} record
   * @return {Promise} Resolves to the normalized JSON
   * @category abstract
   */
		createRecord: (0, _emberGraphUtilUtil.abstractMethod)('createRecord'),

		/**
   * Fetch a record from the server.
   *
   * @method findRecord
   * @param {String} typeKey
   * @param {String} id
   * @return {Promise} Resolves to the normalized JSON
   * @category abstract
   */
		findRecord: (0, _emberGraphUtilUtil.abstractMethod)('findRecord'),

		/**
   * The same as find, only it should load several records.
   *
   * @method findMany
   * @param {String} typeKey
   * @param {String[]} ids
   * @return {Promise} Resolves to the normalized JSON
   * @category abstract
   */
		findMany: (0, _emberGraphUtilUtil.abstractMethod)('findMany'),

		/**
   * The same as find, only it should load all records of the given type.
   *
   * @method findAll
   * @param {String} typeKey
   * @return {Promise} Resolves to the normalized JSON
   * @category abstract
   */
		findAll: (0, _emberGraphUtilUtil.abstractMethod)('findAll'),

		/**
   * Queries the server for records of the given type. The resolved
   * JSON should include the `queryIds` meta attribute as
   * described {{link-to-method 'here' 'Serializer' 'deserialize'}}.
   *
   * @method findQuery
   * @param {String} typeKey
   * @param {Object} query The query object passed into the store's `find` method
   * @return {Promise} Resolves to the normalized JSON
   * @category abstract
   */
		findQuery: (0, _emberGraphUtilUtil.abstractMethod)('findQuery'),

		/**
   * Saves the record's changes to the server.
   *
   * @method updateRecord
   * @param {Model} record
   * @return {Promise} Resolves to the normalized JSON
   * @category abstract
   */
		updateRecord: (0, _emberGraphUtilUtil.abstractMethod)('updateRecord'),

		/**
   * Deletes the record.
   *
   * @method deleteRecord
   * @param {Model} record
   * @return {Promise} Resolves to the normalized JSON
   * @category abstract
   */
		deleteRecord: (0, _emberGraphUtilUtil.abstractMethod)('deleteRecord'),

		/**
   * Gets the serializer specified for a type. It first tries to get
   * a type-specific serializer. If it can't find one, it tries to use
   * the application serializer. If it can't find one, it uses the default
   * {{link-to-class 'JSONSerializer'}}.
   *
   * @method serializerFor
   * @param {String} typeKey
   * @return {Serializer}
   * @protected
   */
		serializerFor: function (typeKey) {
			return this.get('store').serializerFor(typeKey);
		},

		/**
   * Serializes the given record. By default, it defers to the serializer.
   *
   * @method serialize
   * @param {Model} record
   * @param {Object} options
   * @return {Object} Serialized record
   * @protected
   */
		serialize: function (record, options) {
			return this.serializerFor(record.get('typeKey')).serialize(record, options);
		},

		/**
   * Deserializes the given payload. By default, it defers to the serializer.
   *
   * @method deserialize
   * @param {JSON} payload
   * @param {Object} options
   * @return {Object} Normalized JSON payload
   * @protected
   */
		deserialize: function (payload, options) {
			return this.serializerFor(options.recordType).deserialize(payload, options);
		}
	});
});

define('ember-graph/adapter/ember_graph/adapter', ['exports', 'ember', 'ember-graph/adapter/adapter', 'ember-graph/adapter/ember_graph/load', 'ember-graph/adapter/ember_graph/server', 'ember-graph/adapter/ember_graph/database', 'ember-graph/util/computed'], function (exports, _ember, _emberGraphAdapterAdapter, _emberGraphAdapterEmber_graphLoad, _emberGraphAdapterEmber_graphServer, _emberGraphAdapterEmber_graphDatabase, _emberGraphUtilComputed) {

	var Promise = _ember.default.RSVP.Promise;

	/**
  * This class acts as a base adapter for synchronous storage forms. Specifically,
  * the {{link-to-class 'LocalStorageAdapter'}} and {{link-to-class 'MemoryAdapter'}}
  * inherit from this class. This class will perform all of the work of updating data
  * and maintaining data integrity, subclasses need only implement the
  * {{link-to-method 'EmberGraphAdapter' 'getDatabase'}} and
  * {{link-to-method 'EmberGraphAdapter' 'setDatabase'}} methods to create a
  * fully-functioning adapter. This class works with data as a single JSON object
  * that takes the following form:
  *
  * ```json
  * {
  *     "records": {
  *          "type_key": {
  *              "record_id": {
  *                  "attr1": "value",
  *                  "attr2": 5
  *              }
  *          }
  *     },
  *     "relationships": [{
  *             "t1": "type_key",
  *             "i1": "id",
  *             "n1": "relationship_name",
  *             "t2": "type_key",
  *             "i2": "id",
  *             "n2": "relationship_name",
  *     }]
  * }
  * ```
  *
  * If you can store the JSON data, then this adapter will ensure complete
  * database integrity, since everything is done is single transactions.
  * You may also override some of the hooks and methods if you wish to
  * customize how the adapter saves or retrieves data.
  *
  * @class EmberGraphAdapter
  * @extends Adapter
  * @category abstract
  */
	var EmberGraphAdapter = _emberGraphAdapterAdapter.default.extend({

		/**
   * Since we control both the client and 'server', we'll
   * use the same serializer for all records.
   *
   * @property serializer
   * @type JSONSerializer
   * @protected
   * @final
   */
		serializer: (0, _emberGraphUtilComputed.computed)({
			get: function () {
				return this.get('container').lookup('serializer:ember_graph');
			}
		}),

		createRecord: function (record) {
			var _this = this;
			var typeKey = record.get('typeKey');
			var serializerOptions = { requestType: 'createRecord', recordType: typeKey };
			var json = this.serialize(record, serializerOptions);

			return this.serverCreateRecord(typeKey, json).then(function (payload) {
				return _this.deserialize(payload, serializerOptions);
			});
		},

		findRecord: function (typeKey, id) {
			var _this = this;
			var serializerOptions = { requestType: 'findRecord', recordType: typeKey };

			return this.serverFindRecord(typeKey, id).then(function (payload) {
				return _this.deserialize(payload, serializerOptions);
			});
		},

		findMany: function (typeKey, ids) {
			var _this = this;
			var serializerOptions = { requestType: 'findMany', recordType: typeKey };

			return this.serverFindMany(typeKey, ids).then(function (payload) {
				return _this.deserialize(payload, serializerOptions);
			});
		},

		findAll: function (typeKey) {
			var _this = this;
			var serializerOptions = { requestType: 'findAll', recordType: typeKey };

			return this.serverFindAll(typeKey).then(function (payload) {
				return _this.deserialize(payload, serializerOptions);
			});
		},

		findQuery: function () {
			return Promise.reject('LocalStorageAdapter doesn\'t implement `findQuery` by default.');
		},

		updateRecord: function (record) {
			var _this = this;
			var typeKey = record.get('typeKey');
			var serializerOptions = { requestType: 'updateRecord', recordType: typeKey };
			var changes = this.serialize(record, serializerOptions);

			return this.serverUpdateRecord(typeKey, record.get('id'), changes).then(function (payload) {
				return _this.deserialize(payload, serializerOptions);
			});
		},

		deleteRecord: function (record) {
			var _this = this;
			var typeKey = record.get('typeKey');
			var serializerOptions = { requestType: 'deleteRecord', recordType: typeKey };

			return this.serverDeleteRecord(typeKey, record.get('id')).then(function (payload) {
				return _this.deserialize(payload, serializerOptions);
			});
		},

		serialize: function (record, options) {
			return this.get('serializer').serialize(record, options);
		},

		deserialize: function (payload, options) {
			return this.get('serializer').deserialize(payload, options);
		}

	});

	EmberGraphAdapter.reopen(_emberGraphAdapterEmber_graphLoad.default);
	EmberGraphAdapter.reopen(_emberGraphAdapterEmber_graphServer.default);
	EmberGraphAdapter.reopen(_emberGraphAdapterEmber_graphDatabase.default);

	exports.default = EmberGraphAdapter;
});

define('ember-graph/adapter/ember_graph/database', ['exports', 'ember', 'ember-graph/model/model', 'ember-graph/util/util', 'ember-graph/util/string'], function (exports, _ember, _emberGraphModelModel, _emberGraphUtilUtil, _emberGraphUtilString) {

	var ADD_OP_NAME_REGEX = /^\/links\/([^/]+)/i;
	var REMOVE_OP_REGEX = /^\/links\/([^/]+)\/.+/i;

	function getRelationshipNameFromChangePath(path, op) {
		return path.match(op === 'add' ? ADD_OP_NAME_REGEX : REMOVE_OP_REGEX)[1];
	}

	/**
  * The JSON database has a simple format. The top-level
  * format looks like this:
  *
  * ```json
  * {
  *     "records": {},
  *     "relationships": []
  * }
  * ```
  *
  * Records are grouped by their type and stored by ID, like so:
  *
  * ```json
  * {
  *     "user": {
  *         "1": {},
  *         "3": {}
  *     },
  *     "post": {
  *         "10": {}
  *     }
  * }
  * ```
  *
  * Relationships are stored in the following form (short keys are to conserve space):
  *
  * ```json
  * {
  *    "t1": "typeKey1",
  *    "i1": "id1",
  *    "n1": "relationshipName1",
  *    "t2": "typeKey2",
  *    "i2": "id2",
  *    "n2": "relationshipName2"
  * }
  * ```
  */
	exports.default = {

		/**
   * Return a copy of the database from the storage location in JSON form.
   * If the database doesn't exist and you need to create and empty one,
   * the following JSON object should be returned:
   *
   * ```json
   * {
   *     "records": {},
   *     "relationships": []
   * }
   * ```
   *
   * @method getDatabase
   * @return {Promise} Resolves to the DB JSON
   * @protected
   * @for EmberGraphAdapter
   */
		getDatabase: (0, _emberGraphUtilUtil.abstractMethod)('getDatabase'),

		/**
   * Store the updated version of the database in the storage location.
   *
   * @method setDatabase
   * @param {JSON} db
   * @return {Promise} Resolves or rejects based on saving success (resolves to current DB)
   * @protected
   * @for EmberGraphAdapter
   */
		setDatabase: (0, _emberGraphUtilUtil.abstractMethod)('saveDatabase'),

		/**
   * Determines if the given database contains the given record.
   *
   * @method databaseHasRecord
   * @param {String} typeKey
   * @param {String} id
   * @param {JSON} db
   * @return {Boolean}
   * @private
   * @for EmberGraphAdapter
   */
		databaseHasRecord: function (typeKey, id, db) {
			try {
				return !!db.records[typeKey][id];
			} catch (e) {
				return false;
			}
		},

		/**
   * Builds the record from the database, combining the relationships and attributes.
   * This assumes that the record actually exists.
   *
   * @method getRecordFromDatabase
   * @param {String} typeKey
   * @param {String} id
   * @param {JSON} db
   * @return {JSON}
   * @private
   * @for EmberGraphAdapter
   */
		getRecordFromDatabase: function (typeKey, id, db) {
			var model = this.get('store').modelFor(typeKey);
			var json = _ember.default.copy(db.records[typeKey][id], true);
			json.id = id;
			json.links = {};

			db.relationships.forEach(function (relationship) {
				var meta;

				if (relationship.t1 === typeKey && relationship.i1 === id && relationship.n1 !== null) {
					meta = model.metaForRelationship(relationship.n1);

					if (meta.kind === _emberGraphModelModel.default.HAS_ONE_KEY) {
						json.links[relationship.n1] = { type: relationship.t2, id: relationship.i2 };
					} else {
						json.links[relationship.n1] = json.links[relationship.n1] || [];
						json.links[relationship.n1].push({ type: relationship.t2, id: relationship.i2 });
					}
				} else if (relationship.t2 === typeKey && relationship.i2 === id && relationship.n2 !== null) {
					meta = model.metaForRelationship(relationship.n2);

					if (meta.kind === _emberGraphModelModel.default.HAS_ONE_KEY) {
						json.links[relationship.n2] = { type: relationship.t1, id: relationship.i1 };
					} else {
						json.links[relationship.n2] = json.links[relationship.n2] || [];
						json.links[relationship.n2].push({ type: relationship.t1, id: relationship.i1 });
					}
				}
			});

			model.eachRelationship(function (name, meta) {
				if (!json.links[name]) {
					if (meta.kind === _emberGraphModelModel.default.HAS_ONE_KEY) {
						json.links[name] = null;
					} else {
						json.links[name] = [];
					}
				}
			});

			return json;
		},

		/**
   * Takes a serialized record and splits it into attributes
   * and relationships, then puts it in the database. It will
   * replace any existing record with the same type and ID.
   *
   * @method putRecordInDatabase
   * @param {String} typeKey
   * @param {String} id
   * @param {JSON} json
   * @param {JSON} db
   * @return {JSON} The updated DB
   * @private
   * @for EmberGraphAdapter
   */
		putRecordInDatabase: function (typeKey, id, json, db) {
			var model = this.get('store').modelFor(typeKey);

			db.records[typeKey] = db.records[typeKey] || {};
			db.records[typeKey][id] = {};

			model.eachAttribute(function (name, meta) {
				db.records[typeKey][id][name] = json[name];
			});

			model.eachRelationship(function (name, meta) {
				if (meta.kind === _emberGraphModelModel.default.HAS_ONE_KEY) {
					if (json.links[name]) {
						var relationship = {
							t1: typeKey, i1: id, n1: name,
							t2: json.links[name].type, i2: json.links[name].id, n2: meta.inverse
						};

						db = this.setHasOneRelationshipInDatabase(relationship, db);
					}
				} else {
					json.links[name].forEach(function (value) {
						var relationship = {
							t1: typeKey, i1: id, n1: name,
							t2: value.type, i2: value.id, n2: meta.inverse
						};

						db = this.addHasManyRelationshipToDatabase(relationship, db);
					}, this);
				}
			}, this);

			return db;
		},

		/**
   * Applies a list of changes for a given record to the database.
   *
   * @method applyChangesToDatabase
   * @param {String} typeKey
   * @param {String} id
   * @param {JSON[]} changes
   * @param {JSON} db
   * @return {JSON} The updated DB
   * @private
   * @for EmberGraphAdapter
   */
		applyChangesToDatabase: function (typeKey, id, changes, db) {
			var model = this.get('store').modelFor(typeKey);

			changes.forEach(function (change) {
				switch (change.op) {
					case 'replace':
						if ((0, _emberGraphUtilString.startsWith)(change.path, '/links/')) {
							var hasOneName = change.path.substring('/links/'.length);

							if (change.value === null) {
								db = this.clearHasOneRelationshipInDatabase(typeKey, id, hasOneName, db);
							} else {
								var hasOneMeta = model.metaForRelationship(hasOneName);

								var replacementRelationship = {
									t1: typeKey, i1: id, n1: hasOneName,
									t2: change.value.type, i2: change.value.id, n2: hasOneMeta.inverse
								};

								db = this.setHasOneRelationshipInDatabase(replacementRelationship, db);
							}
						} else {
							var attrName = change.path.substring('/'.length);
							db.records[typeKey][id][attrName] = change.value;
						}
						break;
					case 'add':
					case 'remove':
						var hasManyName = getRelationshipNameFromChangePath(change.path, change.op);
						var hasManyMeta = model.metaForRelationship(hasManyName);

						var relationship = {
							t1: typeKey, i1: id, n1: hasManyName,
							t2: change.value.type, i2: change.value.id, n2: hasManyMeta.inverse
						};

						if (change.op === 'add') {
							db = this.addHasManyRelationshipToDatabase(relationship, db);
						} else {
							db = this.removeHasManyRelationshipFromDatabase(relationship, db);
						}
						break;
				}
			}, this);

			return db;
		},

		/**
   * Adds a new hasMany relationship to the database, removing any conflicts.
   * The hasMany relationship should be the first one in the relationship JSON.
   *
   * @method addHasManyRelationshipToDatabase
   * @param {JSON} relationship
   * @param {JSON} db
   * @return {JSON} The updated DB
   * @private
   * @for EmberGraphAdapter
   */
		addHasManyRelationshipToDatabase: function (relationship, db) {
			var relationships = this.getRelationshipsFor(relationship.t1, relationship.i1, relationship.n1, db);

			var connected = relationships.filter(function (r) {
				return relationship.t2 === r.t2 && relationship.i2 === r.i2 && relationship.n2 === r.n2;
			});

			if (connected.length > 0) {
				return db;
			}

			if (relationship.n2) {
				var inverseModel = this.get('store').modelFor(relationship.t2);
				var inverseMeta = inverseModel.metaForRelationship(relationship.n2);

				if (inverseMeta.kind === _emberGraphModelModel.default.HAS_ONE_KEY) {
					db = this.clearHasOneRelationshipInDatabase(relationship.t2, relationship.i2, relationship.n2, db);
				}
			}

			db.relationships.push(relationship);

			return db;
		},

		/**
   * Removes a hasMany relationship from the database.
   * The hasMany relationship should be the first one in the relationship JSON.
   *
   * @method removeHasManyRelationshipFromDatabase
   * @param {JSON} relationship
   * @param {JSON} db
   * @return {JSON} The updated DB
   * @private
   * @for EmberGraphAdapter
   */
		removeHasManyRelationshipFromDatabase: function (relationship, db) {
			db.relationships = db.relationships.filter(function (r) {
				return !(relationship.t2 === r.t2 && relationship.i2 === r.i2 && relationship.n2 === r.n2);
			});

			return db;
		},

		/**
   * Sets a hasOne relationship to a new value, removing any conflicts.
   * The hasOne relationship should be the first one in the relationship JSON.
   *
   * @method setHasOneRelationshipInDatabase
   * @param {JSON} relationship
   * @param {JSON} db
   * @return {JSON} The updated DB
   * @private
   * @for EmberGraphAdapter
   */
		setHasOneRelationshipInDatabase: function (relationship, db) {
			db = this.clearHasOneRelationshipInDatabase(relationship.t1, relationship.i1, relationship.n1, db);

			if (relationship.n2) {
				var inverseModel = this.get('store').modelFor(relationship.t2);
				var inverseMeta = inverseModel.metaForRelationship(relationship.n2);

				if (inverseMeta.kind === _emberGraphModelModel.default.HAS_ONE_KEY) {
					db = this.clearHasOneRelationshipInDatabase(relationship.t2, relationship.i2, relationship.n2, db);
				}
			}

			db.relationships.push(relationship);

			return db;
		},

		/**
   * Clears the value of the given hasOne relationship (if there is one).
   *
   * @method clearHasOneRelationshipInDatabase
   * @param {String} typeKey
   * @param {String} id
   * @param {String} name
   * @param {JSON} db
   * @return {JSON} The updated DB
   * @private
   * @for EmberGraphAdapter
   */
		clearHasOneRelationshipInDatabase: function (typeKey, id, name, db) {
			var relationships = this.getRelationshipsFor(typeKey, id, name, db);

			relationships.forEach(function (relationship) {
				db.relationships.splice(db.relationships.indexOf(relationship), 1);
			});

			return db;
		},

		/**
   * Gets all of the relationships that connect to the record given.
   *
   * @method getRelationshipsFor
   * @param {String} typeKey
   * @param {String} id
   * @param {String} name
   * @param {JSON} db
   * @return {JSON[]} Relationships
   * @private
   * @for EmberGraphAdapter
   */
		getRelationshipsFor: function (typeKey, id, name, db) {
			return db.relationships.filter(function (relationship) {
				return relationship.t1 === typeKey && relationship.i1 === id && relationship.n1 === name || relationship.t2 === typeKey && relationship.i2 === id && relationship.n2 === name;
			});
		}

	};
});

define('ember-graph/adapter/ember_graph/load', ['exports', 'ember', 'ember-graph/model/model', 'ember-graph/util/set', 'ember-graph/util/util'], function (exports, _ember, _emberGraphModelModel, _emberGraphUtilSet, _emberGraphUtilUtil) {

	var Promise = _ember.default.RSVP.Promise;

	var typeOf = _ember.default.typeOf;

	exports.default = {

		/**
   * Determines whether or not to bootstrap the database
   * with an initial set of data. If you want to initialize
   * the database with data, you should override this property
   * to return `true`. Use a computed property if deciding to
   * initialize requires application logic.
   *
   * @method shouldInitializeDatabase
   * @return {Boolean}
   * @protected
   * @for EmberGraphAdapter
   */
		shouldInitializeDatabase: function () {
			return false;
		},

		/**
   * If {{link-to-method 'EmberGraphAdapter' 'shouldInitializeDatabase'}} returns `true`,
   * then this hook is called to get the data to inject into the database. You should
   * return your initial data payload from this hook. The format of the payload is
   * very similar to the format required by {{link-to-method 'Store' 'pushPayload'}}.
   * But there are a few differences for the sake of terseness:
   *
   * - IDs can be numbers or strings, they'll be converted to strings automatically
   * - Relationships can be just IDs or ID objects (the later for polymorphic relationships).
   *   For example, you may use `{ id: 1, posts: [1] }` instead of `{ id: 1, posts: [{ type: 'post', id: 1 }] }`
   * - Optional values can be left out, they'll be filled in automatically
   *
   * @method getInitialPayload
   * @return {Object}
   * @protected
   * @for EmberGraphAdapter
   */
		getInitialPayload: function () {
			return { records: {}, relationships: [] };
		},

		/**
   * Initializes the database (if configured to do so). Verifies all of the data first.
   * Because saving data to the database can be asynchronous, this function returns
   * a promise. Your application is probably not ready to be started until this
   * promise resolves. If your implementation of this class saves the database
   * synchronously, this can be done during initialization. Otherwise, you'll
   * have to figure out a way to stall your application until it completes.
   *
   * @method initializeDatabase
   * @return {Promise}
   * @for EmberGraphAdapter
   */
		initializeDatabase: function () {
			if (!this.shouldInitializeDatabase()) {
				return Promise.resolve();
			}

			var payload = this.getInitialPayload();

			try {
				var db = this.convertAndVerifyPayload(_ember.default.copy(payload, true));
				return this.setDatabase(db);
			} catch (error) {
				return Promise.reject(error);
			}
		},

		/**
   * @method convertAndVerifyPayload
   * @param {Object} payload
   * @return {JSON} Database object
   * @private
   * @for EmberGraphAdapter
   */
		convertAndVerifyPayload: function (payload) {
			var database = {
				records: this.extractRecords(payload),
				relationships: this.extractRelationships(payload)
			};

			this.validateDatabase(database);

			return database;
		},

		/**
   * @method extractRecords
   * @param {Object} payload
   * @return {JSON} `records` object for database
   * @private
   * @for EmberGraphAdapter
   */
		extractRecords: function (payload) {
			var store = this.get('store');
			var databaseRecords = {};

			(0, _emberGraphUtilUtil.values)(payload, function (typeKey, records) {
				databaseRecords[typeKey] = {};

				var model = store.modelFor(typeKey);

				records.forEach(function (record) {
					databaseRecords[typeKey][record.id] = this.convertRecord(model, record);
				}, this);
			}, this);

			return databaseRecords;
		},

		/**
   * Takes a single record, fills in missing attributes
   * and serializes it for storage in the database.
   *
   * @method convertRecord
   * @param {Class} model
   * @param {Object} record
   * @return {JSON}
   * @private
   * @for EmberGraphAdapter
   */
		convertRecord: function (model, record) {
			var json = {};

			model.eachAttribute(function (name, meta) {
				var type = this.get('store').attributeTypeFor(meta.type);

				if (record[name] === undefined) {
					if (meta.isRequired) {
						throw new _ember.default.Error(_ember.default.get(model, 'typeKey') + ':' + record.id + ' is missing `' + name + '`');
					} else {
						json[name] = type.serialize(meta.getDefaultValue());
					}
				} else {
					json[name] = type.serialize(record[name]);
				}
			}, this);

			return json;
		},

		/**
   * @method extractRelationships
   * @param {Object} payload
   * @return {JSON[]}
   * @private
   * @for EmberGraphAdapter
   */
		extractRelationships: function (payload) {
			var store = this.get('store');
			var relationships = [];
			var createdRelationships = _emberGraphUtilSet.default.create();

			function addRelationship(r) {
				var one = r.t1 + ':' + r.i1 + ':' + r.n1;
				var two = r.t2 + ':' + r.i2 + ':' + r.n2;
				var sorted = one < two ? one + '::' + two : two + '::' + one;

				if (!createdRelationships.contains(sorted)) {
					createdRelationships.addObject(sorted);
					relationships.push(r);
				}
			}

			(0, _emberGraphUtilUtil.values)(payload, function (typeKey, records) {
				var model = store.modelFor(typeKey);

				records.forEach(function (record) {
					var recordRelationships = this.extractRelationshipsFromRecord(model, record);
					recordRelationships.forEach(addRelationship);
				}, this);
			}, this);

			return relationships;
		},

		extractRelationshipsFromRecord: function (model, record) {
			var relationships = [];
			var typeKey = _ember.default.get(model, 'typeKey');

			model.eachRelationship(function (name, meta) {
				var value = record[name];

				if (value === undefined) {
					if (meta.isRequired) {
						throw new _ember.default.Error(typeKey + ':' + record.id + ' is missing `' + name + '`');
					} else {
						value = meta.getDefaultValue();
					}
				}

				if (meta.kind === _emberGraphModelModel.default.HAS_ONE_KEY) {
					if (value !== null) {
						if (typeOf(value) === 'string' || typeOf(value) === 'number') {
							value = { type: meta.relatedType, id: value + '' };
						}

						relationships.push({
							t1: typeKey, i1: record.id + '', n1: name,
							t2: value.type, i2: value.id + '', n2: meta.inverse
						});
					}
				} else {
					value.forEach(function (other) {
						var otherRecord = other;

						if (typeOf(otherRecord) === 'string' || typeOf(otherRecord) === 'number') {
							otherRecord = { type: meta.relatedType, id: otherRecord + '' };
						}

						relationships.push({
							t1: typeKey, i1: record.id + '', n1: name,
							t2: otherRecord.type, i2: otherRecord.id + '', n2: meta.inverse
						});
					});
				}
			});

			return relationships;
		},

		/**
   * @method validateDatabase
   * @param {JSON} db
   * @private
   * @for EmberGraphAdapter
   */
		validateDatabase: function (db) {
			function filterRelationships(typeKey, id, name) {
				return db.relationships.filter(function (r) {
					return r.t1 === typeKey && r.i1 === id && r.n1 === name || r.t2 === typeKey && r.i2 === id && r.n2 === name;
				});
			}

			function relationshipToString(r) {
				var one = r.t1 + ':' + r.i1 + ':' + r.n1;
				var two = r.t2 + ':' + r.i2 + ':' + r.n2;
				return one < two ? one + '::' + two : two + '::' + one;
			}

			var relationshipSet = _emberGraphUtilSet.default.create();
			relationshipSet.addObjects(db.relationships.map(relationshipToString));
			if (_ember.default.get(relationshipSet, 'length') !== db.relationships.length) {
				throw new _ember.default.Error('An invalid set of relationships was generated.');
			}

			db.relationships.forEach(function (relationship) {
				if (!db.records[relationship.t1][relationship.i1]) {
					throw new _ember.default.Error(relationship.t1 + ':' + relationship.i1 + ' doesn\'t exist');
				}

				if (!db.records[relationship.t2][relationship.i2]) {
					throw new _ember.default.Error(relationship.t2 + ':' + relationship.i2 + ' doesn\'t exist');
				}
			});

			(0, _emberGraphUtilUtil.values)(db.records, function (typeKey, records) {
				var model = this.get('store').modelFor(typeKey);

				model.eachRelationship(function (name, meta) {
					if (meta.kind !== _emberGraphModelModel.default.HAS_ONE_KEY) {
						return;
					}

					(0, _emberGraphUtilUtil.values)(records, function (id, record) {
						var relationships = filterRelationships(typeKey, id, name);

						if (relationships.length > 1) {
							throw new _ember.default.Error('Too many relationships connected to ' + typeKey + ':' + id + ':' + name);
						}
					});
				});
			}, this);
		}

	};
});

define('ember-graph/adapter/ember_graph/server', ['exports', 'ember', 'ember-graph/util/inflector', 'ember-graph/util/util'], function (exports, _ember, _emberGraphUtilInflector, _emberGraphUtilUtil) {
	function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

	exports.default = {

		/**
   * @method serverCreateRecord
   * @param {String} typeKey
   * @param {JSON} json
   * @return {Promise}
   * @protected
   * @for EmberGraphAdapter
   */
		serverCreateRecord: function (typeKey, json) {
			var _this2 = this;

			var newId = null;

			return this.getDatabase().then(function (db) {
				newId = _this2.generateIdForRecord(typeKey, json, db);

				var modifiedDb = _this2.putRecordInDatabase(typeKey, newId, json[(0, _emberGraphUtilInflector.pluralize)(typeKey)][0], db);
				return _this2.setDatabase(modifiedDb);
			}).then(function (db) {
				var record = _this2.getRecordFromDatabase(typeKey, newId, db);
				return _defineProperty({}, (0, _emberGraphUtilInflector.pluralize)(typeKey), [record]);
			});
		},

		/**
   * @method serverFindRecord
   * @param {String} typeKey
   * @param {String} id
   * @return {Promise}
   * @protected
   * @for EmberGraphAdapter
   */
		serverFindRecord: function (typeKey, id) {
			var _this = this;

			return this.getDatabase().then(function (db) {
				if (_ember.default.get(db, 'records.' + typeKey + '.' + id)) {
					var payload = {};
					payload[(0, _emberGraphUtilInflector.pluralize)(typeKey)] = [_this.getRecordFromDatabase(typeKey, id, db)];
					return payload;
				} else {
					throw { status: 404, typeKey: typeKey, id: id };
				}
			});
		},

		/**
   * @method serverFindMany
   * @param {String} typeKey
   * @param {String[]} ids
   * @return {Promise}
   * @protected
   * @for EmberGraphAdapter
   */
		serverFindMany: function (typeKey, ids) {
			var _this = this;

			return this.getDatabase().then(function (db) {
				var records = ids.map(function (id) {
					if (_ember.default.get(db, 'records.' + typeKey + '.' + id)) {
						return _this.getRecordFromDatabase(typeKey, id, db);
					} else {
						throw { status: 404, typeKey: typeKey, id: id };
					}
				});

				var payload = {};
				payload[(0, _emberGraphUtilInflector.pluralize)(typeKey)] = records;
				return payload;
			});
		},

		/**
   * @method serverFindAll
   * @param {String} typeKey
   * @return {Promise}
   * @protected
   * @for EmberGraphAdapter
   */
		serverFindAll: function (typeKey) {
			var _this = this;

			return this.getDatabase().then(function (db) {
				var records = Object.keys(db.records[typeKey] || {}).map(function (id) {
					return _this.getRecordFromDatabase(typeKey, id, db);
				});

				var payload = {};
				payload[(0, _emberGraphUtilInflector.pluralize)(typeKey)] = records;
				return payload;
			});
		},

		/**
   * @method serverUpdateRecord
   * @param {String} typeKey
   * @param {String} id
   * @param {JSON[]} changes
   * @return {Promise} Resolves to update record payload
   * @protected
   * @for EmberGraphAdapter
   */
		serverUpdateRecord: function (typeKey, id, changes) {
			var _this3 = this;

			return this.getDatabase().then(function (db) {
				var modifiedDb = _this3.applyChangesToDatabase(typeKey, id, changes, db);
				return _this3.setDatabase(modifiedDb);
			}).then(function (db) {
				return _defineProperty({}, (0, _emberGraphUtilInflector.pluralize)(typeKey), [_this3.getRecordFromDatabase(typeKey, id, db)]);
			});
		},

		/**
   * @method serverDeleteRecord
   * @param {String} typeKey
   * @param {String} id
   * @return {Promise}
   * @protected
   * @for EmberGraphAdapter
   */
		serverDeleteRecord: function (typeKey, id) {
			var _this4 = this;

			return this.getDatabase().then(function (db) {
				if (db.records[typeKey]) {
					delete db.records[typeKey][id];
				}

				db.relationships = db.relationships.filter(function (r) {
					return !(r.t1 === typeKey && r.i1 === id || r.t2 === typeKey && r.i2 === id);
				});

				return _this4.setDatabase(db).then(function () {
					return {
						meta: {
							deletedRecords: [{ type: typeKey, id: id }]
						}
					};
				});
			});
		},

		/**
   * @method generateIdForRecord
   * @param {String} typeKey
   * @param {JSON} json
   * @param {JSON} db
   * @return {String}
   * @protected
   * @for EmberGraphAdapter
   */
		generateIdForRecord: function (typeKey, json, db) {
			return (0, _emberGraphUtilUtil.generateUUID)();
		}

	};
});

define('ember-graph/adapter/local_storage', ['exports', 'ember', 'ember-graph/adapter/ember_graph/adapter'], function (exports, _ember, _emberGraphAdapterEmber_graphAdapter) {

	var Promise = _ember.default.RSVP.Promise;

	/**
  * This adapter will store all of your application data in the browser's
  * localStorage. This adapter can be useful for caching data on the client,
  * or for testing purposes. If you want to initialize the localStorage
  * with an initial data set, override the
  * {{link-to-method 'LocalStorageAdapter' 'shouldInitializeDatabase'}} and
  * {{link-to-method 'LocalStorageAdapter' 'getInitialPayload'}} hooks.
  *
  * To customize the the behavior for getting or saving records, you can
  * override any of the following methods:
  * {{link-to-method 'LocalStorageAdapter' 'serverFindRecord'}},
  * {{link-to-method 'LocalStorageAdapter' 'serverFindMany'}},
  * {{link-to-method 'LocalStorageAdapter' 'serverFindAll'}},
  * {{link-to-method 'LocalStorageAdapter' 'serverCreateRecord'}},
  * {{link-to-method 'LocalStorageAdapter' 'serverDeleteRecord'}},
  * {{link-to-method 'LocalStorageAdapter' 'serverUpdateRecord'}}.
  *
  * @class LocalStorageAdapter
  * @extends EmberGraphAdapter
  */
	exports.default = _emberGraphAdapterEmber_graphAdapter.default.extend({

		/**
   * @property localStorageKey
   * @default 'ember-graph.db'
   * @final
   * @protected
   */
		localStorageKey: 'ember-graph.db',

		getDatabase: function () {
			try {
				var key = this.get('localStorageKey');
				var value = localStorage[key];

				if (value) {
					return Promise.resolve(JSON.parse(value));
				} else {
					return Promise.resolve({ records: {}, relationships: [] });
				}
			} catch (error) {
				return Promise.reject(error);
			}
		},

		setDatabase: function (db) {
			try {
				var key = this.get('localStorageKey');
				localStorage[key] = JSON.stringify(db);
				return Promise.resolve(db);
			} catch (error) {
				return Promise.reject(error);
			}
		},

		/**
   * Initializes the database (if configured to do so).
   * This function is called at adapter initialization
   * (which is probably when it's looked up by the container).
   *
   * @method initializeDatabase
   * @private
   */
		initializeDatabase: function () {
			this._super();
		},

		initializeDatabaseOnInit: _ember.default.on('init', function () {
			this.initializeDatabase();
		})

	});
});

define('ember-graph/adapter/memory', ['exports', 'ember', 'ember-graph/adapter/ember_graph/adapter'], function (exports, _ember, _emberGraphAdapterEmber_graphAdapter) {

	var Promise = _ember.default.RSVP.Promise;

	/**
  * This adapter stores all of your changes in memory, mainly for testing
  * purposes. To initialize the memory with an initial data set, override
  * the {{link-to-method 'MemoryAdapter' 'getInitialPayload'}} hook to
  * return the data that you want to load into memory.
  *
  * To customize the the behavior for getting or saving records, you can
  * override any of the following methods:
  * {{link-to-method 'MemoryAdapter' 'serverFindRecord'}},
  * {{link-to-method 'MemoryAdapter' 'serverFindMany'}},
  * {{link-to-method 'MemoryAdapter' 'serverFindAll'}},
  * {{link-to-method 'MemoryAdapter' 'serverCreateRecord'}},
  * {{link-to-method 'MemoryAdapter' 'serverDeleteRecord'}},
  * {{link-to-method 'MemoryAdapter' 'serverUpdateRecord'}}.
  *
  * @class MemoryAdapter
  * @extends EmberGraphAdapter
  */
	exports.default = _emberGraphAdapterEmber_graphAdapter.default.extend({

		database: null,

		getDatabase: function () {
			try {
				var database = this.get('database');

				if (database) {
					return Promise.resolve(database);
				} else {
					return Promise.resolve({ records: {}, relationships: [] });
				}
			} catch (error) {
				return Promise.reject(error);
			}
		},

		setDatabase: function (database) {
			try {
				this.set('database', database);
				return Promise.resolve(database);
			} catch (error) {
				return Promise.reject(error);
			}
		},

		shouldInitializeDatabase: function () {
			return true;
		},

		/**
   * Initializes the database (if configured to do so).
   * This function is called at adapter initialization
   * (which is probably when it's looked up by the container).
   *
   * @method initializeDatabase
   * @private
   */
		initializeDatabase: function () {
			this._super();
		},

		initializeDatabaseOnInit: _ember.default.on('init', function () {
			this.initializeDatabase();
		})

	});
});

define('ember-graph/adapter/rest', ['exports', 'jquery', 'ember', 'ember-graph/adapter/adapter', 'ember-graph/util/inflector', 'ember-graph/util/computed'], function (exports, _jquery, _ember, _emberGraphAdapterAdapter, _emberGraphUtilInflector, _emberGraphUtilComputed) {

	var Promise = _ember.default.RSVP.Promise;

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
	exports.default = _emberGraphAdapterAdapter.default.extend({

		urlLengthLimit: 2048,

		/**
   * Sends a `POST` request to `/{pluralized_type}` with the serialized record as the body.
   *
   * @method createRecord
   * @param {Model} record
   * @return {Promise} A promise that resolves to the created record
   */
		createRecord: function (record) {
			var _this = this;
			var typeKey = record.get('typeKey');
			var url = this.buildUrl(typeKey);
			var json = this.serialize(record, { requestType: 'createRecord', recordType: typeKey });

			return this.ajax(url, 'POST', json).then(function (payload) {
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
		findRecord: function (typeKey, id) {
			var _this = this;
			var url = this.buildUrl(typeKey, id);

			return this.ajax(url, 'GET').then(function (payload) {
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
		findMany: function (typeKey, ids) {
			var _this2 = this;

			var url = this.buildUrl(typeKey, ids.join(','));

			if (window.location.origin.length + url.length <= this.get('urlLengthLimit')) {
				return this.ajax(url, 'GET').then(function (payload) {
					return _this2.deserialize(payload, { requestType: 'findMany', recordType: typeKey, ids: ids });
				});
			}

			var urls = this.buildMultipleUrls(typeKey, ids);
			var promises = urls.map(function (url) {
				return _this2.ajax(url, 'GET');
			});

			return Promise.all(promises).then(function (payloads) {
				var payload = _this2.mergePayloads(payloads);
				return _this2.deserialize(payload, { requestType: 'findMany', recordType: typeKey, ids: ids });
			});
		},

		/**
   * Sends a `GET` request to `/{pluralized_type}`.
   *
   * @method findAll
   * @param {String} typeKey
   * @return {Promise} A promise that resolves to an array of requested records
   */
		findAll: function (typeKey) {
			var _this = this;
			var url = this.buildUrl(typeKey);

			return this.ajax(url, 'GET').then(function (payload) {
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
		findQuery: function (typeKey, query) {
			var _this = this;
			var options = {};

			Object.keys(query).forEach(function (key) {
				options[key] = '' + query[key];
			});

			var url = this.buildUrl(typeKey, null, options);

			return this.ajax(url, 'GET').then(function (payload) {
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
		updateRecord: function (record) {
			var _this = this;
			var url = this.buildUrl(record.typeKey, record.get('id'));
			var json = this.serialize(record, { requestType: 'updateRecord' });

			if (json.length <= 0) {
				return Promise.resolve();
			}

			return this.ajax(url, 'PATCH', json).then(function (payload) {
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
		deleteRecord: function (record) {
			var _this = this;
			var url = this.buildUrl(record.typeKey, record.get('id'));

			return this.ajax(url, 'DELETE').then(function (payload) {
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
		buildUrl: function (typeKey, id, options) {
			var url = this.get('prefix') + '/' + (0, _emberGraphUtilInflector.pluralize)(typeKey);

			if (id) {
				url += '/' + id;
			}

			if (options) {
				Object.keys(options).forEach(function (key, index) {
					url += (index === 0 ? '?' : '&') + key + '=' + encodeURIComponent(options[key]);
				});
			}

			return url;
		},

		buildMultipleUrls: function (typeKey, ids) {
			var base = this.get('prefix') + '/' + (0, _emberGraphUtilInflector.pluralize)(typeKey) + '/';
			var baseLength = window.location.origin.length + base.length;
			var lengthLimit = this.get('urlLengthLimit');

			var idArrays = ids.reduce(function (idArrays, id) {
				var idArray = idArrays[idArrays.length - 1];

				if (baseLength + idArray.join(',').length + id.length + 1 <= lengthLimit) {
					idArray.push(id);
				} else {
					idArrays.push([id]);
				}

				return idArrays;
			}, [[]]);

			return idArrays.map(function (idArray) {
				return base + idArray.join(',');
			});
		},

		mergePayloads: function (payloads) {
			var mergeObjects = function (a, b) {
				var merged = _ember.default.merge(_ember.default.copy(a, true), b);

				for (var key in b) {
					if (b.hasOwnProperty(key) && a.hasOwnProperty(key)) {
						if (_ember.default.isArray(b[key])) {
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
		prefix: (0, _emberGraphUtilComputed.computed)({
			get: function () {
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
		ajax: function (url, verb, body) {
			var headers = this.headers(url, verb, body);

			return new Promise(function (resolve, reject) {
				_jquery.default.ajax({
					cache: false,
					contentType: 'application/json',
					data: body && (_ember.default.typeOf(body) === 'string' ? body : JSON.stringify(body)),
					headers: headers,
					processData: false,
					type: verb,
					url: url,

					error: function (jqXHR, textStatus, error) {
						_ember.default.run(null, reject, error);
					},

					success: function (data, status, jqXHR) {
						_ember.default.run(null, resolve, data);
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
		headers: function (url, verb, body) {
			return {};
		}
	});
});

define('ember-graph/attribute_type/array', ['exports', 'ember', 'ember-graph/attribute_type/type'], function (exports, _ember, _emberGraphAttribute_typeType) {

	/**
  * @class ArrayType
  * @extends AttributeType
  * @constructor
  */
	exports.default = _emberGraphAttribute_typeType.default.extend({

		/**
   * If the object is an array, it's returned. Otherwise, `null` is returned.
   * This doesn't check the individual elements, just the array.
   *
   * @method serialize
   * @param {Array} arr
   * @returns {Array}
   */
		serialize: function (arr) {
			if (_ember.default.isNone(arr)) {
				return null;
			}

			return _ember.default.isArray(arr.toArray ? arr.toArray() : arr) ? arr : null;
		},

		/**
   * If the object is an array, it's returned. Otherwise, `null` is returned.
   * This doesn't check the individual elements, just the array.
   *
   * @method deserialize
   * @param {Array} arr
   * @returns {Array}
   */
		deserialize: function (arr) {
			return _ember.default.isArray(arr) ? arr : null;
		},

		/**
   * Compares two arrays using `Ember.compare`.
   *
   * @method isEqual
   * @param {Array} a
   * @param {Array} b
   * @returns {Boolean}
   */
		isEqual: function (a, b) {
			if (!_ember.default.isArray(a) || !_ember.default.isArray(b)) {
				return false;
			}

			return _ember.default.compare(a.toArray(), b.toArray()) === 0;
		}
	});
});

define('ember-graph/attribute_type/boolean', ['exports', 'ember', 'ember-graph/attribute_type/type'], function (exports, _ember, _emberGraphAttribute_typeType) {

	/**
  * @class BooleanType
  * @extends AttributeType
  * @constructor
  */
	exports.default = _emberGraphAttribute_typeType.default.extend({

		/**
   * @property defaultValue
   * @default false
   * @final
   */
		defaultValue: false,

		/**
   * Coerces to a boolean using
   * {{link-to-method 'BooleanType' 'coerceToBoolean'}}.
   *
   * @method serialize
   * @param {Boolean} bool
   * @return {Boolean}
   */
		serialize: function (bool) {
			return this.coerceToBoolean(bool);
		},

		/**
   * Coerces to a boolean using
   * {{link-to-method 'BooleanType' 'coerceToBoolean'}}.
   *
   * @method deserialize
   * @param {Boolean} json
   * @return {Boolean}
   */
		deserialize: function (json) {
			return this.coerceToBoolean(json);
		},

		/**
   * Coerces a value to a boolean. `true` and `'true'` resolve to
   * `true`, everything else resolves to `false`.
   *
   * @method coerceToBoolean
   * @param {Any} obj
   * @return {Boolean}
   */
		coerceToBoolean: function (obj) {
			if (_ember.default.typeOf(obj) === 'boolean' && obj == true) {
				// eslint-disable-line eqeqeq
				return true;
			}

			if (_ember.default.typeOf(obj) === 'string' && obj == 'true') {
				// eslint-disable-line eqeqeq
				return true;
			}

			return false;
		}
	});
});

define('ember-graph/attribute_type/date', ['exports', 'ember', 'ember-graph/attribute_type/type'], function (exports, _ember, _emberGraphAttribute_typeType) {

	/**
  * @class DateType
  * @extends AttributeType
  * @constructor
  */
	exports.default = _emberGraphAttribute_typeType.default.extend({

		/**
   * Converts any Date object, number or string to a timestamp.
   *
   * @method serialize
   * @param {Date|Number|String} date
   * @return {Number}
   */
		serialize: function (date) {
			switch (_ember.default.typeOf(date)) {
				case 'date':
					return date.getTime();
				case 'number':
					return date;
				case 'string':
					return new Date(date).getTime();
				default:
					return null;
			}
		},

		/**
   * Converts any numeric or string timestamp to a Date object.
   * Everything else gets converted to `null`.
   *
   * @method deserialize
   * @param {Number|String} timestamp
   * @return {Date}
   */
		deserialize: function (timestamp) {
			switch (_ember.default.typeOf(timestamp)) {
				case 'number':
				case 'string':
					return new Date(timestamp);
				default:
					return null;
			}
		},

		/**
   * Converts both arguments to a timestamp, then compares.
   *
   * @param {Date} a
   * @param {Date} b
   * @return {Boolean}
   */
		isEqual: function (a, b) {
			var aNone = a === null;
			var bNone = b === null;

			if (aNone && bNone) {
				return true;
			} else if (aNone && !bNone || !aNone && bNone) {
				return false;
			} else {
				return new Date(a).getTime() === new Date(b).getTime();
			}
		}
	});
});

define('ember-graph/attribute_type/enum', ['exports', 'ember', 'ember-graph/util/set', 'ember-graph/attribute_type/type', 'ember-graph/util/computed'], function (exports, _ember, _emberGraphUtilSet, _emberGraphAttribute_typeType, _emberGraphUtilComputed) {

	/**
  * Represents an enumeration or multiple choice type. This class cannot be
  * instantiated directly, you must extend the class, overriding both the
  * `defaultValue` and `values` properties. The `values` property must be
  * an array of unique strings (case insensitive). The `defaultValue` must
  * be a string, and the value must also exist in the `values` array.
  *
  * @class EnumType
  * @extends AttributeType
  * @constructor
  */
	exports.default = _emberGraphAttribute_typeType.default.extend({

		/**
   * The default enum value. Must be overridden in subclasses.
   *
   * @property defaultValue
   * @type String
   * @final
   */
		defaultValue: (0, _emberGraphUtilComputed.computed)({
			get: function () {
				throw new _ember.default.Error('You must override the `defaultValue` in an enumeration type.');
			}
		}),

		/**
   * @property values
   * @type {Array<String>}
   * @default []
   * @final
   */
		values: [],

		/**
   * Contains all of the values converted to lower case.
   *
   * @property valueSet
   * @type {Set<String>}
   * @default []
   * @final
   */
		valueSet: (0, _emberGraphUtilComputed.computed)('values', {
			get: function () {
				var set = _emberGraphUtilSet.default.create();
				var values = this.get('values');

				set.addObjects(values.map(function (value) {
					return value.toLocaleLowerCase();
				}));

				return set;
			}
		}),

		/**
   * Determines if the given option is a valid enum value.
   *
   * @property isValidValue
   * @param {String} option
   * @return {Boolean}
   */
		isValidValue: function (option) {
			return this.get('valueSet').contains(option.toLowerCase());
		},

		/**
   * Converts the given option to a valid enum value.
   * If the given value isn't valid, it uses the default value.
   *
   * @method serialize
   * @param {String} option
   * @return {String}
   */
		serialize: function (option) {
			var optionString = option + '';

			if (this.isValidValue(optionString)) {
				return optionString;
			} else {
				var defaultValue = this.get('defaultValue');

				if (this.isValidValue(defaultValue)) {
					return defaultValue;
				} else {
					throw new _ember.default.Error('The default value you provided isn\'t a valid value.');
				}
			}
		},

		/**
   *
   * Converts the given option to a valid enum value.
   * If the given value isn't valid, it uses the default value.
   *
   * @method deserialize
   * @param {String} option
   * @return {String}
   */
		deserialize: _ember.default.aliasMethod('serialize'),

		/**
   * Compares two enum values, case-insensitive.
   * @param {String} a
   * @param {String} b
   * @return {Boolean}
   */
		isEqual: function (a, b) {
			if (_ember.default.typeOf(a) !== 'string' || _ember.default.typeOf(b) !== 'string') {
				return false;
			} else {
				return (a + '').toLocaleLowerCase() === (b + '').toLocaleLowerCase();
			}
		}
	});
});

define('ember-graph/attribute_type/number', ['exports', 'ember', 'ember-graph/attribute_type/type'], function (exports, _ember, _emberGraphAttribute_typeType) {

	/**
  * Will coerce any type to a number (0 being the default). `null` is not a valid value.
  *
  * @class NumberType
  * @extends AttributeType
  * @constructor
  */
	exports.default = _emberGraphAttribute_typeType.default.extend({

		/**
   * @property defaultValue
   * @default 0
   * @final
   */
		defaultValue: 0,

		/**
   * Coerces the given value to a number.
   *
   * @method serialize
   * @param {Number} obj Javascript object
   * @return {Number} JSON representation
   */
		serialize: function (obj) {
			return this.coerceToNumber(obj);
		},

		/**
   * Coerces the given value to a number.
   *
   * @method deserialize
   * @param {Number} json JSON representation of object
   * @return {Number} Javascript object
   */
		deserialize: function (json) {
			return this.coerceToNumber(json);
		},

		/**
   * If the object passed is a number (and not NaN), it returns
   * the object coerced to a number primitive. If the object is
   * a string, it attempts to parse it (again, no NaN allowed).
   * Otherwise, the default value is returned.
   *
   * @method coerceToNumber
   * @param {Any} obj
   * @return {Number}
   * @protected
   */
		coerceToNumber: function (obj) {
			if (this.isValidNumber(obj)) {
				return Number(obj).valueOf();
			}

			if (_ember.default.typeOf(obj) === 'string') {
				var parsed = Number(obj).valueOf();
				if (this.isValidNumber(parsed)) {
					return parsed;
				}
			}

			return 0;
		},

		/**
   * Determines if the given number is an actual number and finite.
   *
   * @method isValidNumber
   * @param {Number} num
   * @return {Boolean}
   * @protected
   */
		isValidNumber: function (num) {
			return _ember.default.typeOf(num) === 'number' && !isNaN(num) && isFinite(num);
		}
	});
});

define('ember-graph/attribute_type/object', ['exports', 'ember', 'ember-graph/util/set', 'ember-graph/attribute_type/type'], function (exports, _ember, _emberGraphUtilSet, _emberGraphAttribute_typeType) {

	/**
  * @class ObjectType
  * @extends AttributeType
  * @constructor
  */
	exports.default = _emberGraphAttribute_typeType.default.extend({

		/**
   * If the value is a JSON object, it's returned.
   * Otherwise, it serializes to `null`.
   *
   * @method serialize
   * @param {Object} obj
   * @return {Object}
   */
		serialize: function (obj) {
			if (this.isObject(obj)) {
				try {
					JSON.stringify(obj);
					return obj;
				} catch (e) {
					return null;
				}
			} else {
				return null;
			}
		},

		/**
   * Returns the value if it's an object, `null` otherwise.
   *
   * @method deserialize
   * @param {Object} json
   * @return {Object}
   */
		deserialize: function (json) {
			if (this.isObject(json)) {
				return json;
			} else {
				return null;
			}
		},

		/**
   * Checks for equality using
   * {{link-to-method 'ObjectType' 'deepCompare'}}.
   *
   * @method isEqual
   * @param {Object} a
   * @param {Object} b
   * @return {Boolean}
   */
		isEqual: function (a, b) {
			if (!this.isObject(a) || !this.isObject(b)) {
				return false;
			}

			return this.deepCompare(a, b);
		},

		/**
   * Determines if the value is a plain Javascript object.
   *
   * @method isObject
   * @param {Object} obj
   * @return {Boolean}
   */
		isObject: function (obj) {
			return !_ember.default.isNone(obj) && _ember.default.typeOf(obj) === 'object' && obj.constructor === Object;
		},

		/**
   * Performs a deep comparison on the objects, iterating
   * objects and arrays, and using `===` on primitives.
   *
   * @method deepCompare
   * @param {Object} a
   * @param {Object} b
   * @return {Boolean}
   */
		deepCompare: function (a, b) {
			if (this.isObject(a) && this.isObject(b)) {
				var aKeys = _emberGraphUtilSet.default.create();
				var bKeys = _emberGraphUtilSet.default.create();

				aKeys.addObjects(Object.keys(a));
				bKeys.addObjects(Object.keys(b));

				if (!aKeys.isEqual(bKeys)) {
					return false;
				}

				var keys = Object.keys(a);

				for (var i = 0; i < keys.length; i = i + 1) {
					if (!this.deepCompare(a[keys[i]], b[keys[i]])) {
						return false;
					}
				}

				return true;
			} else if (_ember.default.isArray(a) && _ember.default.isArray(b)) {
				return _ember.default.compare(a, b) === 0;
			} else {
				return a === b;
			}
		}
	});
});

define('ember-graph/attribute_type/string', ['exports', 'ember-graph/attribute_type/type'], function (exports, _emberGraphAttribute_typeType) {

	/**
  * @class StringType
  * @extends AttributeType
  * @constructor
  */
	exports.default = _emberGraphAttribute_typeType.default.extend({

		/**
   * Coerces the given value to a string, unless it's `null`,
   * in which case it returns `null`.
   *
   * @method serialize
   * @param {String} str
   * @returns {String}
   */
		serialize: function (str) {
			return str === null || str === undefined ? null : '' + str;
		},

		/**
   * Coerces the given value to a string, unless it's `null`,
   * in which case it returns `null`.
   *
   * @method deserialize
   * @param {String} json
   * @returns {String}
   */
		deserialize: function (json) {
			return json === null || json === undefined ? null : '' + json;
		}
	});
});

define('ember-graph/attribute_type/type', ['exports', 'ember'], function (exports, _ember) {

	/**
  * Specifies the details of a custom attribute type.
  * Comes with reasonable defaults that can be used for some extended types.
  *
  * @class AttributeType
  * @constructor
  */
	exports.default = _ember.default.Object.extend({

		/**
   * The default value to use if a value of this type is missing.
   * Can be overridden in subclasses.
   *
   * @property defaultValue
   * @type Any
   * @default null
   * @final
   */
		defaultValue: null,

		/**
   * Converts a value of this type to its JSON form.
   * The default function returns the value given.
   *
   * @method serialize
   * @param {Any} obj Javascript value
   * @return {JSON} JSON representation
   */
		serialize: function (obj) {
			return obj;
		},

		/**
   * Converts a JSON value to its Javascript form.
   * The default function returns the value given.
   *
   * @method deserialize
   * @param {JSON} json JSON representation of object
   * @return {Any} Javascript value
   */
		deserialize: function (json) {
			return json;
		},

		/**
   * Determines if two values of this type are equal.
   * Defaults to using `===`.
   *
   * @method isEqual
   * @param {Any} a Javascript object
   * @param {Any} b Javascript object
   * @returns {Boolean} Whether or not the objects are equal or not
   */
		isEqual: function (a, b) {
			return a === b;
		}
	});
});

define('ember-graph/constants', ['exports'], function (exports) {
	var RelationshipTypes = {
		HAS_ONE_KEY: 'hasOne',
		HAS_MANY_KEY: 'hasMany'
	};

	exports.RelationshipTypes = RelationshipTypes;
	var RelationshipStates = {
		CLIENT_STATE: 'client',
		SERVER_STATE: 'server',
		DELETED_STATE: 'deleted'
	};
	exports.RelationshipStates = RelationshipStates;
});

define('ember-graph/data/promise_object', ['exports', 'ember', 'ember-graph/util/computed'], function (exports, _ember, _emberGraphUtilComputed) {

	/**
  * Ember's ObjectProxy combined with the PromiseProxyMixin.
  * Acts as an object and proxies all properties to the
  * given promise when it resolves.
  *
  * @class PromiseObject
  * @extends ObjectProxy
  * @uses PromiseProxyMixin
  * @constructor
  */
	var PromiseObject = _ember.default.ObjectProxy.extend(_ember.default.PromiseProxyMixin);

	/**
  * Ember's ArrayProxy combined with the PromiseProxyMixin.
  * Acts as an array and proxies all properties to the
  * given promise when it resolves.
  *
  * @class PromiseArray
  * @extends ArrayProxy
  * @uses PromiseProxyMixin
  * @constructor
  */
	var PromiseArray = _ember.default.ArrayProxy.extend(_ember.default.PromiseProxyMixin);

	/**
  * Acts just like `PromiseObject` only it's able to hold the
  * ID and typeKey of a model before it's resolved completely.
  *
  * ```js
  * var user = EG.ModelPromiseObject.create({
  *     promise: this.store.find('user', '52'),
  *     id: '52',
  *     typeKey: 'user'
  * });
  *
  * user.get('isPending'); // true
  * user.get('id'); // '52'
  * user.get('typeKey'); // 'user'
  * ```
  *
  * @class ModelPromiseObject
  * @extends PromiseObject
  * @constructor
  */
	var ModelPromiseObject = PromiseObject.extend({
		__modelId: null,
		__modelTypeKey: null,

		id: (0, _emberGraphUtilComputed.computed)('__modelId', 'content.id', {
			get: function () {
				var content = this.get('content');

				if (content && content.get) {
					return content.get('id');
				} else {
					return this.get('__modelId');
				}
			},
			set: function (key, value) {
				var content = this.get('content');

				if (content && content.set) {
					content.set('id', value);
				} else {
					this.set('__modelId', value);
				}
			}
		}),

		typeKey: (0, _emberGraphUtilComputed.computed)('__modelTypeKey', 'content.typeKey', {
			get: function () {
				var content = this.get('content');

				if (content && content.get) {
					return content.get('typeKey');
				} else {
					return this.get('__modelTypeKey');
				}
			},
			set: function (key, value) {
				var content = this.get('content');

				if (content && content.set) {
					content.set('typeKey', value);
				} else {
					this.set('__modelTypeKey', value);
				}
			}
		}),

		/**
   * Returns the underlying model for this promise. If the promise
   * isn't resolved yet, the model will be `undefined`.
   *
   * @method getModel
   * @return {Model}
   */
		getModel: function () {
			return this.get('content');
		},

		/**
   * Proxies to the underlying model's `destroy` method.
   * Will return a rejected promise if the promise isn't resolved yet.
   *
   * @method destroy
   * @return {Promise}
   */
		destroy: function () {
			var model = this.getModel();

			if (model && typeof model.destroy === 'function') {
				return model.destroy();
			} else {
				return _ember.default.RSVP.Promise.reject('Can\'t destroy a record that is still loading.');
			}
		}
	});

	exports.PromiseObject = PromiseObject;
	exports.PromiseArray = PromiseArray;
	exports.ModelPromiseObject = ModelPromiseObject;
});

define('ember-graph/initializer', ['exports', 'ember', 'ember-graph'], function (exports, _ember, _emberGraph) {

	_ember.default.onLoad('Ember.Application', function (Application) {
		Application.initializer({
			name: 'ember-graph',
			initialize: function (registry, application) {
				_ember.default.libraries.register('Ember Graph');

				var useService = !!_ember.default.Service;

				application.register('store:main', application.Store || _emberGraph.default.Store);

				if (useService) {
					application.register('service:store', application.Store || _emberGraph.default.Store);
				}

				application.register('adapter:rest', _emberGraph.default.RESTAdapter);
				application.register('adapter:memory', _emberGraph.default.MemoryAdapter);
				application.register('adapter:local_storage', _emberGraph.default.LocalStorageAdapter);

				application.register('serializer:json', _emberGraph.default.JSONSerializer);
				application.register('serializer:ember_graph', _emberGraph.default.EmberGraphSerializer);

				application.register('type:string', _emberGraph.default.StringType);
				application.register('type:number', _emberGraph.default.NumberType);
				application.register('type:boolean', _emberGraph.default.BooleanType);
				application.register('type:date', _emberGraph.default.DateType);
				application.register('type:object', _emberGraph.default.ObjectType);
				application.register('type:array', _emberGraph.default.ArrayType);

				application.inject('controller', 'store', 'store:main');
				application.inject('route', 'store', 'store:main');
				application.inject('adapter', 'store', 'store:main');
				application.inject('serializer', 'store', 'store:main');

				if (useService) {
					application.inject('controller', 'store', 'service:store');
					application.inject('route', 'store', 'service:store');
					application.inject('adapter', 'store', 'service:store');
					application.inject('serializer', 'store', 'service:store');
				}

				if (_emberGraph.default.DataAdapter) {
					application.register('data-adapter:main', _emberGraph.default.DataAdapter);
					application.inject('data-adapter', 'store', 'store:main');
				}
			}
		});

		if (Application.instanceInitializer) {
			Application.instanceInitializer({
				name: 'ember-graph',
				initialize: function (instance) {
					var application = instance.container.lookup('application:main');
					var store = instance.container.lookup('store:main');
					application.set('store', store);
				}
			});
		} else {
			Application.initializer({
				name: 'ember-graph-store',
				initialize: function (container, application) {
					var store = container.lookup('store:main');
					application.set('store', store);
				}
			});
		}
	});
});

define('ember-graph/main', ['exports', 'ember-graph/util', 'ember-graph/model/schema'], function (exports, _emberGraphUtil, _emberGraphModelSchema) {
  function _interopExportWildcard(obj, defaults) { var newObj = defaults({}, obj); delete newObj['default']; return newObj; }

  function _defaults(obj, defaults) { var keys = Object.getOwnPropertyNames(defaults); for (var i = 0; i < keys.length; i++) { var key = keys[i]; var value = Object.getOwnPropertyDescriptor(defaults, key); if (value && value.configurable && obj[key] === undefined) { Object.defineProperty(obj, key, value); } } return obj; }

  _defaults(exports, _interopExportWildcard(_emberGraphUtil, _defaults));

  _defaults(exports, _interopExportWildcard(_emberGraphModelSchema, _defaults));
});

define('ember-graph/model/core', ['exports', 'ember', 'ember-graph/util/set', 'ember-graph/util/util', 'ember-graph/util/computed'], function (exports, _ember, _emberGraphUtilSet, _emberGraphUtilUtil, _emberGraphUtilComputed) {

	var createAttribute = function (attributeName, options) {
		var meta = {
			isAttribute: true,
			type: options.type,
			isRequired: !options.hasOwnProperty('defaultValue'),
			defaultValue: options.defaultValue,
			isReadOnly: options.readOnly === true || options.serverOnly === true,
			isServerOnly: options.serverOnly === true,

			getDefaultValue: function () {
				var defaultValue = this.defaultValue;
				return typeof defaultValue === 'function' ? defaultValue() : defaultValue;
			},

			// deprecated
			isEqual: options.isEqual
		};

		return (0, _emberGraphUtilComputed.computed)('clientAttributes.' + attributeName, 'serverAttributes.' + attributeName, {
			get: function (key) {
				var server = this.get('serverAttributes.' + key);
				var client = this.get('clientAttributes.' + key);
				return client === undefined ? server : client;
			},

			set: function (key, value) {
				var meta = this.constructor.metaForAttribute(key);

				// New records can modify read only attributes. But not if they're server only
				if (meta.isReadOnly && !this.get('isNew')) {
					throw new _ember.default.Error('Cannot set read-only property "' + key + '" on object: ' + this);
				}

				if (value === undefined) {
					_ember.default.warn('`undefined` is not a valid property value.');
					return;
				}

				var isEqualScope = meta.isEqual ? meta : this.get('store').attributeTypeFor(meta.type);

				if (isEqualScope.isEqual(this.get('serverAttributes.' + key), value)) {
					delete this.get('clientAttributes')[key];
				} else {
					this.set('clientAttributes.' + key, value);
				}

				// This only notifies observers of the object itself, not the properties.
				// At this point in time, that's only the `_areAttributesDirty` property.
				this.notifyPropertyChange('clientAttributes');
			}
		}).meta(meta);
	};

	/**
  * This class serves as the base for Models and Embedded records.
  * This is considered private API and shouldn't be extended
  * unless you really know what you're doing.
  *
  * @class CoreModel
  * @abstract
  */
	var CoreModel = _ember.default.Object.extend({

		/**
   * The latest attributes from the server. When rolling back attributes,
   * these values will be the new current values. These should only be
   * updated when new data is received from the server, usually as the
   * result of a save request or an asynchronous data push.
   *
   * @property serverAttributes
   * @type Object
   * @private
   */
		serverAttributes: null,

		/**
   * Client side changes to attributes, if there are any. These values
   * are temporary and do not take effect until persisted to the server
   * and turned into server attributes by being pushed with a payload.
   * When rolling back attributes, this object is replaced with an
   * empty one.
   *
   * @property clientAttributes
   * @type Object
   * @private
   */
		clientAttributes: null,

		/**
   * Determines if there are any dirty attributes.
   *
   * @property areAttributesDirty
   * @type Boolean
   */
		areAttributesDirty: (0, _emberGraphUtilComputed.computed)('clientAttributes', {
			get: function () {
				return Object.keys(this.get('clientAttributes') || {}).length > 0;
			}
		}),

		_areAttributesDirty: (0, _emberGraphUtilUtil.deprecateProperty)('`_areAttributeDirty` is now `areAttributesDirty`', 'areAttributesDirty'),

		init: function () {
			this._super();

			this.setProperties({
				serverAttributes: _ember.default.Object.create(),
				clientAttributes: _ember.default.Object.create()
			});
		},

		/**
   * Returns an object that contains every attribute
   * that has been changed since the last save.
   *
   * @method changedAttributes
   * @return {Object} Keys are attribute names, values are arrays with [oldVal, newVal]
   */
		changedAttributes: function () {
			var diff = {};
			var store = this.get('store');

			this.constructor.eachAttribute(function (name, meta) {
				var server = this.get('serverAttributes.' + name);
				var client = this.get('clientAttributes.' + name);

				var scope = meta.isEqual ? meta : store.attributeTypeFor(meta.type);
				if (client === undefined || scope.isEqual(server, client)) {
					return;
				}

				diff[name] = [server, client];
			}, this);

			return diff;
		},

		/**
   * Resets all attribute changes to last known server attributes.
   *
   * @method rollbackAttributes
   */
		rollbackAttributes: function () {
			this.set('clientAttributes', _ember.default.Object.create());
		},

		/**
   * Loads attributes from the server.
   */
		loadAttributesFromServer: function (json) {
			var serverAttributes = this.get('serverAttributes');

			this.constructor.eachAttribute(function (attributeName, meta) {
				_ember.default.assert('Your JSON is missing the \'' + attributeName + '\' property.', !meta.isRequired || json.hasOwnProperty(attributeName));

				// TODO: Why is there here? I thought we weren't allowing this.
				var value = json.hasOwnProperty(attributeName) ? json[attributeName] : meta.getDefaultValue();
				serverAttributes.set(attributeName, value);

				this.synchronizeAttribute(attributeName);
			}, this);
		},

		/**
   * When an attribute's value is set directly (like in `pushPayload`), this
   * will synchronize the server and client attributes and fix the dirty state.
   */
		synchronizeAttribute: function (name) {
			var server = this.get('serverAttributes.' + name);
			var client = this.get('clientAttributes.' + name);

			var meta = this.constructor.metaForAttribute(name);
			var scope = meta.isEqual ? meta : this.get('store').attributeTypeFor(meta.type);

			if (scope.isEqual(server, client)) {
				delete this.get('clientAttributes')[name];
				this.notifyPropertyChange('clientAttributes');
			}
		},

		/**
   * Sets up attributes given to the constructor for this record.
   * Equivalent to setting the attribute values individually.
   */
		initializeAttributes: function (json) {
			this.constructor.eachAttribute(function (name, meta) {
				var value = json[name];

				if (value !== undefined) {
					this.set(name, value);
				}
			}, this);
		},

		areAttributesInitialized: function () {
			var initialized = true;

			this.constructor.eachAttribute(function (name, meta) {
				if (meta.isRequired && !meta.isServerOnly) {
					initialized = initialized && this.isAttributeInitialized(name);
				}
			}, this);

			return initialized;
		},

		/**
   * Determines if the given attribute has been initialized or not.
   * Always returns `true` for non-new records.
   *
   * @method isAttributeInitialized
   * @param attributeName
   * @return {Boolean}
   */
		isAttributeInitialized: function (attributeName) {
			return !this.get('isNew') || this.get(attributeName) !== undefined;
		}

	});

	CoreModel.reopenClass({

		/**
   * At extend time, this method goes though and declares properties
   * on the class for all attributes that were declared. It's done
   * this way so the name of the attributes is known when creating
   * the computed property.
   *
   * @method declareAttributes
   * @param {Object} attributes
   * @private
   * @static
   */
		declareAttributes: function (attributes) {
			var obj = {};

			_ember.default.runInDebug(function () {
				var RESERVED_NAMES = _emberGraphUtilSet.default.create();
				RESERVED_NAMES.addObjects(['id', 'type', 'content', 'length', 'model']);

				Object.keys(attributes).forEach(function (name) {
					_ember.default.assert('`' + name + '` cannot be used as an attribute name.', !RESERVED_NAMES.contains(name));
					_ember.default.assert('An attribute name cannot start with an underscore.', name.charAt(0) !== '_');
					_ember.default.assert('Attribute names must start with a lowercase letter.', name.charAt(0).match(/[a-z]/));
				});
			});

			Object.keys(attributes).forEach(function (name) {
				obj[name] = createAttribute(name, attributes[name].options);
			});

			this.reopen(obj);
		},

		/**
   * A set of all of the attribute names for this model.
   *
   * @property attributes
   * @type Set
   * @static
   * @readOnly
   */
		attributes: (0, _emberGraphUtilComputed.computed)({
			get: function () {
				var attributes = _emberGraphUtilSet.default.create();

				this.eachComputedProperty(function (name, meta) {
					if (meta.isAttribute) {
						attributes.addObject(name);
					}
				});

				return attributes;
			}
		}),

		/**
   * Returns the metadata for the given property name. This should
   * always be used over `metaForProperty` just in case the
   * implementations ever have to differ.
   *
   * @method metaForAttribute
   * @param {String} attributeName
   * @return {Object}
   * @static
   */
		metaForAttribute: _ember.default.aliasMethod('metaForProperty'),

		/**
   * @method isAttribute
   * @param {String} propertyName
   * @return {Boolean}
   * @static
   */
		isAttribute: function (propertyName) {
			return _ember.default.get(this, 'attributes').contains(propertyName);
		},

		/**
   * Calls the callback for each attribute defined on the model.
   *
   * @method eachAttribute
   * @param {Function} callback Function that takes `name` and `meta` parameters
   * @param [binding] Object to use as `this`
   * @static
   */
		eachAttribute: function (callback, binding) {
			this.eachComputedProperty(function (name, meta) {
				if (meta.isAttribute) {
					callback.call(binding, name, meta);
				}
			});
		}

	});

	exports.default = CoreModel;
});

define('ember-graph/model/model', ['exports', 'ember', 'ember-graph/model/core', 'ember-graph/model/states', 'ember-graph/model/relationship_load', 'ember-graph/util/util', 'ember-graph/util/string', 'ember-graph/util/computed', 'ember-graph/model/relationship'], function (exports, _ember, _emberGraphModelCore, _emberGraphModelStates, _emberGraphModelRelationship_load, _emberGraphUtilUtil, _emberGraphUtilString, _emberGraphUtilComputed, _emberGraphModelRelationship) {

	/**
  * Models are the classes that represent your domain data.
  * Each type of object in your domain should have its own
  * model, with attributes and relationships declared using the
  * [attr](EG.html#method_attr), [hasOne](EG.html#method_hasOne)
  * and [hasMany](EG.html#method_hasMany) functions.
  *
  * To create a model, subclass this class (or any other Model
  * subclass) and place it your app's namespace. The name
  * that you give it is important, since that's how it will be
  * looked up by the container. The usual convention is to use
  * a camel-cased name like `App.PostComment` or `App.ForumAdmin`.
  * For more information on resolving, read the Ember.js entry
  * on the [DefaultResolver](http://emberjs.com/api/classes/Ember.DefaultResolver.html).
  *
  * @class Model
  * @extends CoreModel
  * @uses Ember.Evented
  */
	var Model = _emberGraphModelCore.default.extend(_ember.default.Evented, {

		/**
   * This property is available on every model instance and every
   * model subclass (after being looked up at least once by the
   * container). This is the key that you use to refer to the model
   * in relationships and store methods. Examples:
   *
   * ```
   * App.User => user
   * App.PostComment => postComment
   * ```
   *
   * @property typeKey
   * @type String
   * @final
   */
		typeKey: null,

		_id: null,

		/**
   * The ID of the record. The ID can only be changed once, and only if
   * it's being changed from a temporary ID to a permanent one. Only the
   * store should change the ID from a temporary one to a permanent one.
   *
   * @property id
   * @type String
   * @final
   */
		id: (0, _emberGraphUtilComputed.computed)('_id', {
			get: function () {
				return this.get('_id');
			},
			set: function (key, value) {
				var id = this.get('_id');
				var prefix = this.constructor.temporaryIdPrefix;

				if (id === null || (0, _emberGraphUtilString.startsWith)(id, prefix) && !(0, _emberGraphUtilString.startsWith)(value, prefix)) {
					this.set('_id', value);
				} else {
					throw new _ember.default.Error('Cannot change the \'id\' property of a model.');
				}
			}
		}),

		/**
   * @property store
   * @type Store
   * @final
   */
		store: null,

		/**
   * Loads JSON data from the server into the record. This may be used when
   * the record is brand new, or when the record is being reloaded. This
   * should generally only be used by the store or for testing purposes.
   * However, this can be useful to override to intercept data before it's
   * loaded into the record;
   *
   * @method loadData
   * @param {Object} json
   * @deprecated Use `loadDataFromServer` instead
   */
		loadData: _ember.default.aliasMethod('loadDataFromServer'),

		/**
   * Takes a payload from the server and merges the data into the current data.
   * This is generally only called by the store, but it may be useful to
   * override it if you're looking to intercept and modify server data before
   * it's loaded into the record.
   *
   * @method loadDataFromServer
   * @param {Object} json
   */
		loadDataFromServer: function () {
			var json = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

			_ember.default.assert('The record `' + this.typeKey + ':' + this.get('id') + '` was attempted to be reloaded ' + 'while dirty with `reloadDirty` disabled.', !this.get('isDirty') || this.get('store.reloadDirty'));

			this.loadAttributesFromServer(json);
			this.loadRelationshipsFromServer(json);
		},

		/**
   * Takes the data passed to the store's {{link-to-method 'Store' 'createRecord'}}
   * method and loads it into the newly created record by calling the model's
   * public API methods for manipulating records. This should really only be
   * called by the store and when a record is brand new.
   *
   * @method initializeRecord
   * @param {Object} json
   */
		initializeRecord: function () {
			var json = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

			this.initializeAttributes(json);
			this.initializeRelationships(json);
		},

		/**
   * Proxies the store's save method for convenience.
   *
   * @method save
   * @return Promise
   */
		save: function () {
			var _this = this;
			var property = null;

			if (this.get('isNew')) {
				property = 'isCreating';
			} else {
				property = 'isSaving';
			}

			this.set(property, true);
			return this.get('store').saveRecord(this).finally(function () {
				_this.set(property, false);
			});
		},

		/**
   * Proxies the store's reload method for convenience.
   *
   * @method reload
   * @return Promise
   */
		reload: function () {
			var _this = this;

			this.set('isReloading', true);
			return this.get('store').reloadRecord(this).finally(function () {
				_this.set('isReloading', false);
			});
		},

		/**
   * Proxies the store's delete method for convenience.
   *
   * @method destroy
   * @return Promise
   */
		destroy: function () {
			var _this = this;

			this.set('isDeleting', true);
			return this.get('store').deleteRecord(this).then(function () {
				_this.set('isDeleted', true);
				_this.set('store', null);
			}).finally(function () {
				_this.set('isDeleting', false);
			});
		},

		/**
   * Determines if the other object is a model that represents the same record.
   *
   * @method isEqual
   * @return Boolean
   */
		isEqual: function (other) {
			if (!other) {
				return;
			}

			return this.typeKey === _ember.default.get(other, 'typeKey') && this.get('id') === _ember.default.get(other, 'id');
		},

		/**
   * Determines if the newly created record is fully initialized yet.
   * If it's not initialized, it can't be persisted to the server.
   * This will always return `true` for non-new records.
   */
		isInitialized: function () {
			return !this.get('isNew') || this.areAttributesInitialized() && this.areRelationshipsInitialized();
		},

		/**
   * Rolls back changes to both attributes and relationships.
   *
   * @method rollback
   */
		rollback: function () {
			this.rollbackAttributes();
			this.rollbackRelationships();
		}
	});

	Model.reopenClass({

		/**
   * The prefix added to generated IDs to show that the prefix wasn't given
   * by the server and is only temporary until the real one comes in.
   *
   * @property temporaryIdPrefix
   * @type String
   * @static
   */
		temporaryIdPrefix: 'EG_TEMP_ID_',

		/**
   * @method isTemporaryId
   * @param {String} id
   * @return Boolean
   * @static
   */
		isTemporaryId: function (id) {
			return (0, _emberGraphUtilString.startsWith)(id, this.temporaryIdPrefix);
		},

		/**
   * This method creates a record shell, initializing the `store` and `id` properties.
   * (The ID is a temporary ID.) **This can only be called by the store.** Calling it
   * yourself will decouple the record from the store, causing odd behavior.
   *
   * @method create
   * @param {Store} store
   * @return {Model}
   */
		create: function (store) {
			var record = this._super();
			record.set('store', store);
			record.set('_id', _ember.default.get(this, 'temporaryIdPrefix') + (0, _emberGraphUtilUtil.generateUUID)());
			return record;
		},

		/**
   * @method extend
   * @static
   */
		extend: function () {
			var args = Array.prototype.slice.call(arguments, 0);
			var options = args.pop() || {};
			var attributes = {};
			var relationships = {};

			// Ember.Mixin doesn't have a `detectInstance` method
			if (!(options instanceof _ember.default.Mixin)) {
				Object.keys(options).forEach(function (key) {
					var value = options[key];

					if (options[key]) {
						if (options[key].isRelationship) {
							relationships[key] = value;
							delete options[key];
						} else if (options[key].isAttribute) {
							attributes[key] = value;
							delete options[key];
						}
					}
				});
			}

			args.push(options);

			var subclass = this._super.apply(this, args);
			subclass.declareAttributes(attributes);
			subclass.declareRelationships(relationships);
			return subclass;
		},

		/**
   * Determines if the two objects passed in are equal models (or model proxies).
   *
   * @param {Model} a
   * @param {Model} b
   * @return Boolean
   * @static
   */
		isEqual: function (a, b) {
			if (_ember.default.isNone(a) || _ember.default.isNone(b)) {
				return false;
			}

			if (this.detectInstance(a)) {
				return a.isEqual(b);
			}

			if (this.detectInstance(b)) {
				return b.isEqual(a);
			}

			if (this.detectInstance(_ember.default.get(a, 'content'))) {
				return _ember.default.get(a, 'content').isEqual(b);
			}

			if (this.detectInstance(_ember.default.get(b, 'content'))) {
				return _ember.default.get(b, 'content').isEqual(a);
			}

			return false;
		}
	});

	Model.reopen(_emberGraphModelStates.default);
	Model.reopen(_emberGraphModelRelationship.RelationshipPublicMethods);
	Model.reopen(_emberGraphModelRelationship.RelationshipPrivateMethods);
	Model.reopen(_emberGraphModelRelationship_load.default);
	Model.reopenClass(_emberGraphModelRelationship.RelationshipClassMethods);
	Model.reopenClass({
		HAS_ONE_KEY: _emberGraphModelRelationship.HAS_ONE_KEY,
		HAS_MANY_KEY: _emberGraphModelRelationship.HAS_MANY_KEY
	});

	exports.default = Model;
});

define('ember-graph/model/relationship', ['exports', 'ember', 'ember-graph/relationship/relationship', 'ember-graph/relationship/relationship_store', 'ember-graph/util/set', 'ember-graph/util/computed', 'ember-graph/util/util', 'ember-graph/constants'], function (exports, _ember, _emberGraphRelationshipRelationship, _emberGraphRelationshipRelationship_store, _emberGraphUtilSet, _emberGraphUtilComputed, _emberGraphUtilUtil, _emberGraphConstants) {

	var HAS_ONE_KEY = _emberGraphConstants.RelationshipTypes.HAS_ONE_KEY;
	var HAS_MANY_KEY = _emberGraphConstants.RelationshipTypes.HAS_MANY_KEY;

	var CLIENT_STATE = _emberGraphRelationshipRelationship.default.CLIENT_STATE;
	var SERVER_STATE = _emberGraphRelationshipRelationship.default.SERVER_STATE;
	var DELETED_STATE = _emberGraphRelationshipRelationship.default.DELETED_STATE;

	var HAS_ONE_GETTER = function (key) {
		return this.getHasOneValue(key.substring(1), false);
	};

	var HAS_MANY_GETTER = function (key) {
		return this.getHasManyValue(key.substring(1), false);
	};

	var createRelationship = function (name, kind, options) {
		_ember.default.assert('Invalid relatedType', _ember.default.typeOf(options.relatedType) === 'string');
		_ember.default.assert('Invalid inverse', options.inverse === null || _ember.default.typeOf(options.inverse) === 'string');

		var meta = {
			// the 'real' relationship (without _) is the relationship
			isRelationship: false,
			kind: kind,
			isRequired: options.hasOwnProperty('defaultValue') ? false : options.isRequired !== false,
			defaultValue: options.defaultValue,
			relatedType: options.relatedType,
			inverse: options.inverse,
			isReadOnly: options.readOnly === true || options.serverOnly === true,
			isPolymorphic: options.polymorphic === true,
			isServerOnly: options.serverOnly === true,

			getDefaultValue: function () {
				var defaultValue = this.defaultValue || (kind === HAS_MANY_KEY ? [] : null);
				return typeof defaultValue === 'function' ? defaultValue() : defaultValue;
			}
		};

		_ember.default.assert('defaultValue for hasMany must be an array.', meta.kind === HAS_ONE_KEY || _ember.default.isArray(meta.getDefaultValue()));
		_ember.default.assert('defaultValue for hasOne must be null or a string.', meta.kind === HAS_MANY_KEY || meta.getDefaultValue() === null || _ember.default.typeOf(meta.getDefaultValue()) === 'string');

		return (0, _emberGraphUtilComputed.computed)('relationships.{client,deleted,server}.' + name, { 'get': meta.kind === HAS_MANY_KEY ? HAS_MANY_GETTER : HAS_ONE_GETTER }).meta(meta);
	};

	var RelationshipClassMethods = {

		/**
   * Fetch the metadata for a relationship property.
   *
   * @method metaForRelationship
   * @for Model
   * @param {String} relationshipName
   * @return {Object}
   * @static
   */
		metaForRelationship: _ember.default.aliasMethod('metaForProperty'),

		/**
   * Determines the kind (multiplicity) of the given relationship.
   *
   * @method relationshipKind
   * @for Model
   * @param {String} name
   * @returns {String} `hasMany` or `hasOne`
   * @static
   */
		relationshipKind: function (name) {
			return this.metaForRelationship(name).kind;
		},

		/**
   * Calls the callback for each relationship defined on the model.
   *
   * @method eachRelationship
   * @for Model
   * @param {Function} callback Function that takes `name` and `meta` parameters
   * @param [binding] Object to use as `this`
   * @static
   */
		eachRelationship: function (callback, binding) {
			this.eachComputedProperty(function (name, meta) {
				if (meta.isRelationship) {
					callback.call(binding, name, meta);
				}
			});
		},

		declareRelationships: function (relationships) {
			var obj = {};

			_ember.default.runInDebug(function () {
				var disallowedNames = _emberGraphUtilSet.default.create();
				disallowedNames.addObjects(['id', 'type', 'content', 'length', 'model']);

				Object.keys(relationships).forEach(function (name) {
					_ember.default.assert('`' + name + '` cannot be used as a relationship name.', !disallowedNames.contains(name));
					_ember.default.assert('A relationship name cannot start with an underscore.', name.charAt(0) !== '_');
					_ember.default.assert('Relationship names must start with a lowercase letter.', name.charAt(0).match(/[a-z]/));
				});
			});

			Object.keys(relationships).forEach(function (name) {
				obj['_' + name] = createRelationship(name, relationships[name].kind, relationships[name].options);
				var meta = _ember.default.copy(obj['_' + name].meta(), true);
				var relatedType = meta.relatedType;

				var relationship;

				// We're not going to close over many variables for the sake of speed
				if (meta.kind === HAS_ONE_KEY) {
					relationship = function (key) {
						var value = this.get('_' + key);
						return value ? this.get('store').find(value.type, value.id) : null;
					};
				} else if (!meta.isPolymorphic) {
					relationship = function (key) {
						var value = this.get('_' + key);
						var ids = value.map(function (item) {
							return item.id;
						});
						return this.get('store').find(relatedType, ids);
					};
				} else {
					relationship = function (key) {
						var store = this.get('store');
						var value = this.get('_' + key);
						var groups = (0, _emberGraphUtilUtil.groupRecords)(value);
						var promises = groups.map(function (group) {
							var ids = group.map(function (item) {
								return item.id;
							});
							return store.find(group[0].type, ids);
						});
						return _ember.default.RSVP.Promise.all(promises).then(function (groups) {
							return groups.reduce(function (array, group) {
								return array.concat(group);
							}, []);
						});
					};
				}

				meta.isRelationship = true;
				obj[name] = (0, _emberGraphUtilComputed.computed)('_' + name, { 'get': relationship }).meta(meta);
			});

			this.reopen(obj);
		}

	};

	var RelationshipPublicMethods = {

		areRelationshipsDirty: (0, _emberGraphUtilComputed.computed)('relationships.{client,deleted}.length', {
			get: function () {
				return this.get('relationships.client.length') > 0 || this.get('relationships.deleted.length') > 0;
			}
		}),

		/**
   * Gets all of the dirty relationships for the model. The object returned
   * is of the format:
   *
   * ```js
   * {
   *     relationshipName: [oldValue, newValue]
   * }
   * ```
   *
   * @method changedRelationships
   * @for Model
   * @returns {Object}
   */
		changedRelationships: function () {
			var changes = {};

			this.constructor.eachRelationship(function (name, meta) {
				if (meta.isReadOnly) {
					return;
				}

				if (meta.kind === HAS_MANY_KEY) {
					var oldVal = this.getHasManyValue(name, true);
					var newVal = this.getHasManyValue(name, false);

					if (!(0, _emberGraphUtilUtil.arrayContentsEqual)(oldVal, newVal)) {
						changes[name] = [oldVal, newVal];
					}
				} else {
					var oldVal = this.getHasOneValue(name, true);
					var newVal = this.getHasOneValue(name, false);

					if (!oldVal && !newVal) {
						return;
					}

					if (!oldVal && newVal || oldVal && !newVal || oldVal.typeKey !== newVal.typeKey || oldVal.id !== newVal.id) {
						changes[name] = [oldVal, newVal];
					}
				}
			}, this);

			return changes;
		},

		/**
   * Resets all of the relationships to the last known server state.
   *
   * @method rollbackRelationships
   * @for Model
   */
		rollbackRelationships: function () {
			_ember.default.changeProperties(function () {
				var store = this.get('store');

				var client = this.get('relationships').getRelationshipsByState(CLIENT_STATE);
				client.forEach(function (relationship) {
					store.deleteRelationship(relationship);
				});

				var deleted = this.get('relationships').getRelationshipsByState(DELETED_STATE);
				deleted.forEach(function (relationship) {
					store.changeRelationshipState(relationship, SERVER_STATE);
				});
			}, this);
		},

		/**
   * Adds a value to the given hasMany relationship. The `id` parameter can
   * be either a string or a model instance. If it's a model, the ID and
   * type and detected automatically. If it's a string, the type should
   * be given explicitly for polymorphic relationships. If the relationship
   * is non-polymorphic, the declared `relatedType` will be used.
   *
   * @method addToRelationship
   * @for Model
   * @param {String} relationshipName
   * @param {String|Model} id
   * @param {String} [polymorphicType] Defaults to declared `relatedType`
   */
		addToRelationship: function (relationshipName, id, polymorphicType) {
			var meta = this.constructor.metaForRelationship(relationshipName);
			if (meta.kind !== HAS_MANY_KEY) {
				throw new _ember.default.Error('`addToRelationship` called on hasOne relationship.');
			}

			if (meta.isReadOnly && !this.get('isNew')) {
				throw new _ember.default.Error('Can\'t modify a read-only relationship.');
			}

			_ember.default.changeProperties(function () {
				this.set('initializedRelationships.' + relationshipName, true);

				var store = this.get('store');

				// If the type wasn't provided, fill it in based on the inverse
				if (_ember.default.typeOf(id) !== 'string') {
					polymorphicType = _ember.default.get(id, 'typeKey'); // eslint-disable-line no-param-reassign
					id = _ember.default.get(id, 'id'); // eslint-disable-line no-param-reassign
				} else if (_ember.default.typeOf(polymorphicType) !== 'string') {
						polymorphicType = meta.relatedType; // eslint-disable-line no-param-reassign
					}

				var otherModel = store.modelFor(polymorphicType);
				var otherMeta = meta.inverse === null ? null : otherModel.metaForRelationship(meta.inverse);
				var currentValues = this.getHasManyRelationships(relationshipName, false);
				var serverValues = this.getHasManyRelationships(relationshipName, true);

				// Check to see if the records are already connected
				for (var i = 0; i < currentValues.length; ++i) {
					if (currentValues[i].otherType(this) === polymorphicType && currentValues[i].otherId(this) === id) {
						return;
					}
				}

				// If the inverse is null or a hasMany, we can create the relationship without conflict
				if (meta.inverse === null || otherMeta.kind === HAS_MANY_KEY) {
					// Check for delete relationships first
					for (var i = 0; i < serverValues.length; ++i) {
						if (serverValues[i].otherType(this) === polymorphicType && serverValues[i].otherId(this) === id) {
							store.changeRelationshipState(serverValues[i], SERVER_STATE);
							return;
						}
					}

					store.createRelationship(this.typeKey, this.get('id'), relationshipName, polymorphicType, id, meta.inverse, CLIENT_STATE);

					return;
				}

				// Make sure there are no conflicts on the other side since it's a hasOne
				var otherValues = store.sortHasOneRelationships(polymorphicType, id, meta.inverse);
				if (otherValues[SERVER_STATE]) {
					store.changeRelationshipState(otherValues[SERVER_STATE], DELETED_STATE);
				} else if (otherValues[CLIENT_STATE]) {
					store.deleteRelationship(otherValues[CLIENT_STATE]);
				}

				// Check for any deleted relationships that match the one we need
				for (var i = 0; i < serverValues.length; ++i) {
					if (serverValues[i].otherType(this) === polymorphicType && serverValues[i].otherId(this) === id) {
						store.changeRelationshipState(serverValues[i], SERVER_STATE);
						return;
					}
				}

				// If all else fails, create a relationship
				store.createRelationship(this.typeKey, this.get('id'), relationshipName, polymorphicType, id, meta.inverse, CLIENT_STATE);
			}, this);
		},

		/**
   * Removes a value from the given hasMany relationship. The `id` parameter can
   * be either a string or a model instance. If it's a model, the ID and
   * type and detected automatically. If it's a string, the type should
   * be given explicitly for polymorphic relationships. If the relationship
   * is non-polymorphic, the declared `relatedType` will be used.
   *
   * @method removeFromRelationship
   * @for Model
   * @param {String} relationshipName
   * @param {String|Model} id
   * @param {String} [polymorphicType] Defaults to declared `relatedType`
   */
		removeFromRelationship: function (relationshipName, id, polymorphicType) {
			var meta = this.constructor.metaForRelationship(relationshipName);
			if (meta.kind !== HAS_MANY_KEY) {
				throw new _ember.default.Error('`removeFromRelationship` called on hasOne relationship.');
			}

			if (meta.isReadOnly && !this.get('isNew')) {
				throw new _ember.default.Error('Can\'t modify a read-only relationship.');
			}

			_ember.default.changeProperties(function () {
				// If the type wasn't provided, fill it in based on the inverse
				if (_ember.default.typeOf(id) !== 'string') {
					polymorphicType = _ember.default.get(id, 'typeKey'); // eslint-disable-line no-param-reassign
					id = _ember.default.get(id, 'id'); // eslint-disable-line no-param-reassign
				} else if (_ember.default.typeOf(polymorphicType) !== 'string') {
						polymorphicType = meta.relatedType; // eslint-disable-line no-param-reassign
					}

				var relationships = this.getHasManyRelationships(relationshipName, false);
				for (var i = 0; i < relationships.length; ++i) {
					if (relationships[i].otherType(this) === polymorphicType && relationships[i].otherId(this) === id) {
						if (relationships[i].get('state') === CLIENT_STATE) {
							this.get('store').deleteRelationship(relationships[i]);
						} else {
							this.get('store').changeRelationshipState(relationships[i], DELETED_STATE);
						}

						break;
					}
				}
			}, this);
		},

		/**
   * Sets the value of the given hasOne relationship. The `id` parameter can
   * be either a string or a model instance. If it's a model, the ID and
   * type and detected automatically. If it's a string, the type should
   * be given explicitly for polymorphic relationships. If the relationship
   * is non-polymorphic, the declared `relatedType` will be used.
   *
   * @method setHasOneRelationship
   * @for Model
   * @param {String} relationshipName
   * @param {String|Model} id
   * @param {String} [polymorphicType] Defaults to declared `relatedType`
   */
		setHasOneRelationship: function (relationshipName, id, polymorphicType) {
			var meta = this.constructor.metaForRelationship(relationshipName);
			if (meta.kind !== HAS_ONE_KEY) {
				throw new _ember.default.Error('`setHasOneRelationship` called on hasMany relationship.');
			}

			if (meta.isReadOnly && !this.get('isNew')) {
				throw new _ember.default.Error('Can\'t modify a read-only relationship.');
			}

			_ember.default.changeProperties(function () {
				this.set('initializedRelationships.' + relationshipName, true);

				var store = this.get('store');

				// If the type wasn't provided, fill it in based on the inverse
				if (_ember.default.typeOf(id) !== 'string') {
					polymorphicType = id.typeKey; // eslint-disable-line no-param-reassign
					id = id.get('id'); // eslint-disable-line no-param-reassign
				} else if (_ember.default.typeOf(polymorphicType) !== 'string') {
						polymorphicType = meta.relatedType; // eslint-disable-line no-param-reassign
					}

				var otherModel = store.modelFor(polymorphicType);
				var otherMeta = meta.inverse === null ? null : otherModel.metaForRelationship(meta.inverse);
				var currentRelationships = store.sortHasOneRelationships(this.typeKey, this.get('id'), relationshipName);

				// First make sure they're not already connected
				if (currentRelationships[SERVER_STATE] && currentRelationships[SERVER_STATE].otherType(this) === polymorphicType && currentRelationships[SERVER_STATE].otherId(this) === id) {
					return;
				}

				if (currentRelationships[CLIENT_STATE] && currentRelationships[CLIENT_STATE].otherType(this) === polymorphicType && currentRelationships[CLIENT_STATE].otherId(this) === id) {
					return;
				}

				// They're not connected, so we definitely have to get rid of the current value
				if (currentRelationships[SERVER_STATE]) {
					store.changeRelationshipState(currentRelationships[SERVER_STATE], DELETED_STATE);
				} else if (currentRelationships[CLIENT_STATE]) {
					store.deleteRelationship(currentRelationships[CLIENT_STATE]);
				}

				// If the inverse is null or a hasMany, we can just create the relationship
				if (meta.inverse === null || otherMeta.kind === HAS_MANY_KEY) {
					var temp1;
					// Check for a deleted relationship first
					for (var i = 0; i < currentRelationships[DELETED_STATE].length; ++i) {
						temp1 = currentRelationships[DELETED_STATE][i];
						if (temp1.otherType(this) === polymorphicType && temp1.otherId(this) === id) {
							store.changeRelationshipState(temp1, SERVER_STATE);
							return;
						}
					}

					// If we can't find one, just create a new relationship
					store.createRelationship(this.typeKey, this.get('id'), relationshipName, polymorphicType, id, meta.inverse, CLIENT_STATE);

					return;
				}

				// We have to make sure there are no conflicts on the other side, since it's also a hasOne
				var otherRelationships = store.sortHasOneRelationships(polymorphicType, id, meta.inverse);
				if (otherRelationships[SERVER_STATE]) {
					store.changeRelationshipState(otherRelationships[SERVER_STATE], DELETED_STATE);
				} else if (otherRelationships[CLIENT_STATE]) {
					store.deleteRelationship(otherRelationships[CLIENT_STATE]);
				}

				// Finally, check for a deleted relationship between the two
				var temp2;
				for (var j = 0; j < currentRelationships[DELETED_STATE].length; ++j) {
					temp2 = currentRelationships[DELETED_STATE][j];
					if (temp2.otherType(this) === polymorphicType && temp2.otherId(this) === id) {
						store.changeRelationshipState(temp2, SERVER_STATE);
						return;
					}
				}

				// If all else fails, create a relationship
				store.createRelationship(this.typeKey, this.get('id'), relationshipName, polymorphicType, id, meta.inverse, CLIENT_STATE);
			}, this);
		},

		/**
   * Clears the value of the given hasOne relationship.
   *
   * @method clearHasOneRelationship
   * @for Model
   * @param {String} relationshipName
   */
		clearHasOneRelationship: function (relationshipName) {
			var meta = this.constructor.metaForRelationship(relationshipName);
			if (meta.kind !== HAS_ONE_KEY) {
				throw new _ember.default.Error('`clearHasOneRelationship` called on hasMany relationship.');
			}

			if (meta.isReadOnly && !this.get('isNew')) {
				throw new _ember.default.Error('Can\'t modify a read-only relationship.');
			}

			_ember.default.changeProperties(function () {
				var relationship = this.getHasOneRelationship(relationshipName, false);
				if (relationship) {
					if (relationship.get('state') === CLIENT_STATE) {
						this.get('store').deleteRelationship(relationship);
					} else {
						this.get('store').changeRelationshipState(relationship, DELETED_STATE);
					}
				}
			}, this);
		},

		/**
   * Determines whether or not every required attribute has been initialized.
   * If this returns false, the record cannot be persisted to the server.
   *
   * @method areRelationshipsInitialized
   * @for Model
   * @return {Boolean}
   */
		areRelationshipsInitialized: function () {
			var initialized = true;

			this.constructor.eachRelationship(function (name, meta) {
				if (meta.isRequired && !meta.isServerOnly) {
					initialized = initialized && this.isRelationshipInitialized(name);
				}
			}, this);

			return initialized;
		},

		/**
   * Determines if the given relationship has been initialized yet.
   * Always returns `true` for non-new records.
   *
   * @method isRelationshipInitialized
   * @for Model
   * @param {String} relationshipName
   * @return {Boolean}
   */
		isRelationshipInitialized: function (relationshipName) {
			return !this.get('isNew') || !!this.get('initializedRelationships.' + relationshipName);
		}

	};

	var RelationshipPrivateMethods = {

		/**
   * Stores all of the relationships currently connected to this record.
   * The model itself should only read from this object. All additions
   * and deletions are handled by the store (so they can be reciprocated).
   *
   * @type RelationshipMap
   * @private
   */
		relationships: null,

		/**
   * Stores which relationships have had values set.
   *
   * @type Object
   * @private
   */
		initializedRelationships: null,

		initializeRelationshipStoreAndStatus: _ember.default.on('init', function () {
			this.setProperties({
				relationships: _emberGraphRelationshipRelationship_store.default.create(),
				initializedRelationships: {}
			});
		}),

		getHasOneRelationship: function (name, server) {
			var relationships;

			if (server) {
				relationships = this.get('relationships').getServerRelationships(name);
			} else {
				relationships = this.get('relationships').getCurrentRelationships(name);
			}

			if (relationships.length <= 0) {
				return null;
			} else {
				return relationships[0];
			}
		},

		getHasOneValue: function (name, server) {
			var relationship = this.getHasOneRelationship(name, server);

			if (relationship === null) {
				return null;
			} else {
				return {
					type: relationship.otherType(this),
					id: relationship.otherId(this)
				};
			}
		},

		getHasManyRelationships: function (name, server) {
			if (server) {
				return this.get('relationships').getServerRelationships(name);
			} else {
				return this.get('relationships').getCurrentRelationships(name);
			}
		},

		getHasManyValue: function (name, server) {
			return this.getHasManyRelationships(name, server).map(function (relationship) {
				return {
					type: relationship.otherType(this),
					id: relationship.otherId(this)
				};
			}, this);
		}

	};

	exports.RelationshipClassMethods = RelationshipClassMethods;
	exports.RelationshipPublicMethods = RelationshipPublicMethods;
	exports.RelationshipPrivateMethods = RelationshipPrivateMethods;
	exports.HAS_ONE_KEY = HAS_ONE_KEY;
	exports.HAS_MANY_KEY = HAS_MANY_KEY;
});

define('ember-graph/model/relationship_load', ['exports', 'ember', 'ember-graph/util/util', 'ember-graph/constants'], function (exports, _ember, _emberGraphUtilUtil, _emberGraphConstants) {

	var HAS_ONE_KEY = _emberGraphConstants.RelationshipTypes.HAS_ONE_KEY;
	var HAS_MANY_KEY = _emberGraphConstants.RelationshipTypes.HAS_MANY_KEY;

	var CLIENT_STATE = _emberGraphConstants.RelationshipStates.CLIENT_STATE;
	var SERVER_STATE = _emberGraphConstants.RelationshipStates.SERVER_STATE;
	var DELETED_STATE = _emberGraphConstants.RelationshipStates.DELETED_STATE;

	// TODO: This can probably be moved into the store to be more model-agnostic
	// Idea: load attributes into records directly, but load relationships into store
	// Split the data apart in `pushPayload`
	exports.default = {

		/**
   * Sets up relationships given to the constructor for this record.
   * Equivalent to calling the relationship functions individually.
   *
   * @private
   */
		initializeRelationships: function (json) {
			this.constructor.eachRelationship(function (name, meta) {
				var value = json[name];

				if (value === undefined) {
					return;
				}

				this.set('initializedRelationships.' + name, true);

				if (meta.kind === HAS_MANY_KEY) {
					value.forEach(function (v) {
						switch (_ember.default.typeOf(v)) {
							case 'string':
								this.addToRelationship(name, v);
								break;
							case 'instance':
								this.addToRelationship(name, v.get('id'), v.get('typeKey'));
								break;
							default:
								this.addToRelationship(name, v.id, v.type);
								break;
						}
					}, this);
				} else {
					switch (_ember.default.typeOf(value)) {
						case 'string':
							this.setHasOneRelationship(name, value);
							break;
						case 'null':
							// It's already null
							break;
						case 'instance':
							this.setHasOneRelationship(name, value.get('id'), value.get('typeKey'));
							break;
						default:
							this.setHasOneRelationship(name, value.id, value.type);
							break;
					}
				}
			}, this);
		},

		/**
   * Merges relationship data from the server into the relationships
   * already connected to this record. Any absolutely correct choices
   * are made automatically, while choices that come down to preference
   * are decided based on the configurable store properties.
   *
   * @param {Object} json
   * @private
   */
		loadRelationshipsFromServer: function (json) {
			this.constructor.eachRelationship(function (name, meta) {
				var otherKind = null;

				if (meta.inverse) {
					otherKind = this.get('store').modelFor(meta.relatedType).metaForRelationship(meta.inverse).kind;
				}

				// TODO: I don't much like this here. Same for the attributes one.
				if (meta.isRequired && json[name] === undefined) {
					throw new _ember.default.Error('Your JSON is missing the required `' + name + '` relationship.');
				}

				if (json[name] === undefined) {
					json[name] = meta.getDefaultValue();
				}

				if (meta.kind === HAS_MANY_KEY) {
					switch (otherKind) {
						case HAS_ONE_KEY:
							this.connectHasManyToHasOne(name, meta, json[name]);
							break;
						case HAS_MANY_KEY:
							this.connectHasManyToHasMany(name, meta, json[name]);
							break;
						default:
							this.connectHasManyToNull(name, meta, json[name]);
							break;
					}
				} else {
					if (json[name]) {
						switch (otherKind) {
							case HAS_ONE_KEY:
								this.connectHasOneToHasOne(name, meta, json[name]);
								break;
							case HAS_MANY_KEY:
								this.connectHasOneToHasMany(name, meta, json[name]);
								break;
							default:
								this.connectHasOneToNull(name, meta, json[name]);
								break;
						}
					} else {
						switch (otherKind) {
							case HAS_ONE_KEY:
								this.disconnectHasOneFromHasOne(name, meta);
								break;
							case HAS_MANY_KEY:
								this.disconnectHasOneFromHasMany(name, meta);
								break;
							default:
								this.disconnectHasOneFromNull(name, meta);
								break;
						}
					}
				}
			}, this);
		},

		disconnectHasOneFromNull: _ember.default.aliasMethod('disconnectHasOneFromHasMany'),

		disconnectHasOneFromHasOne: _ember.default.aliasMethod('disconnectHasOneFromHasMany'),

		disconnectHasOneFromHasMany: function (name, meta) {
			var store = this.get('store');
			var relationships = store.sortHasOneRelationships(this.typeKey, this.get('id'), name);

			if (relationships[DELETED_STATE].length > 0) {
				relationships[DELETED_STATE].forEach(function (relationship) {
					store.deleteRelationship(relationship);
				}, this);
			}

			if (!relationships[SERVER_STATE] && !relationships[CLIENT_STATE]) {
				return;
			}

			if (relationships[SERVER_STATE] && !relationships[CLIENT_STATE]) {
				store.deleteRelationship(relationships[SERVER_STATE]);
				return;
			}

			if (!relationships[SERVER_STATE] && relationships[CLIENT_STATE]) {
				if (!store.get('sideWithClientOnConflict')) {
					store.deleteRelationship(relationships[CLIENT_STATE]);
				}
			}
		},

		connectHasOneToNull: _ember.default.aliasMethod('connectHasOneToHasMany'),

		connectHasOneToHasOne: function (name, meta, value) {
			// TODO: This is going to be LONG. But make it right, then make it good
			var thisType = this.typeKey;
			var thisId = this.get('id');
			var store = this.get('store');
			var sideWithClientOnConflict = store.get('sideWithClientOnConflict');

			var theseValues = store.sortHasOneRelationships(thisType, thisId, name);
			var otherValues = store.sortHasOneRelationships(value.type, value.id, meta.inverse);

			var thisCurrent = theseValues[SERVER_STATE] || theseValues[CLIENT_STATE] || null;
			var otherCurrent = otherValues[SERVER_STATE] || otherValues[CLIENT_STATE] || null;
			if (thisCurrent === otherCurrent) {
				store.changeRelationshipState(thisCurrent, SERVER_STATE);
				return;
			}

			// Hehe, I'm going to look back on this one day...
			var handled;

			if (!theseValues[SERVER_STATE] && !theseValues[CLIENT_STATE] && theseValues[DELETED_STATE].length <= 0) {
				if (!otherValues[SERVER_STATE] && !otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length <= 0) {
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
					return;
				}

				if (otherValues[SERVER_STATE] && !otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length <= 0) {
					store.deleteRelationship(otherValues[SERVER_STATE]);
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
					return;
				}

				if (!otherValues[SERVER_STATE] && otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length <= 0) {
					if (sideWithClientOnConflict) {
						store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
					} else {
						store.deleteRelationship(otherValues[CLIENT_STATE]);
						store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
					}
					return;
				}

				if (!otherValues[SERVER_STATE] && !otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length > 0) {
					handled = false;

					otherValues[DELETED_STATE].forEach(function (relationship) {
						if (relationship.otherType(this) === value.type && relationship.otherId(this) === value.id) {
							if (sideWithClientOnConflict) {
								// NOOP
							} else {
									store.changeRelationshipState(relationship, SERVER_STATE);
								}

							handled = true;
						} else {
							store.deleteRelationship(relationship);
						}
					}, this);

					if (!handled) {
						store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
					}

					return;
				}

				if (!otherValues[SERVER_STATE] && otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length > 0) {
					handled = false;

					otherValues[DELETED_STATE].forEach(function (relationship) {
						if (relationship.otherType(this) === value.type && relationship.otherId(this) === value.id) {
							if (sideWithClientOnConflict) {
								// NOOP
							} else {
									store.deleteRelationship(otherValues[CLIENT_STATE]);
									store.changeRelationshipState(relationship, SERVER_STATE);
								}

							handled = true;
						} else {
							store.deleteRelationship(relationship);
						}
					}, this);

					if (!handled) {
						if (sideWithClientOnConflict) {
							store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
						} else {
							store.deleteRelationship(otherValues[CLIENT_STATE]);
							store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
						}
					}

					return;
				}
			}

			if (theseValues[SERVER_STATE] && !theseValues[CLIENT_STATE] && theseValues[DELETED_STATE].length <= 0) {
				store.deleteRelationship(theseValues[SERVER_STATE]);

				if (!otherValues[SERVER_STATE] && !otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length <= 0) {
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
					return;
				}

				if (otherValues[SERVER_STATE] && !otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length <= 0) {
					store.deleteRelationship(otherValues[SERVER_STATE]);
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
					return;
				}

				if (!otherValues[SERVER_STATE] && otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length <= 0) {
					if (sideWithClientOnConflict) {
						store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
					} else {
						store.deleteRelationship(otherValues[CLIENT_STATE]);
						store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
					}

					return;
				}

				if (!otherValues[SERVER_STATE] && !otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length > 0) {
					handled = false;

					otherValues[DELETED_STATE].forEach(function (relationship) {
						if (relationship.otherType(this) === value.type && relationship.otherId(this) === value.id) {
							if (sideWithClientOnConflict) {
								// NOOP
							} else {
									store.changeRelationshipState(relationship, SERVER_STATE);
								}

							handled = true;
						} else {
							store.deleteRelationship(relationship);
						}
					}, this);

					if (!handled) {
						store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
					}

					return;
				}

				if (!otherValues[SERVER_STATE] && otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length > 0) {
					handled = false;

					otherValues[DELETED_STATE].forEach(function (relationship) {
						if (relationship.otherType(this) === value.type && relationship.otherId(this) === value.id) {
							if (sideWithClientOnConflict) {
								// NOOP
							} else {
									store.deleteRelationship(otherValues[CLIENT_STATE]);
									store.changeRelationshipState(relationship, SERVER_STATE);
								}

							handled = true;
						} else {
							store.deleteRelationship(relationship);
						}
					}, this);

					if (!handled) {
						if (sideWithClientOnConflict) {
							store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
						} else {
							store.deleteRelationship(otherValues[CLIENT_STATE]);
							store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
						}
					}

					return;
				}
			}

			if (!theseValues[SERVER_STATE] && theseValues[CLIENT_STATE] && theseValues[DELETED_STATE].length <= 0) {
				if (!otherValues[SERVER_STATE] && !otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length <= 0) {
					if (sideWithClientOnConflict) {
						store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
					} else {
						store.deleteRelationship(theseValues[CLIENT_STATE]);
						store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
					}

					return;
				}

				if (otherValues[SERVER_STATE] && !otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length <= 0) {
					store.deleteRelationship(otherValues[SERVER_STATE]);

					if (sideWithClientOnConflict) {
						store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
					} else {
						store.deleteRelationship(theseValues[CLIENT_STATE]);
						store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
					}

					return;
				}

				if (!otherValues[SERVER_STATE] && otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length <= 0) {
					if (sideWithClientOnConflict) {
						store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
					} else {
						store.deleteRelationship(theseValues[CLIENT_STATE]);
						store.deleteRelationship(otherValues[CLIENT_STATE]);
						store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
					}

					return;
				}

				if (!otherValues[SERVER_STATE] && !otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length > 0) {
					otherValues[DELETED_STATE].forEach(function (relationship) {
						store.deleteRelationship(relationship);
					});

					if (sideWithClientOnConflict) {
						store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
					} else {
						store.deleteRelationship(theseValues[CLIENT_STATE]);
						store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
					}

					return;
				}

				if (!otherValues[SERVER_STATE] && otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length > 0) {
					otherValues[DELETED_STATE].forEach(function (relationship) {
						store.deleteRelationship(relationship);
					});

					if (sideWithClientOnConflict) {
						store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
					} else {
						store.deleteRelationship(theseValues[CLIENT_STATE]);
						store.deleteRelationship(otherValues[CLIENT_STATE]);
						store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
					}

					return;
				}
			}

			if (!theseValues[SERVER_STATE] && !theseValues[CLIENT_STATE] && theseValues[DELETED_STATE].length > 0) {
				if (!otherValues[SERVER_STATE] && !otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length <= 0) {
					theseValues[DELETED_STATE].forEach(function (relationship) {
						store.deleteRelationship(relationship);
					});

					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
					return;
				}

				if (otherValues[SERVER_STATE] && !otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length <= 0) {
					theseValues[DELETED_STATE].forEach(function (relationship) {
						store.deleteRelationship(relationship);
					});

					store.deleteRelationship(otherValues[SERVER_STATE]);
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
					return;
				}

				if (!otherValues[SERVER_STATE] && otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length <= 0) {
					theseValues[DELETED_STATE].forEach(function (relationship) {
						store.deleteRelationship(relationship);
					});

					if (sideWithClientOnConflict) {
						store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
					} else {
						store.deleteRelationship(otherValues[CLIENT_STATE]);
						store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
					}

					return;
				}

				if (!otherValues[SERVER_STATE] && !otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length > 0) {
					handled = null;

					theseValues[DELETED_STATE].forEach(function (relationship) {
						if (relationship.otherType(this) === value.type && relationship.otherId(this) === value.id) {
							if (sideWithClientOnConflict) {
								// NOOP
							} else {
									store.changeRelationshipState(relationship, SERVER_STATE);
								}

							handled = relationship;
						} else {
							store.deleteRelationship(relationship);
						}
					}, this);

					theseValues[DELETED_STATE].forEach(function (relationship) {
						if (relationship !== handled) {
							store.deleteRelationship(relationship);
						}
					});

					if (handled === null) {
						store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
					}

					return;
				}

				if (!otherValues[SERVER_STATE] && otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length > 0) {
					handled = null;

					theseValues[DELETED_STATE].forEach(function (relationship) {
						if (relationship.otherType(this) === value.type && relationship.otherId(this) === value.id) {
							if (sideWithClientOnConflict) {
								// NOOP
							} else {
									store.deleteRelationship(otherValues[CLIENT_STATE]);
									store.changeRelationshipState(relationship, SERVER_STATE);
								}

							handled = relationship;
						} else {
							store.deleteRelationship(relationship);
						}
					}, this);

					theseValues[DELETED_STATE].forEach(function (relationship) {
						if (relationship !== handled) {
							store.deleteRelationship(relationship);
						}
					});

					if (handled === null) {
						if (sideWithClientOnConflict) {
							store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
						} else {
							store.deleteRelationship(otherValues[CLIENT_STATE]);
							store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
						}
					}

					return;
				}
			}

			if (!theseValues[SERVER_STATE] && theseValues[CLIENT_STATE] && theseValues[DELETED_STATE].length > 0) {
				theseValues[DELETED_STATE].forEach(function (relationship) {
					store.deleteRelationship(relationship);
				});

				if (!otherValues[SERVER_STATE] && !otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length <= 0) {
					if (sideWithClientOnConflict) {
						store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
					} else {
						store.deleteRelationship(theseValues[CLIENT_STATE]);
						store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
					}

					return;
				}

				if (otherValues[SERVER_STATE] && !otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length <= 0) {
					store.deleteRelationship(otherValues[SERVER_STATE]);

					if (sideWithClientOnConflict) {
						store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
					} else {
						store.deleteRelationship(theseValues[CLIENT_STATE]);
						store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
					}

					return;
				}

				if (!otherValues[SERVER_STATE] && otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length <= 0) {
					if (sideWithClientOnConflict) {
						store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
					} else {
						store.deleteRelationship(theseValues[CLIENT_STATE]);
						store.deleteRelationship(otherValues[CLIENT_STATE]);
						store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
					}

					return;
				}

				if (!otherValues[SERVER_STATE] && !otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length > 0) {
					otherValues[DELETED_STATE].forEach(function (relationship) {
						store.deleteRelationship(relationship);
					});

					if (sideWithClientOnConflict) {
						store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
					} else {
						store.deleteRelationship(theseValues[CLIENT_STATE]);
						store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
					}

					return;
				}

				if (!otherValues[SERVER_STATE] && otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length > 0) {
					otherValues[DELETED_STATE].forEach(function (relationship) {
						store.deleteRelationship(relationship);
					});

					if (sideWithClientOnConflict) {
						store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
					} else {
						store.deleteRelationship(theseValues[CLIENT_STATE]);
						store.deleteRelationship(otherValues[CLIENT_STATE]);
						store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
					}

					return;
				}
			}
		},

		connectHasOneToHasMany: function (name, meta, value) {
			var thisType = this.typeKey;
			var thisId = this.get('id');
			var store = this.get('store');
			var relationships = store.sortHasOneRelationships(thisType, thisId, name);
			var sideWithClientOnConflict = store.get('sideWithClientOnConflict');

			// TODO: Make it right, then make it good
			if (relationships[SERVER_STATE] && relationships[SERVER_STATE].otherType(this) === value.type && relationships[SERVER_STATE].otherId(this) === value.id) {
				return;
			}

			if (relationships[CLIENT_STATE] && relationships[CLIENT_STATE].otherType(this) === value.type && relationships[CLIENT_STATE].otherId(this) === value.id) {
				store.changeRelationshipState(relationships[CLIENT_STATE], SERVER_STATE);

				if (relationships[DELETED_STATE].length > 0) {
					relationships[DELETED_STATE].forEach(store.deleteRelationship.bind(store));
				}

				return;
			}

			if (!relationships[SERVER_STATE] && !relationships[CLIENT_STATE] && relationships[DELETED_STATE].length <= 0) {
				store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				return;
			}

			if (relationships[SERVER_STATE] && !relationships[CLIENT_STATE] && relationships[DELETED_STATE].length <= 0) {
				store.deleteRelationship(relationships[SERVER_STATE]);
				store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				return;
			}

			if (!relationships[SERVER_STATE] && relationships[CLIENT_STATE] && relationships[DELETED_STATE].length <= 0) {
				if (sideWithClientOnConflict) {
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
				} else {
					store.deleteRelationship(relationships[CLIENT_STATE]);
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				}

				return;
			}

			var handled;

			if (!relationships[SERVER_STATE] && !relationships[CLIENT_STATE] && relationships[DELETED_STATE].length >= 0) {
				handled = false;

				relationships[DELETED_STATE].forEach(function (relationship) {
					if (relationship.otherType(this) === value.type && relationship.otherId(this) === value.id) {
						if (sideWithClientOnConflict) {
							// NOOP
						} else {
								store.changeRelationshipState(relationship, SERVER_STATE);
							}

						handled = true;
					} else {
						store.deleteRelationship(relationship);
					}
				}, this);

				if (!handled) {
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				}

				return;
			}

			if (!relationships[SERVER_STATE] && relationships[CLIENT_STATE] && relationships[DELETED_STATE].length >= 0) {
				handled = false;

				relationships[DELETED_STATE].forEach(function (relationship) {
					if (relationship.otherType(this) === value.type && relationship.otherId(this) === value.id) {
						if (sideWithClientOnConflict) {
							// NOOP
						} else {
								store.deleteRelationship(relationships[CLIENT_STATE]);
								store.changeRelationshipState(relationship, SERVER_STATE);
							}

						handled = true;
					} else {
						store.deleteRelationship(relationship);
					}
				}, this);

				if (!handled) {
					if (sideWithClientOnConflict) {
						store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
					} else {
						store.deleteRelationship(relationships[CLIENT_STATE]);
						store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
					}
				}

				return;
			}
		},

		connectHasManyToNull: _ember.default.aliasMethod('connectHasManyToHasMany'),

		connectHasManyToHasOne: function (name, meta, values) {
			var thisType = this.typeKey;
			var thisId = this.get('id');
			var store = this.get('store');
			var sideWithClientOnConflict = store.get('sideWithClientOnConflict');

			var valueMap = values.reduce(function (map, value) {
				map[value.type + ':' + value.id] = value;
				return map;
			}, {});

			var relationships = store.relationshipsForRecord(thisType, thisId, name);

			relationships.forEach(function (relationship) {
				var valueKey = relationship.otherType(this) + ':' + relationship.otherId(this);

				if (valueMap[valueKey]) {
					switch (relationship.get('state')) {
						case SERVER_STATE:
							// NOOP
							break;
						case DELETED_STATE:
							if (sideWithClientOnConflict) {
								// NOOP
							} else {
									store.changeRelationshipState(relationship, SERVER_STATE);
								}
							break;
						case CLIENT_STATE:
							store.changeRelationshipState(relationship, SERVER_STATE);
							break;
					}
				} else {
					switch (relationship.get('state')) {
						case SERVER_STATE:
						case DELETED_STATE:
							store.deleteRelationship(relationship);
							break;
						case CLIENT_STATE:
							if (sideWithClientOnConflict) {
								// NOOP
							} else {
									store.deleteRelationship(relationship);
								}
							break;
					}
				}

				delete valueMap[valueKey];
			}, this);

			// We've narrowed it down to relationships that have to be created from scratch. (Possibly with conflicts.)
			(0, _emberGraphUtilUtil.values)(valueMap, function (key, value) {
				var conflicts = store.sortHasOneRelationships(value.type, value.id, meta.inverse);

				if (!conflicts[SERVER_STATE] && !conflicts[CLIENT_STATE] && conflicts[DELETED_STATE].length <= 0) {
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
					return;
				}

				if (conflicts[SERVER_STATE] && !conflicts[CLIENT_STATE] && conflicts[DELETED_STATE].length <= 0) {
					store.deleteRelationship(conflicts[SERVER_STATE]);
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
					return;
				}

				if (!conflicts[SERVER_STATE] && conflicts[CLIENT_STATE] && conflicts[DELETED_STATE].length <= 0) {
					if (sideWithClientOnConflict) {
						store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
					} else {
						store.deleteRelationship(conflicts[CLIENT_STATE]);
						store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
					}
					return;
				}

				if (!conflicts[SERVER_STATE] && !conflicts[CLIENT_STATE] && conflicts[DELETED_STATE].length > 0) {
					conflicts[DELETED_STATE].forEach(function (relationship) {
						store.deleteRelationship(relationship);
					});

					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
					return;
				}

				if (!conflicts[SERVER_STATE] && conflicts[CLIENT_STATE] && conflicts[DELETED_STATE].length > 0) {
					conflicts[DELETED_STATE].forEach(function (relationship) {
						store.deleteRelationship(relationship);
					});

					if (sideWithClientOnConflict) {
						store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
					} else {
						store.deleteRelationship(conflicts[CLIENT_STATE]);
						store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
					}
					return;
				}
			}, this);
		},

		connectHasManyToHasMany: function (name, meta, values) {
			var thisType = this.typeKey;
			var thisId = this.get('id');
			var store = this.get('store');
			var sideWithClientOnConflict = store.get('sideWithClientOnConflict');

			var valueMap = values.reduce(function (map, value) {
				map[value.type + ':' + value.id] = value;
				return map;
			}, {});

			var relationships = store.relationshipsForRecord(thisType, thisId, name);

			relationships.forEach(function (relationship) {
				var valueKey = relationship.otherType(this) + ':' + relationship.otherId(this);

				if (valueMap[valueKey]) {
					switch (relationship.get('state')) {
						case SERVER_STATE:
							// NOOP
							break;
						case DELETED_STATE:
							if (sideWithClientOnConflict) {
								// NOOP
							} else {
									store.changeRelationshipState(relationship, SERVER_STATE);
								}
							break;
						case CLIENT_STATE:
							store.changeRelationshipState(relationship, SERVER_STATE);
							break;
					}
				} else {
					switch (relationship.get('state')) {
						case SERVER_STATE:
						case DELETED_STATE:
							store.deleteRelationship(relationship);
							break;
						case CLIENT_STATE:
							if (sideWithClientOnConflict) {
								// NOOP
							} else {
									store.deleteRelationship(relationship);
								}
							break;
					}
				}

				delete valueMap[valueKey];
			}, this);

			// We've narrowed it down to relationships that have to be created from scratch.
			(0, _emberGraphUtilUtil.values)(valueMap, function (key, value) {
				store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
			});
		}
	};
});

define('ember-graph/model/schema', ['exports', 'ember', 'ember-graph/model/model'], function (exports, _ember, _emberGraphModelModel) {

  /**
   * Declares an attribute on a model. The options determine the type and behavior
   * of the attributes. Bold options are required:
   *
   * - **`type`**: The type of the attribute. `string`, `boolean`, `number`, `date`, `array`
   * and `object` are the built in types. New types can be declared by extending `AttributeType`.
   * - `defaultValue`: The value that gets used if the attribute is missing from the loaded data.
   * This can be a function if the value needs to be computed or you need to return different
   * instances of an object each time.
   * If omitted, the attribute is required and will error if missing.
   * - `readOnly`: Set to `true` to make the attribute read-only (except for new records). Defaults to `false`.
   * - `isEqual`: Function that will compare two different instances of the attribute. Should take
   * two arguments and return `true` if the given attributes are equal. Defaults to the function
   * declared in the `AttributeType` subclass. **deprecated**
   * - `serverOnly`: This marks the attribute as a server-only attribute. This can be used when
   * an attribute is required for the model, but cannot be created on the client side. Ember-Graph
   * will allow the attribute to remain uninitialized until the record is persisted to the server.
   * This automatically makes the attribute read only.
   *
   * The option values are all available as property metadata, as well the `isAttribute` property
   * which is always `true`, and the `isRequired` property. However, the `defaultValue` property
   * should not be used directly; use the `getDefaultValue()` method instead.
   *
   * Like other Ember properties, `undefined` is _not_ a valid attribute value.
   *
   * As a shorthand, the `options` parameter may be a single string type. So this
   *
   * ```js
   * EmberGraph.attr({
   *     type: 'string'
   * })
   * ```
   *
   * can be turned into this
   *
   * ```js
   * EmberGraph.attr('string')
   * ```
   *
   * @method attr
   * @param {Object} options
   * @return {Object} Property descriptor used by model during initialization
   * @namespace EmberGraph
   */
  var attr = function (options) {
    var optionsObject = options;

    if (_ember.default.typeOf(optionsObject) === 'string') {
      optionsObject = { type: optionsObject };
    }

    _ember.default.deprecate('The `isEqual` method on attributes is deprecated. ' + 'Please use a custom attribute type instead.', !optionsObject.isEqual);

    return {
      isAttribute: true,
      options: optionsObject
    };
  };

  /**
   * Declares a *-to-many relationship on a model. The options determine
   * the type and behavior of the relationship. Bold options are required:
   *
   * - **`relatedType`**: The type of the related models.
   * - **`inverse`**: The relationship on the related models that reciprocates this relationship.
   * - `isRequired`: `false` if the relationship can be left out of the JSON. Defaults to `true`.
   * - `defaultValue`: The value that gets used if the relationship is missing from the loaded data.
   * The default is an empty array. This can be a function if the value needs to be computed or
   * you need to return different instances of an object each time.
   * - `readOnly`: Set to `true` to make the relationship read-only (except for new records). Defaults to `false`.
   * - `serverOnly`: This marks the relationship as a server-only relationship. This can be used when
   * a relationship is required for the model, but cannot be created on the client side. Ember-Graph
   * will allow the relationship to remain uninitialized until the record is persisted to the server.
   * This automatically makes the relationship read only.
   *
   * The option values are all available as property metadata, as well the `isRelationship` property
   * which is always `true`, and the `kind` property which is always `hasMany`. However, the
   * `defaultValue` property should not be used directly; use the `getDefaultValue()` method instead.
   *
   * @method hasMany
   * @param {Object} options
   * @return {Object} Property descriptor used by model during initialization
   * @namespace EmberGraph
   */
  var hasMany = function (options) {
    return {
      isRelationship: true,
      kind: _emberGraphModelModel.default.HAS_MANY_KEY,
      options: options
    };
  };

  /**
   * Declares a *-to-one relationship on a model. The options determine
   * the type and behavior of the relationship. Bold options are required:
   *
   * - **`relatedType`**: The type of the related models.
   * - **`inverse`**: The relationship on the related model that reciprocates this relationship.
   * - `isRequired`: `false` if the relationship can be left out of the JSON. Defaults to `true`.
   * - `defaultValue`: The value that gets used if the relationship is missing from the loaded data.
   * The default is `null`. This can be a function if the value needs to be computed or you need
   * to return different instances of an object each time.
   * - `readOnly`: Set to `true` to make the relationship read-only (except for new records). Defaults to `false`.
   * - `serverOnly`: This marks the relationship as a server-only relationship. This can be used when
   * a relationship is required for the model, but cannot be created on the client side. Ember-Graph
   * will allow the relationship to remain uninitialized until the record is persisted to the server.
   * This automatically makes the relationship read only.
   *
   * The option values are all available as property metadata, as well the `isRelationship` property
   * which is always `true`, and the `kind` property which is always `hasOne`. However, the
   * `defaultValue` property should not be used directly; use the `getDefaultValue()` method instead.
   *
   * @method hasOne
   * @param {Object} options
   * @return {Object} Property descriptor used by model during initialization
   * @namespace EmberGraph
   */
  var hasOne = function (options) {
    return {
      isRelationship: true,
      kind: _emberGraphModelModel.default.HAS_ONE_KEY,
      options: options
    };
  };

  exports.attr = attr;
  exports.hasMany = hasMany;
  exports.hasOne = hasOne;
});

define('ember-graph/model/states', ['exports', 'ember', 'ember-graph/util/computed', 'ember-graph/util/string'], function (exports, _ember, _emberGraphUtilComputed, _emberGraphUtilString) {
	exports.default = {

		/**
   * Denotes that the record is currently being deleted, but the server hasn't responded yet.
   *
   * @property isDeleting
   * @type Boolean
   * @final
   * @for Model
   */
		isDeleting: false,

		/**
   * Denotes that a record has been deleted and the change persisted to the server.
   *
   * @property isDeleted
   * @type Boolean
   * @final
   * @for Model
   */
		isDeleted: false,

		/**
   * Denotes that the record is currently saving its changes to the server, but the server hasn't responded yet.
   * (This doesn't overlap with `isCreating` at all. This is only true on subsequent saves.)
   *
   * @property isSaving
   * @type Boolean
   * @final
   * @for Model
   */
		isSaving: false,

		/**
   * Denotes that the record is being reloaded from the server, but the server hasn't responded yet.
   *
   * @property isReloading
   * @type Boolean
   * @final
   * @for Model
   */
		isReloading: false,

		/**
   * Denotes that a record has been loaded into a store and isn't freestanding.
   *
   * @property isLoaded
   * @type Boolean
   * @final
   * @for Model
   */
		isLoaded: (0, _emberGraphUtilComputed.computed)('store', {
			get: function () {
				return this.get('store') !== null;
			}
		}),

		/**
   * Denotes that the record has attribute or relationship changes that have not been saved to the server yet.
   * Note: A new record is always dirty.
   *
   * @property isDirty
   * @type Boolean
   * @final
   * @for Model
   */
		isDirty: _ember.default.computed.or('areAttributesDirty', 'areRelationshipsDirty', 'isNew'),

		/**
   * Denotes that the record is currently being saved to the server for the first time,
   * and the server hasn't responded yet.
   *
   * @property isCreating
   * @type Boolean
   * @final
   * @for Model
   */
		isCreating: false,

		/**
   * Denotes that a record has just been created and has not been saved to
   * the server yet. Most likely has a temporary ID if this is true.
   *
   * @property isNew
   * @type Boolean
   * @final
   * @for Model
   */
		isNew: (0, _emberGraphUtilComputed.computed)('_id', {
			get: function () {
				return (0, _emberGraphUtilString.startsWith)(this.get('_id'), this.constructor.temporaryIdPrefix);
			}
		}),

		/**
   * Denotes that the record is currently waiting for the server to respond to an operation.
   *
   * @property isInTransit
   * @type Boolean
   * @final
   * @for Model
   */
		isInTransit: _ember.default.computed.or('isSaving', 'isDeleting', 'isCreating', 'isReloading')
	};
});

define('ember-graph/relationship/relationship', ['exports', 'ember', 'ember-graph/util/util', 'ember-graph/constants', 'ember-graph/util/computed'], function (exports, _ember, _emberGraphUtilUtil, _emberGraphConstants, _emberGraphUtilComputed) {

	var CLIENT_STATE = _emberGraphConstants.RelationshipStates.CLIENT_STATE;
	var SERVER_STATE = _emberGraphConstants.RelationshipStates.SERVER_STATE;
	var DELETED_STATE = _emberGraphConstants.RelationshipStates.DELETED_STATE;

	var Relationship = _ember.default.Object.extend({

		_state: CLIENT_STATE,
		state: (0, _emberGraphUtilComputed.computed)('_state', {
			get: function () {
				return this.get('_state');
			},
			set: function (key, value) {
				switch (value) {
					case CLIENT_STATE:
					case SERVER_STATE:
					case DELETED_STATE:
						this.set('_state', value);
						break;
					default:
						_ember.default.assert('Invalid relationship state: ' + value);
						break;
				}
			}
		}),

		id: null,

		type1: null,

		id1: null,

		relationship1: null,

		type2: null,

		id2: null,

		relationship2: null,

		isConnectedTo: function (record) {
			if (this.get('type1') === record.typeKey && this.get('id1') === record.get('id')) {
				return true;
			}

			if (this.get('type2') === record.typeKey && this.get('id2') === record.get('id')) {
				return true;
			}

			return false;
		},

		matchesOneSide: function (type, id, name) {
			if (this.get('type1') === type && this.get('id1') === id && this.get('relationship1') === name) {
				return true;
			}

			if (this.get('type2') === type && this.get('id2') === id && this.get('relationship2') === name) {
				return true;
			}

			return false;
		},

		otherType: function (record) {
			// If they have the same type, it won't matter which branch is taken
			if (this.get('type1') === record.typeKey) {
				return this.get('type2');
			} else {
				return this.get('type1');
			}
		},

		otherId: function (record) {
			// If they have the same IDs, it won't matter which branch is taken
			if (this.get('id1') === record.get('id')) {
				return this.get('id2');
			} else {
				return this.get('id1');
			}
		},

		otherName: function (record) {
			if (this.get('id1') === record.get('id') && this.get('type1') === record.typeKey) {
				return this.get('relationship2');
			} else {
				return this.get('relationship1');
			}
		},

		thisName: function (record) {
			if (this.get('id1') === record.get('id') && this.get('type1') === record.typeKey) {
				return this.get('relationship1');
			} else {
				return this.get('relationship2');
			}
		},

		changeId: function (typeKey, oldId, newId) {
			if (this.get('type1') === typeKey && this.get('id1') === oldId) {
				this.set('id1', newId);
			} else if (this.get('type2') === typeKey && this.get('id2') === oldId) {
				this.set('id2', newId);
			}
		},

		erase: function () {
			this.setProperties({
				id: null,
				type1: null,
				id1: null,
				relationship1: null,
				type2: null,
				id2: null,
				relationship2: null,
				_state: null
			});
		}
	});

	Relationship.reopenClass({
		// TODO: NEW_STATE, SAVED_STATE, DELETED_STATE
		CLIENT_STATE: CLIENT_STATE,
		SERVER_STATE: SERVER_STATE,
		DELETED_STATE: DELETED_STATE,

		create: function (type1, id1, relationship1, type2, id2, relationship2, state) {
			_ember.default.assert('Invalid type or ID', type1 && id1 && type2 && id2);
			_ember.default.assert('First relationship must have a name', relationship1);
			_ember.default.assert('Second relationship must have a name or be null', relationship2 === null || _ember.default.typeOf(relationship2) === 'string');
			_ember.default.assert('Invalid state', state === CLIENT_STATE || state === SERVER_STATE || state === DELETED_STATE);

			var id = (0, _emberGraphUtilUtil.generateUUID)();
			return this._super({ id: id, type1: type1, id1: id1, relationship1: relationship1, type2: type2, id2: id2, relationship2: relationship2, state: state });
		}
	});

	exports.default = Relationship;
});

define('ember-graph/relationship/relationship_store', ['exports', 'ember', 'ember-graph/relationship/relationship', 'ember-graph/util/set'], function (exports, _ember, _emberGraphRelationshipRelationship, _emberGraphUtilSet) {

	var CLIENT_STATE = _emberGraphRelationshipRelationship.default.CLIENT_STATE;
	var SERVER_STATE = _emberGraphRelationshipRelationship.default.SERVER_STATE;
	var DELETED_STATE = _emberGraphRelationshipRelationship.default.DELETED_STATE;

	var STATE_MAP = {};
	STATE_MAP[CLIENT_STATE] = 'client';
	STATE_MAP[SERVER_STATE] = 'server';
	STATE_MAP[DELETED_STATE] = 'deleted';

	var RelationshipMap = _ember.default.Object.extend({

		length: 0,

		addRelationship: function (name, relationship) {
			if (this.hasOwnProperty(name)) {
				this.set(name + '.' + relationship.get('id'), relationship);
				this.notifyPropertyChange(name);
			} else {
				var o = _ember.default.Object.create();
				o.set(relationship.get('id'), relationship);
				this.set(name, o);
			}

			this.incrementProperty('length');
		},

		removeRelationship: function (id) {
			Object.keys(this).forEach(function (key) {
				if (key === 'length') {
					return;
				}

				var o = this.get(key);
				if (typeof o === 'object' && o.hasOwnProperty(id)) {
					delete o[id];
					this.notifyPropertyChange(key);
					this.decrementProperty('length');
				}
			}, this);
		},

		getRelationships: function (name) {
			var relationships = this.get(name) || {};

			return Object.keys(relationships).map(function (key) {
				return relationships[key];
			});
		},

		getAllRelationships: function () {
			var relationships = [];
			var keys = _emberGraphUtilSet.default.create();
			keys.addObjects(Object.keys(this));
			keys = keys.without('length');

			keys.forEach(function (key) {
				relationships = relationships.concat(this.getRelationships(key));
			}, this);

			return relationships;
		},

		clearRelationships: function (name) {
			this.set(name, _ember.default.Object.create());
			this.recalculateLength();
		},

		recalculateLength: function () {
			var length = 0;

			Object.keys(this).forEach(function (key) {
				if (key !== 'length') {
					length += Object.keys(this[key]).length;
				}
			}, this);

			this.set('length', length);
		}

	});

	exports.default = _ember.default.Object.extend({

		server: null,

		client: null,

		deleted: null,

		initializeMaps: _ember.default.on('init', function () {
			this.setProperties({
				server: RelationshipMap.create(),
				client: RelationshipMap.create(),
				deleted: RelationshipMap.create()
			});
		}),

		addRelationship: function (name, relationship) {
			if (name === null) {
				return;
			}

			return this.get(STATE_MAP[relationship.get('state')]).addRelationship(name, relationship);
		},

		removeRelationship: function (id) {
			if (_ember.default.typeOf(id) !== 'string') {
				id = _ember.default.get(id, 'id'); // eslint-disable-line no-param-reassign
			}

			this.get('server').removeRelationship(id);
			this.get('client').removeRelationship(id);
			this.get('deleted').removeRelationship(id);
		},

		clearRelationships: function (name) {
			this.get('server').clearRelationships(name);
			this.get('client').clearRelationships(name);
			this.get('deleted').clearRelationships(name);
		},

		getServerRelationships: function (name) {
			return this.get('server').getRelationships(name).concat(this.get('deleted').getRelationships(name));
		},

		getCurrentRelationships: function (name) {
			return this.get('server').getRelationships(name).concat(this.get('client').getRelationships(name));
		},

		getRelationshipsByState: function (state) {
			return this.get(STATE_MAP[state]).getAllRelationships();
		},

		getRelationshipsByName: function (name) {
			var server = this.get('server').getRelationships(name);
			var client = this.get('client').getRelationships(name);
			var deleted = this.get('deleted').getRelationships(name);

			return server.concat(client).concat(deleted);
		}
	});
});

define('ember-graph/serializer/ember_graph', ['exports', 'ember-graph/serializer/json'], function (exports, _emberGraphSerializerJson) {

  /**
   * @class EmberGraphSerializer
   * @extends JSONSerializer
   */
  exports.default = _emberGraphSerializerJson.default.extend({
    polymorphicRelationships: true
  });
});

define('ember-graph/serializer/json', ['exports', 'ember', 'ember-graph/model/model', 'ember-graph/serializer/serializer', 'ember-graph/util/set', 'ember-graph/util/array', 'ember-graph/util/inflector'], function (exports, _ember, _emberGraphModelModel, _emberGraphSerializerSerializer, _emberGraphUtilSet, _emberGraphUtilArray, _emberGraphUtilInflector) {

	/**
  * This serializer was designed to be compatible with the
  * {{link-to 'JSON API' 'http://jsonapi.org'}}
  * (the ID format, not the URL format).
  *
  * @class JSONSerializer
  * @extends Serializer
  * @constructor
  */
	exports.default = _emberGraphSerializerSerializer.default.extend({

		/**
   * This property can be overridden if you're using polymorphic relationships
   * in your models. Instead of strings for IDs, the serializer will use objects
   * for IDs. Each object will contain a `type` and `id` property.
   *
   * @property polymorphicRelationships
   * @type Boolean
   * @default false
   * @private
   */
		polymorphicRelationships: false,

		serialize: function (record, options) {
			switch (options.requestType) {
				case 'updateRecord':
					return this.serializeDelta(record, options);
				case 'createRecord':
					var json = {};
					json[(0, _emberGraphUtilInflector.pluralize)(record.typeKey)] = [this.serializeRecord(record, options)];
					return json;
				default:
					throw new _ember.default.Error('Invalid request type for JSON serializer.');
			}
		},

		/**
   * Converts a single record to its JSON representation.
   *
   * @method serializeRecord
   * @param {Model} record
   * @param {Object} options
   * @return {JSON} The JSON representation of the record
   */
		serializeRecord: function (record, options) {
			var json = {
				links: {}
			};

			record.constructor.eachAttribute(function (name, meta) {
				var serialized = this.serializeAttribute(record, name, options);
				if (serialized) {
					json[serialized.name] = serialized.value;
				}
			}, this);

			record.constructor.eachRelationship(function (name, meta) {
				var serialized = this.serializeRelationship(record, name, options);
				if (serialized) {
					json.links[serialized.name] = serialized.value;
				}
			}, this);

			return json;
		},

		/**
   * Serializes a single attribute for a record. This function
   * determines how the value is serialized and what the
   * serialized name will be. To remove the attribute
   * from serialization, return `null` from this function. To
   * keep the attribute, return an object like the one below:
   *
   * ```js
   * {
   *     name: "serialized_name",
   *     value: "serialized_value"
   * }
   * ```
   *
   * By default, this function will keep the name of the
   * attribute and serialize the value using the corresponding
   * {{#link-to-class 'AttributeType'}}AttributeType{{/link-to-class}}.
   *
   * @method serializeAttribute
   * @param {Model} record
   * @param {String} name The name of the attribute to serialize
   * @param {Object} options
   * @return {Object}
   * @protected
   */
		serializeAttribute: function (record, name, options) {
			var meta = record.constructor.metaForAttribute(name);
			var type = this.get('store').attributeTypeFor(meta.type);

			if (meta.isServerOnly && options.requestType === 'createRecord') {
				return null;
			}

			return { name: name, value: type.serialize(record.get(name)) };
		},

		/**
   * Serializes a single relationship for a record. This function
   * determines how the value is serialized and what the
   * serialized name will be. To remove the relationship
   * from serialization, return `null` from this function. To
   * keep the relationship, return an object like the one below:
   *
   * ```js
   * {
   *     name: "serialized_name",
   *     value: "serialized_value"
   * }
   * ```
   *
   * By default, this function will keep the name of the
   * relationship. For hasOne relationships, it will
   * use either a single string ID or `null`. For hasMany
   * relationships, it will use an array of string IDs.
   *
   * @method serializeRelationship
   * @param {Model} record
   * @param {String} name The name of the relationship to serialize
   * @param {Object} options
   * @return {Object}
   * @protected
   */
		serializeRelationship: function (record, name, options) {
			var meta = record.constructor.metaForRelationship(name);
			var value = record.get('_' + name);

			if (meta.isServerOnly && options.requestType === 'createRecord') {
				return null;
			}

			if (meta.kind === _emberGraphModelModel.default.HAS_ONE_KEY) {
				if (value === null || _emberGraphModelModel.default.isTemporaryId(value.id)) {
					return { name: name, value: null };
				}

				return {
					name: name,
					value: this.get('polymorphicRelationships') ? value : value.id
				};
			} else {
				value = value.filter(function (v) {
					return !_emberGraphModelModel.default.isTemporaryId(v.id);
				});

				return {
					name: name,
					value: this.get('polymorphicRelationships') ? value : _emberGraphUtilArray.mapBy.call(value, 'id')
				};
			}
		},

		/**
   * Serializes a record's changes to a list of change operations
   * that can be used in a JSON API `PATCH` request. The format
   * follows the specification except for one minor detail. At the
   * time of writing this, the `path` in a change operation must
   * be fully qualified, but there is a change upcoming to fix
   * that. This uses the soon-to-be format. So instead of this:
   *
   * ```json
   * PATCH /photos/1
   *
   * [
   *     { "op": "remove", "path": "/photos/1/links/comments/5" }
   * ]
   * ```
   *
   * It uses this:
   *
   * ```json
   * PATCH /photos/1
   *
   * [
   *     { "op": "remove", "path": "/links/comments/5" }
   * ]
   * ```
   *
   * Everything else remains the same. It will use the `replace`
   * operation for attributes and hasOne relationships, and the
   * `add` and `remove` operations for hasMany relationships.
   *
   * @method serializeDelta
   * @param {Model} record
   * @param {Object} options
   * @return {JSON} Array of change operations
   */
		serializeDelta: function (record, options) {
			var operations = this.serializeAttributeDelta(record, options);
			return operations.concat(this.serializeRelationshipDelta(record, options));
		},

		/**
   * Serializes a record's attributes changes to operation objects.
   *
   * @method serializeAttributeDelta
   * @param {Model} record
   * @param {Object} options
   * @return {JSON} Array of change operations
   * @protected
   */
		serializeAttributeDelta: function (record, options) {
			var changes = record.changedAttributes();
			var store = this.get('store');

			return Object.keys(changes).map(function (attributeName) {
				var meta = record.constructor.metaForAttribute(attributeName);
				var type = store.attributeTypeFor(meta.type);
				var value = type.serialize(changes[attributeName][1]);

				return { op: 'replace', path: '/' + attributeName, value: value };
			});
		},

		/**
   * Serializes a record's relationship changes to operation objects.
   *
   * @method serializeRelationshipDelta
   * @param {Model} record
   * @param {Object} options
   * @return {JSON} Array of change operations
   * @protected
   */
		serializeRelationshipDelta: function (record, options) {
			var operations = [];
			var changes = record.changedRelationships();
			var polymorphicRelationships = this.get('polymorphicRelationships');

			Object.keys(changes).forEach(function (relationshipName) {
				var values = changes[relationshipName];
				var meta = record.constructor.metaForRelationship(relationshipName);

				if (meta.kind === _emberGraphModelModel.default.HAS_ONE_KEY) {
					operations.push({
						op: 'replace',
						path: '/links/' + relationshipName,
						value: polymorphicRelationships ? values[1] : values[1] === null ? null : values[1].id
					});
				} else if (meta.kind === _emberGraphModelModel.default.HAS_MANY_KEY) {
					var originalSet = _emberGraphUtilSet.default.create();
					originalSet.addObjects(values[0].map(function (value) {
						return value.type + ':' + value.id;
					}));

					var currentSet = _emberGraphUtilSet.default.create();
					currentSet.addObjects(values[1].map(function (value) {
						return value.type + ':' + value.id;
					}));

					values[1].forEach(function (value) {
						if (!originalSet.contains(value.type + ':' + value.id) && !_emberGraphModelModel.default.isTemporaryId(value.id)) {
							operations.push({
								op: 'add',
								path: '/links/' + relationshipName,
								value: polymorphicRelationships ? value : value.id
							});
						}
					});

					values[0].forEach(function (value) {
						if (!currentSet.contains(value.type + ':' + value.id) && !_emberGraphModelModel.default.isTemporaryId(value.id)) {
							operations.push({
								op: 'remove',
								path: '/links/' + relationshipName + '/' + value.id,
								value: polymorphicRelationships ? value : value.id
							});
						}
					});
				}
			});

			return operations;
		},

		deserialize: function (payload, options) {
			var store = this.get('store');
			var normalized = this.transformPayload(payload || {}, options || {});

			Object.keys(normalized).forEach(function (typeKey) {
				if (typeKey === 'meta') {
					return;
				}

				var model = store.modelFor(typeKey);

				normalized[typeKey] = normalized[typeKey].map(function (json) {
					return this.deserializeRecord(model, json, options);
				}, this);
			}, this);

			return normalized;
		},

		/**
   * Converts a payload partially to normalized JSON.
   * The layout is the same, but the individual records
   * themselves have yet to be deserialized.
   *
   * @method transformPayload
   * @param {JSON} payload
   * @param {Object} options
   * @return {Object} Normalized JSON payload
   * @protected
   */
		transformPayload: function (payload, options) {
			if (!payload || Object.keys(payload).length === 0) {
				return {};
			}

			payload = _ember.default.copy(payload, true);

			var normalized = {
				meta: {
					serverMeta: payload.meta || {}
				}
			};

			delete payload.meta;

			// TODO: Query multiple types
			if (options.requestType === 'findQuery') {
				normalized.meta.matchedRecords = payload[(0, _emberGraphUtilInflector.pluralize)(options.recordType)].map(function (record) {
					return { type: options.recordType, id: record.id + '' };
				});
			} else if (options.requestType === 'createRecord') {
				normalized.meta.createdRecord = {
					type: options.recordType,
					id: payload[(0, _emberGraphUtilInflector.pluralize)(options.recordType)][0].id + ''
				};
			}

			Object.keys(payload).forEach(function (key) {
				if (key !== 'linked' && key !== 'meta') {
					normalized[(0, _emberGraphUtilInflector.singularize)(key)] = payload[key];
					delete payload[key];
				}
			});

			Object.keys(payload.linked || {}).forEach(function (key) {
				var singular = (0, _emberGraphUtilInflector.singularize)(key);
				normalized[singular] = (normalized[singular] || []).concat(payload.linked[key] || []);
			});

			return normalized;
		},

		/**
   * Converts a single record from its JSON representation
   * to the Javascript representation that the store expects.
   *
   * @method deserializeRecord
   * @param {Model} model
   * @param {JSON} json
   * @param {Object} options
   * @return {Object} Deserialized record
   * @protected
   */
		deserializeRecord: function (model, json, options) {
			if (_ember.default.typeOf(json.id) !== 'string' && _ember.default.typeOf(json.id) !== 'number') {
				throw new _ember.default.Error('Your JSON has an invalid ID: ' + JSON.stringify(json));
			}

			var record = {
				id: json.id + ''
			};

			model.eachAttribute(function (name, meta) {
				var deserialized = this.deserializeAttribute(model, json, name, options);
				if (deserialized) {
					record[deserialized.name] = deserialized.value;
				}
			}, this);

			json.links = json.links || {};

			model.eachRelationship(function (name, meta) {
				var deserialized = this.deserializeRelationship(model, json, name, options);
				if (deserialized) {
					record[deserialized.name] = deserialized.value;
				}
			}, this);

			return record;
		},

		/**
   * Deserializes a single attribute for a record. This function
   * determines how the value is deserialized and what the
   * deserialized name will be. To remove the attribute
   * from deserialization, return `null` from this function. To
   * keep the attribute, return an object like the one below:
   *
   * ```js
   * {
   *     name: "deserialized_name",
   *     value: "deserialized_value"
   * }
   * ```
   *
   * By default, this function keeps the original name and
   * serializes the value using the corresponding
   * {{#link-to-class 'AttributeType'}}AttributeType{{/link-to-class}}.
   * If the value is missing, it attempts to use the default
   * value. If it's missing and required, it has to throw an
   * error.
   *
   * @method deserializeAttribute
   * @param {Class} model
   * @param {JSON} json
   * @param {String} name
   * @param {Object} options
   * @return {Object}
   * @protected
   */
		deserializeAttribute: function (model, json, name, options) {
			var meta = model.metaForAttribute(name);
			var type = this.get('store').attributeTypeFor(meta.type);
			var value = json[name];

			if (value === undefined) {
				if (meta.isRequired) {
					var error = { id: json.id, typeKey: model.typeKey, name: name };
					throw new _ember.default.Error('Attribute was missing: ' + JSON.stringify(error));
				}

				return {
					name: name,
					value: meta.getDefaultValue() === undefined ? type.get('defaultValue') : meta.getDefaultValue()
				};
			} else {
				return { name: name, value: type.deserialize(value) };
			}
		},

		/**
   * Deserializes a single relationship for a record. This function
   * determines how the value is deserialized and what the
   * deserialized name will be. To remove the relationship
   * from deserialization, return `null` from this function. To
   * keep the relationship, return an object like the one below:
   *
   * ```js
   * {
   *     name: "deserialized_name",
   *     value: "deserialized_value"
   * }
   * ```
   *
   * By default, this function keeps the original name. HasOne
   * relationships are expected to be either `null`, or a number
   * or string. Numbers are converted to strings for the store.
   * HasMany relationships are expected to be an array of
   * numbers or strings. If any relationship is missing or invalid,
   * the default value will be used. If it's missing or invalid
   * and required, an error will be thrown.
   *
   * @method deserializeRelationship
   * @param {Class} model
   * @param {JSON} json
   * @param {String} name
   * @param {Object} options
   * @return {Object}
   * @protected
   */
		deserializeRelationship: function (model, json, name, options) {
			var meta = model.metaForRelationship(name);
			var value = json.links[name];

			if (value === undefined) {
				if (meta.isRequired) {
					throw new _ember.default.Error('Missing `' + name + '` relationship: ' + JSON.stringify(json));
				}

				return { name: name, value: meta.getDefaultValue() };
			} else {
				if (meta.kind === _emberGraphModelModel.default.HAS_MANY_KEY) {
					return this.deserializeHasManyRelationship(model, name, value);
				} else {
					return this.deserializeHasOneRelationship(model, name, value);
				}
			}
		},

		/**
   * After {{link-to-method 'JSONSerializer' 'deserializeRelationship'}} has checked
   * for missing values, it delegates to this function to deserialize a single
   * hasOne relationship. Their return types are the same.
   *
   * @method deserializeHasOneRelationship
   * @param {Class} model
   * @param {String} name
   * @param {Object|String|Number} value
   * @param {Object} options
   * @returns {Object}
   * @protected
   */
		deserializeHasOneRelationship: function (model, name, value, options) {
			if (value === null) {
				return { name: name, value: null };
			}

			var polymorphic = this.get('polymorphicRelationships');

			return {
				name: name,
				value: {
					type: polymorphic ? value.type : model.metaForRelationship(name).relatedType,
					id: (polymorphic ? value.id : value) + ''
				}
			};
		},

		/**
   * After {{link-to-method 'JSONSerializer' 'deserializeRelationship'}} has checked
   * for missing values, it delegates to this function to deserialize a single
   * hasMany relationship. Their return types are the same.
   *
   * @method deserializeHasManyRelationship
   * @param {Class} model
   * @param {String} name
   * @param {Object[]|String[]|Number[]} values
   * @param {Object} options
   * @returns {Object}
   * @protected
   */
		deserializeHasManyRelationship: function (model, name, values, options) {
			var relatedType = model.metaForRelationship(name).relatedType;
			var polymorphic = this.get('polymorphicRelationships');

			var mapped = values.map(function (value) {
				return {
					type: polymorphic ? value.type : relatedType,
					id: (polymorphic ? value.id : value) + ''
				};
			});

			return { name: name, value: mapped };
		}
	});
});

define('ember-graph/serializer/serializer', ['exports', 'ember', 'ember-graph/util/util'], function (exports, _ember, _emberGraphUtilUtil) {

	/**
  * An interface for a serializer. A serializer is used to convert
  * objects back and forth between the JSON that the server uses,
  * and the records that are used on the client side.
  *
  * @class Serializer
  */
	exports.default = _ember.default.Object.extend({

		/**
   * The store that the records will be loaded into. This
   * property is injected by the container on startup.
   * This can be used for fetching models and their metadata.
   *
   * @property store
   * @type Store
   * @final
   */
		store: null,

		/**
   * Converts a record to a JSON payload that can be sent to
   * the server. The options object is a general object where any options
   * necessary can be passed in from the adapter. The built-in Ember-Graph
   * adapters pass in just one option: `requestType`. This lets the
   * serializer know what kind of request will made using the payload
   * returned from this call. The value of `requestType` will be one of
   * either `createRecord` or `updateRecord`. If you write a custom
   * adapter or serializer, you're free to pass in any other options
   * you may need.
   *
   * @method serialize
   * @param {Model} record The record to serialize
   * @param {Object} [options] Any options that were passed by the adapter
   * @return {JSON} JSON payload to send to server
   * @abstract
   */
		serialize: (0, _emberGraphUtilUtil.abstractMethod)('serialize'),

		/**
   * Takes a payload from the server and converts it into a normalized
   * JSON payload that the store can use. Details about the format
   * can be found in the {{link-to-method 'Store' 'pushPayload'}}
   * documentation.
   *
   * In addition to the format described by the store, the store
   * may require some additional information. This information should
   * be included in the `meta` object. The attributes required by the
   * store are:
   *
   * - `matchedRecords`: This is an array of objects (with `type` and
   *     `id` fields) that tell which records were matched on a query.
   *     This helps distinguish queried records from records of the
   *     same type that may have been side loaded. If this property
   *     doesn't exist, the adapter will assume that all objects
   *     of that type were returned by the query.
   * - `createdRecord`: This is a single object (with `type` and `id`)
   *     that tells the adapter which record was created as the result
   *     of a `createRecord` request. Again, this helps distinguish
   *     the record from other records of the same type.
   *
   * To determine whether those meta attributes are required or not, the
   * `requestType` option can be used. The built-in Ember-Graph adapters
   * will pass one of the following values: `findRecord`, `findMany`,
   * `findAll`, `findQuery`, `createRecord`, `updateRecord`, `deleteRecord`.
   * If the value is `findQuery`, then the `matchedRecords` meta attribute is
   * required. If the value is `createRecord`, then the `createdRecord` meta
   * attribute is required.
   *
   * In addition to `requestType`, the following options are available:
   *
   * - `recordType`: The type of record that the request was performed on
   * - `id`:  The ID of the record referred to by a `findRecord`,
   *     `updateRecord` or `deleteRecord` request
   * - `ids`: The IDs of the records requested by a `findMany` request
   * - `query`: The query submitted to the `findQuery` request
   *
   * @method deserialize
   * @param {JSON} payload
   * @param {Object} [options] Any options that were passed by the adapter
   * @return {Object} Normalized JSON payload
   * @abstract
   */
		deserialize: (0, _emberGraphUtilUtil.abstractMethod)('deserialize')
	});
});

define('ember-graph/shim', ['exports', 'ember-graph', 'ember-graph/util/data_adapter', 'ember-graph/util/array', 'ember-graph/util/util', 'ember-graph/model/schema', 'ember-graph/util/set', 'ember-graph/util/string', 'ember-graph/util/inflector', 'ember-graph/data/promise_object', 'ember-graph/serializer/serializer', 'ember-graph/serializer/json', 'ember-graph/serializer/ember_graph', 'ember-graph/adapter/adapter', 'ember-graph/adapter/ember_graph/adapter', 'ember-graph/adapter/local_storage', 'ember-graph/adapter/memory', 'ember-graph/adapter/rest', 'ember-graph/store/store', 'ember-graph/attribute_type/type', 'ember-graph/attribute_type/array', 'ember-graph/attribute_type/boolean', 'ember-graph/attribute_type/date', 'ember-graph/attribute_type/enum', 'ember-graph/attribute_type/number', 'ember-graph/attribute_type/object', 'ember-graph/attribute_type/string', 'ember-graph/model/model', 'ember-graph/relationship/relationship', 'ember-graph/relationship/relationship_store', 'ember-graph/store/record_cache', 'ember-graph/store/record_request_cache'], function (exports, _emberGraph, _emberGraphUtilData_adapter, _emberGraphUtilArray, _emberGraphUtilUtil, _emberGraphModelSchema, _emberGraphUtilSet, _emberGraphUtilString, _emberGraphUtilInflector, _emberGraphDataPromise_object, _emberGraphSerializerSerializer, _emberGraphSerializerJson, _emberGraphSerializerEmber_graph, _emberGraphAdapterAdapter, _emberGraphAdapterEmber_graphAdapter, _emberGraphAdapterLocal_storage, _emberGraphAdapterMemory, _emberGraphAdapterRest, _emberGraphStoreStore, _emberGraphAttribute_typeType, _emberGraphAttribute_typeArray, _emberGraphAttribute_typeBoolean, _emberGraphAttribute_typeDate, _emberGraphAttribute_typeEnum, _emberGraphAttribute_typeNumber, _emberGraphAttribute_typeObject, _emberGraphAttribute_typeString, _emberGraphModelModel, _emberGraphRelationshipRelationship, _emberGraphRelationshipRelationship_store, _emberGraphStoreRecord_cache, _emberGraphStoreRecord_request_cache) {
	_emberGraph.default.DataAdapter = _emberGraphUtilData_adapter.default;

	// Array polyfills

	_emberGraph.default.ArrayPolyfills = {
		some: _emberGraphUtilArray.some,
		reduce: _emberGraphUtilArray.reduce,
		mapBy: _emberGraphUtilArray.mapBy
	};

	// EmberGraph namespace methods

	_emberGraph.default.abstractMethod = _emberGraphUtilUtil.abstractMethod;
	_emberGraph.default.abstractProperty = _emberGraphUtilUtil.abstractProperty;
	_emberGraph.default.generateUUID = _emberGraphUtilUtil.generateUUID;
	_emberGraph.default.arrayContentsEqual = _emberGraphUtilUtil.arrayContentsEqual;
	_emberGraph.default.groupRecords = _emberGraphUtilUtil.groupRecords;
	_emberGraph.default.values = _emberGraphUtilUtil.values;
	_emberGraph.default.deprecateMethod = _emberGraphUtilUtil.deprecateMethod;
	_emberGraph.default.deprecateProperty = _emberGraphUtilUtil.deprecateProperty;

	_emberGraph.default.attr = _emberGraphModelSchema.attr;
	_emberGraph.default.hasOne = _emberGraphModelSchema.hasOne;
	_emberGraph.default.hasMany = _emberGraphModelSchema.hasMany;

	// Set

	_emberGraph.default.Set = _emberGraphUtilSet.default;

	// String polyfills

	_emberGraph.default.String = {
		startsWith: _emberGraphUtilString.startsWith,
		endsWith: _emberGraphUtilString.endsWith,
		capitalize: _emberGraphUtilString.capitalize,
		decapitalize: _emberGraphUtilString.decapitalize,
		pluralize: _emberGraphUtilInflector.pluralize,
		singularize: _emberGraphUtilInflector.singularize
	};

	// Promise proxy objects

	_emberGraph.default.PromiseObject = _emberGraphDataPromise_object.PromiseObject;
	_emberGraph.default.PromiseArray = _emberGraphDataPromise_object.PromiseArray;
	_emberGraph.default.ModelPromiseObject = _emberGraphDataPromise_object.ModelPromiseObject;

	// Serializers

	_emberGraph.default.Serializer = _emberGraphSerializerSerializer.default;

	_emberGraph.default.JSONSerializer = _emberGraphSerializerJson.default;

	_emberGraph.default.EmberGraphSerializer = _emberGraphSerializerEmber_graph.default;

	// Adapters

	_emberGraph.default.Adapter = _emberGraphAdapterAdapter.default;

	_emberGraph.default.EmberGraphAdapter = _emberGraphAdapterEmber_graphAdapter.default;

	_emberGraph.default.LocalStorageAdapter = _emberGraphAdapterLocal_storage.default;

	_emberGraph.default.MemoryAdapter = _emberGraphAdapterMemory.default;

	_emberGraph.default.RESTAdapter = _emberGraphAdapterRest.default;

	// Store

	_emberGraph.default.Store = _emberGraphStoreStore.default;

	// Attribute Types

	_emberGraph.default.AttributeType = _emberGraphAttribute_typeType.default;

	_emberGraph.default.ArrayType = _emberGraphAttribute_typeArray.default;

	_emberGraph.default.BooleanType = _emberGraphAttribute_typeBoolean.default;

	_emberGraph.default.DateType = _emberGraphAttribute_typeDate.default;

	_emberGraph.default.EnumType = _emberGraphAttribute_typeEnum.default;

	_emberGraph.default.NumberType = _emberGraphAttribute_typeNumber.default;

	_emberGraph.default.ObjectType = _emberGraphAttribute_typeObject.default;

	_emberGraph.default.StringType = _emberGraphAttribute_typeString.default;

	// Model

	_emberGraph.default.Model = _emberGraphModelModel.default;

	// Testing shims

	_emberGraph.default.Relationship = _emberGraphRelationshipRelationship.default;

	_emberGraph.default.RelationshipStore = _emberGraphRelationshipRelationship_store.default;

	_emberGraph.default.RecordCache = _emberGraphStoreRecord_cache.default;

	_emberGraph.default.RecordRequestCache = _emberGraphStoreRecord_request_cache.default;

	// Inflector

	_emberGraph.default.Inflector = { singularize: _emberGraphUtilInflector.singularize, pluralize: _emberGraphUtilInflector.pluralize, overridePluralRule: _emberGraphUtilInflector.overridePluralRule, overrideSingularRule: _emberGraphUtilInflector.overrideSingularRule };
});

// Data Adapter

define('ember-graph/store/lookup', ['exports', 'ember', 'ember-graph/util/util'], function (exports, _ember, _emberGraphUtilUtil) {
	exports.default = {

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
   * Stores attribute types as they're looked up in the container.
   * @property attributeTypeCache
   * @type {Object}
   * @final
   * @private
   */
		attributeTypeCache: {},

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
   * Stores serializers as they're looked up in the container.
   *
   * @property adapterCache
   * @type Object
   * @final
   * @private
   */
		serializerCache: {},

		initializeLookupCaches: _ember.default.on('init', function () {
			this.setProperties({
				modelCache: {},
				attributeTypeCache: {},
				adapterCache: {},
				serializerCache: {}
			});
		}),

		modelForType: (0, _emberGraphUtilUtil.deprecateMethod)('`modelForType` deprecated in favor of `modelFor`', 'modelFor'),

		/**
   * Looks up the model for the specified typeKey. The `typeKey` property
   * isn't available on the class or its instances until the type is
   * looked up with this method for the first time.
   *
   * @method modelFor
   * @param {String} typeKey
   * @return {Class}
   */
		modelFor: function (typeKey) {
			var modelCache = this.get('modelCache');

			if (!modelCache[typeKey]) {
				var model = this.get('container').lookupFactory('model:' + typeKey);
				if (!model) {
					throw new _ember.default.Error('Cannot find model class with typeKey: ' + typeKey);
				}

				model.reopen({ typeKey: typeKey });
				model.reopenClass({ typeKey: typeKey });
				modelCache[typeKey] = model;
			}

			return modelCache[typeKey];
		},

		/**
   * Returns an `AttributeType` instance for the given named type.
   *
   * @method attributeTypeFor
   * @param {String} typeName
   * @return {AttributeType}
   */
		attributeTypeFor: function (typeName) {
			var attributeTypeCache = this.get('attributeTypeCache');

			if (!attributeTypeCache[typeName]) {
				attributeTypeCache[typeName] = this.get('container').lookup('type:' + typeName);

				if (!attributeTypeCache[typeName]) {
					throw new _ember.default.Error('Cannot find attribute type with name: ' + typeName);
				}
			}

			return attributeTypeCache[typeName];
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
		adapterFor: function (typeKey) {
			var adapterCache = this.get('adapterCache');

			if (!adapterCache[typeKey]) {
				var container = this.get('container');

				adapterCache[typeKey] = container.lookup('adapter:' + typeKey) || container.lookup('adapter:application') || container.lookup('adapter:rest');
			}

			return adapterCache[typeKey];
		},

		/**
   * Gets the serializer for the specified type. First, it looks for a type-specific
   * serializer. If one isn't found, it looks for the application serializer. If that
   * isn't found, it uses the default {{link-to-class 'JSONSerializer'}}.
   *
   * Note that this method will cache the results, so your serializer configuration
   * must be finalized before the app starts up.
   *
   * @method serializerFor
   * @param {String} typeKey
   * @return {Serializer}
   * @protected
   */
		serializerFor: function (typeKey) {
			var serializerCache = this.get('serializerCache');

			if (!serializerCache[typeKey]) {
				var container = this.get('container');

				serializerCache[typeKey] = container.lookup('serializer:' + (typeKey || 'application')) || container.lookup('serializer:application') || container.lookup('serializer:json');
			}

			return serializerCache[typeKey];
		}

	};
});

define('ember-graph/store/record_cache', ['exports', 'ember', 'ember-graph/data/promise_object', 'ember-graph/util/computed'], function (exports, _ember, _emberGraphDataPromise_object, _emberGraphUtilComputed) {
	exports.default = _ember.default.Object.extend({

		cacheTimeout: (0, _emberGraphUtilComputed.computed)('_cacheTimeout', {
			get: function () {
				return this.get('_cacheTimeout');
			},
			set: function (key, value) {
				this.set('_cacheTimeout', typeof value === 'number' ? value : Infinity);
			}
		}),

		records: {},

		liveRecordArrays: {},

		init: function () {
			this.setProperties({
				_cacheTimeout: Infinity,
				records: {},
				liveRecordArrays: {}
			});
		},

		getRecord: function (typeKey, id) {
			var key = typeKey + ':' + id;
			var records = this.get('records');

			if (records[key] && records[key].timestamp >= new Date().getTime() - this.get('cacheTimeout')) {
				return records[key].record;
			}

			return null;
		},

		getRecords: function (typeKey) {
			var records = this.get('records');
			var found = [];
			var cutoff = new Date().getTime() - this.get('cacheTimeout');

			Object.keys(records).forEach(function (key) {
				if (key.indexOf(typeKey) === 0 && records[key].timestamp >= cutoff) {
					found.push(records[key].record);
				}
			});

			return found;
		},

		storeRecord: function (record) {
			if (_emberGraphDataPromise_object.PromiseObject.detectInstance(record)) {
				record = record.getModel();
			}

			var typeKey = record.get('typeKey');

			var records = this.get('records');
			records[typeKey + ':' + record.get('id')] = {
				record: record,
				timestamp: new Date().getTime()
			};

			var liveRecordArrays = this.get('liveRecordArrays');
			liveRecordArrays[typeKey] = liveRecordArrays[typeKey] || _ember.default.A();
			if (!liveRecordArrays[typeKey].contains(record)) {
				liveRecordArrays[typeKey].addObject(record);
			}
		},

		deleteRecord: function (typeKey, id) {
			var records = this.get('records');
			delete records[typeKey + ':' + id];
		},

		getLiveRecordArray: function (typeKey) {
			var liveRecordArrays = this.get('liveRecordArrays');
			liveRecordArrays[typeKey] = liveRecordArrays[typeKey] || _ember.default.A();
			return liveRecordArrays[typeKey];
		}

	});
});

define('ember-graph/store/record_request_cache', ['exports', 'ember'], function (exports, _ember) {
	exports.default = _ember.default.Object.extend({

		cache: null,

		initializeCache: (function () {
			this.set('cache', _ember.default.Object.create());
		}).on('init'),

		_getAndCreateTypeCache: function (typeKey) {
			if (!this.get('cache.' + typeKey)) {
				var cache = _ember.default.Object.create({
					all: null,
					single: {},
					multiple: {},
					query: {}
				});

				this.set('cache.' + typeKey, cache);
			}

			return this.get('cache.' + typeKey);
		},

		savePendingRequest: function (typeKey /* options, request */) {
			// eslint-disable-line no-inline-comments
			var options = arguments.length > 2 ? arguments[1] : undefined;
			var request = arguments.length > 2 ? arguments[2] : arguments[1];

			switch (_ember.default.typeOf(options)) {
				case 'string':
				case 'number':
					this._savePendingSingleRequest(typeKey, options + '', request);
					break;
				case 'array':
					this._savePendingManyRequest(typeKey, options.toArray(), request);
					break;
				case 'object':
					this._savePendingQueryRequest(typeKey, options, request);
					break;
				case 'undefined':
					this._savePendingAllRequest(typeKey, request);
					break;
			}
		},

		_savePendingSingleRequest: function (typeKey, id, request) {
			var cache = this._getAndCreateTypeCache(typeKey).get('single');

			cache[id] = request;

			var callback = function () {
				cache[id] = null;
			};

			request.then(callback, callback);
		},

		_savePendingManyRequest: function (typeKey, ids, request) {
			var cache = this._getAndCreateTypeCache(typeKey).get('multiple');
			var idString = ids.map(function (id) {
				return id + '';
			}).sort().join(',');

			cache[idString] = request;

			var callback = function () {
				cache[idString] = null;
			};

			request.then(callback, callback);
		},

		_savePendingQueryRequest: function (typeKey, query, request) {
			// TODO
		},

		_savePendingAllRequest: function (typeKey, request) {
			var cache = this._getAndCreateTypeCache(typeKey);

			cache.set('all', request);

			var callback = function () {
				cache.set('all', null);
			};

			request.then(callback, callback);
		},

		getPendingRequest: function (typeKey, options) {
			switch (_ember.default.typeOf(options)) {
				case 'string':
				case 'number':
					return this._getPendingSingleRequest(typeKey, options + '');
				case 'array':
					return this._getPendingManyRequest(typeKey, options.toArray());
				case 'object':
					return this._getPendingQueryRequest(typeKey, options);
				case 'undefined':
					return this._getPendingAllRequest(typeKey);
				default:
					return null;
			}
		},

		_getPendingSingleRequest: function (typeKey, id) {
			var cache = this._getAndCreateTypeCache(typeKey);

			var all = cache.get('all');
			if (all) {
				return all;
			}

			var single = cache.get('single')[id];
			if (single) {
				return single;
			}

			var multiple = cache.get('multiple');
			for (var key in multiple) {
				if (multiple.hasOwnProperty(key)) {
					if (key.split(',').indexOf(id) >= 0) {
						return multiple[key];
					}
				}
			}

			return null;
		},

		_getPendingManyRequest: function (typeKey, ids) {
			var cache = this._getAndCreateTypeCache(typeKey);

			var all = cache.get('all');
			if (all) {
				return all;
			}

			var idString = ids.map(function (id) {
				return id + '';
			}).sort().join(',');

			var multiple = cache.get('multiple');
			for (var key in multiple) {
				if (multiple.hasOwnProperty(key)) {
					if (key === idString) {
						return multiple[key];
					}
				}
			}

			return null;
		},

		_getPendingQueryRequest: function (typeKey, query) {
			// TODO
			return null;
		},

		_getPendingAllRequest: function (typeKey) {
			var cache = this._getAndCreateTypeCache(typeKey);
			return cache.get('all') || null;
		}

	});
});

define('ember-graph/store/relationship', ['exports', 'ember', 'ember-graph/relationship/relationship'], function (exports, _ember, _emberGraphRelationshipRelationship) {
	var CLIENT_STATE = _emberGraphRelationshipRelationship.default.CLIENT_STATE;
	var SERVER_STATE = _emberGraphRelationshipRelationship.default.SERVER_STATE;
	var DELETED_STATE = _emberGraphRelationshipRelationship.default.DELETED_STATE;
	exports.default = {

		allRelationships: _ember.default.Object.create(),

		queuedRelationships: _ember.default.Object.create(),

		initializeRelationships: _ember.default.on('init', function () {
			this.setProperties({
				allRelationships: _ember.default.Object.create(),
				queuedRelationships: _ember.default.Object.create()
			});
		}),

		createRelationship: function (type1, id1, name1, type2, id2, name2, state) {
			var relationship = _emberGraphRelationshipRelationship.default.create(type1, id1, name1, type2, id2, name2, state);

			var queuedRelationships = this.get('queuedRelationships');
			var record1 = this.getRecord(type1, id1);
			var record2 = this.getRecord(type2, id2);

			if (record1) {
				this.connectRelationshipTo(record1, relationship);
			}

			if (record2) {
				this.connectRelationshipTo(record2, relationship);
			}

			if (!record1 || !record2) {
				queuedRelationships[relationship.get('id')] = relationship;
				this.notifyPropertyChange('queuedRelationships');
			}

			this.get('allRelationships')[relationship.get('id')] = relationship;
		},

		deleteRelationship: function (relationship) {
			var record1 = this.getRecord(relationship.get('type1'), relationship.get('id1'));
			var record2 = this.getRecord(relationship.get('type2'), relationship.get('id2'));

			this.disconnectRelationshipFrom(record1, relationship);
			this.disconnectRelationshipFrom(record2, relationship);

			var queuedRelationships = this.get('queuedRelationships');
			delete queuedRelationships[relationship.get('id')];
			this.notifyPropertyChange('queuedRelationships');

			delete this.get('allRelationships')[relationship.get('id')];
			delete this.get('queuedRelationships')[relationship.get('id')];

			relationship.erase();
		},

		changeRelationshipState: function (relationship, newState) {
			if (relationship.get('state') === newState) {
				return;
			}

			var record1 = this.getRecord(relationship.get('type1'), relationship.get('id1'));
			var record2 = this.getRecord(relationship.get('type2'), relationship.get('id2'));

			this.disconnectRelationshipFrom(record1, relationship);
			this.disconnectRelationshipFrom(record2, relationship);

			relationship.set('state', newState);

			this.connectRelationshipTo(record1, relationship);
			this.connectRelationshipTo(record2, relationship);
		},

		connectQueuedRelationships: function (record) {
			var _this = this;

			var queuedRelationships = this.get('queuedRelationships');
			var filtered = Object.keys(queuedRelationships).filter(function (id) {
				return queuedRelationships[id].isConnectedTo(record);
			});

			if (filtered.length <= 0) {
				return;
			}

			filtered.forEach(function (id) {
				var relationship = queuedRelationships[id];
				_this.connectRelationshipTo(record, relationship);
				delete queuedRelationships[id];
			});

			this.notifyPropertyChange('queuedRelationships');
		},

		queueConnectedRelationships: function (record) {
			var _this2 = this;

			var queued = this.get('queuedRelationships');
			var server = record.get('relationships').getRelationshipsByState(SERVER_STATE);

			server.forEach(function (relationship) {
				_this2.disconnectRelationshipFrom(record, relationship);
				queued[relationship.get('id')] = relationship;
			});

			this.notifyPropertyChange('queuedRelationships');
		},

		relationshipsForRecord: function (type, id, name) {
			var filtered = [];
			var all = this.get('allRelationships');

			Object.keys(all).forEach(function (key) {
				if (all[key].matchesOneSide(type, id, name)) {
					filtered.push(all[key]);
				}
			});

			return filtered;
		},

		deleteRelationshipsForRecord: function (type, id) {
			var _this3 = this;

			_ember.default.changeProperties(function () {
				var all = _this3.get('allRelationships');
				var keys = Object.keys(all);

				keys.forEach(function (key) {
					var relationship = all[key];

					if (relationship.get('type1') === type && relationship.get('id1') === id) {
						_this3.deleteRelationship(relationship);
					} else if (relationship.get('type2') === type && relationship.get('id2') === id) {
						_this3.deleteRelationship(relationship);
					}
				});
			});
		},

		/**
   * @param {Model} record
   * @param {Relationship} relationship
   * @private
   */
		connectRelationshipTo: function (record, relationship) {
			if (!record) {
				return;
			}

			record.get('relationships').addRelationship(relationship.thisName(record), relationship);
		},

		/**
   * @param {Model} record
   * @param {Relationship} relationship
   * @private
   */
		disconnectRelationshipFrom: function (record, relationship) {
			if (!record) {
				return;
			}

			record.get('relationships').removeRelationship(relationship);
		},

		/**
   * Takes the relationships for a hasOne relationship, and sorts them in
   * an object that is easy to manipulate. The object returned contains
   * the following properties:
   *
   * - `[SERVER_STATE]` - A single relationship or `null`
   * - `[CLIENT_STATE]` - A single relationship or `null`
   * - `[DELETED_STATE]` - An array of relationships
   *
   * There are 5 valid configurations for a hasOne relationship at any
   * given time:
   *
   * 1. No relationships connected
   * 2. A single server relationship is connected
   * 3. A single client relationship is connected
   * 4. One or more delete relationships is connected
   * 5. A single client relationship, along with one or more deleted relationships
   *
   * This function will make assertions to ensure that the relationship
   * exists in one of these 5 states.
   *
   * @param {String} type
   * @param {String} id
   * @param {String} name
   * @returns {Object}
   */
		sortHasOneRelationships: function (type, id, name) {
			var values = {};
			var relationships = this.relationshipsForRecord(type, id, name);

			values[SERVER_STATE] = relationships.filter(function (relationship) {
				return relationship.get('state') === SERVER_STATE;
			})[0] || null;

			values[DELETED_STATE] = relationships.filter(function (relationship) {
				return relationship.get('state') === DELETED_STATE;
			});

			values[CLIENT_STATE] = relationships.filter(function (relationship) {
				return relationship.get('state') === CLIENT_STATE;
			})[0] || null;

			_ember.default.runInDebug(function () {
				/* eslint-disable */
				// No relationships at all
				if (!values[SERVER_STATE] && values[DELETED_STATE].length <= 0 && !values[CLIENT_STATE]) return;
				// One server relationship, nothing else
				if (values[SERVER_STATE] && values[DELETED_STATE].length <= 0 && !values[CLIENT_STATE]) return;
				// One client relationship, nothing else
				if (!values[SERVER_STATE] && values[DELETED_STATE].length <= 0 && values[CLIENT_STATE]) return;
				// One client relationship and some deleted relationships
				if (!values[SERVER_STATE] && values[DELETED_STATE].length > 0 && values[CLIENT_STATE]) return;
				// Some deleted relationships, nothing else
				if (!values[SERVER_STATE] && values[DELETED_STATE].length > 0 && !values[CLIENT_STATE]) return;
				/* eslint-enable */

				// Everything else is invalid
				_ember.default.assert('Invalid hasOne relationship values.');
			});

			return values;
		},

		updateRelationshipsWithNewId: function (typeKey, oldId, newId) {
			var all = this.get('allRelationships');

			Object.keys(all).forEach(function (id) {
				all[id].changeId(typeKey, oldId, newId);
			});

			this.notifyPropertyChange('allRelationships');
		}

	};
});

define('ember-graph/store/store', ['exports', 'ember', 'ember-graph/store/record_cache', 'ember-graph/store/record_request_cache', 'ember-graph/store/lookup', 'ember-graph/store/relationship', 'ember-graph/data/promise_object', 'ember-graph/util/util'], function (exports, _ember, _emberGraphStoreRecord_cache, _emberGraphStoreRecord_request_cache, _emberGraphStoreLookup, _emberGraphStoreRelationship, _emberGraphDataPromise_object, _emberGraphUtilUtil) {

	var Promise = _ember.default.RSVP.Promise;

	/**
  * The store is used to manage all records in the application.
  * Ideally, there should only be one store for an application.
  *
  * @class Store
  * @constructor
  */
	var Store = (_ember.default.Service || _ember.default.Object).extend({

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
   * Contains currently pending requests for records.
   * This allows us to chain duplicated requests.
   *
   * @property recordRequestCache
   * @type {RecordRequestCache}
   * @final
   * @private
   */
		recordRequestCache: {},

		initializeCaches: _ember.default.on('init', function () {
			this.setProperties({
				recordCache: _emberGraphStoreRecord_cache.default.create({ cacheTimeout: this.get('cacheTimeout') }),
				recordRequestCache: _emberGraphStoreRecord_request_cache.default.create()
			});
		}),

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
		createRecord: function (typeKey) {
			var json = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

			var record = this.modelFor(typeKey).create(this);
			this.get('recordCache').storeRecord(record);
			record.initializeRecord(json);
			return record;
		},

		/**
   * Returns all records of the given type that are in the cache.
   *
   * @method cachedRecordsFor
   * @param {String} typeKey
   * @return {Model[]}
   */
		cachedRecordsFor: function (typeKey) {
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
		getRecord: function (typeKey, id) {
			return this.get('recordCache').getRecord(typeKey, id);
		},

		/**
   * Returns an array containing all of the cached records for the
   * given type. The array will be updated as more records of the
   * type are cached. This will contain _all_ records of that type,
   * new and saved. This method will always return the same array
   * for a type.
   *
   * @method getLiveRecordArray
   * @param {String} typeKey
   * @returns {Model[]}
   */
		getLiveRecordArray: function (typeKey) {
			return this.get('recordCache').getLiveRecordArray(typeKey);
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
		find: function (typeKey, options) {
			switch (_ember.default.typeOf(options)) {
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
					throw new _ember.default.Error('A bad `find` call was made to the store.');
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
		_findSingle: function (typeKey, id) {
			var _this = this;

			var promise = undefined;

			var record = this.getRecord(typeKey, id);
			if (record) {
				promise = Promise.resolve();
			}

			var recordRequestCache = this.get('recordRequestCache');
			if (!promise) {
				var pendingRequest = recordRequestCache.getPendingRequest(typeKey, id);

				if (pendingRequest) {
					promise = pendingRequest;
				}
			}

			if (!promise) {
				promise = this.adapterFor(typeKey).findRecord(typeKey, id).then(function (payload) {
					_this.pushPayload(payload);
				});

				recordRequestCache.savePendingRequest(typeKey, id, promise);
			}

			return _emberGraphDataPromise_object.ModelPromiseObject.create({
				id: id, typeKey: typeKey,
				promise: promise.then(function () {
					return _this.getRecord(typeKey, id);
				})
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
		_findMany: function (typeKey) {
			var _this2 = this;

			var ids = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

			if (ids.length === 0) {
				return _emberGraphDataPromise_object.PromiseArray.create({
					promise: Promise.resolve([])
				});
			}

			var idsToFetch = ids.filter(function (id) {
				return _this2.getRecord(typeKey, id) === null;
			});

			var promise = undefined;

			if (idsToFetch.length === 0) {
				promise = Promise.resolve();
			}

			var recordRequestCache = this.get('recordRequestCache');
			if (!promise) {
				var pendingRequest = recordRequestCache.getPendingRequest(typeKey, ids);

				if (pendingRequest) {
					promise = pendingRequest;
				}
			}

			if (!promise) {
				promise = this.adapterFor(typeKey).findMany(typeKey, ids).then(function (payload) {
					_this2.pushPayload(payload);
				});

				recordRequestCache.savePendingRequest(typeKey, ids, promise);
			}

			return _emberGraphDataPromise_object.PromiseArray.create({
				promise: promise.then(function () {
					return ids.map(function (id) {
						return _this2.getRecord(typeKey, id);
					}).toArray();
				})
			});
		},

		/**
   * Gets all of the records of a type from the adapter as a PromiseArray.
   *
   * @param {String} typeKey
   * @return {PromiseArray}
   * @private
   */
		_findAll: function (typeKey) {
			var _this3 = this;

			var promise = undefined;

			var recordRequestCache = this.get('recordRequestCache');
			var pendingRequest = recordRequestCache.getPendingRequest(typeKey);
			if (pendingRequest) {
				promise = pendingRequest;
			}

			if (!promise) {
				promise = this.adapterFor(typeKey).findAll(typeKey).then(function (payload) {
					_this3.pushPayload(payload);
				});

				recordRequestCache.savePendingRequest(typeKey, promise);
			}

			return _emberGraphDataPromise_object.PromiseArray.create({
				promise: promise.then(function () {
					return _this3.cachedRecordsFor(typeKey);
				})
			});
		},

		/**
   * Gets records for a query from the adapter as a PromiseArray.
   *
   * @param {String} typeKey
   * @param {Object} query
   * @return {PromiseArray}
   * @private
   */
		_findQuery: function (typeKey, query) {
			var _this4 = this;

			var promise = undefined;

			var recordRequestCache = this.get('recordRequestCache');
			var pendingRequest = recordRequestCache.getPendingRequest(typeKey, query);
			if (pendingRequest) {
				promise = pendingRequest;
			}

			if (!promise) {
				promise = this.adapterFor(typeKey).findQuery(typeKey, query);
				recordRequestCache.savePendingRequest(typeKey, query, promise);
			}

			return promise.then(function (payload) {
				return {
					records: _emberGraphDataPromise_object.PromiseArray.create({
						promise: promise.then(function (payload) {
							var records = payload.meta.matchedRecords;
							_this4.pushPayload(payload);

							return records.map(function (record) {
								return _this4.getRecord(record.type, record.id);
							});
						})
					}),
					meta: payload.meta.serverMeta
				};
			});
		},

		/**
   * Persists a record (new or old) to the server.
   *
   * @method saveRecord
   * @param {Model} record
   * @return {Promise} Resolves to the saved record
   */
		saveRecord: function (record) {
			var _this5 = this;

			if (!record.get('isNew')) {
				return this.updateRecord(record);
			}

			if (!record.isInitialized()) {
				throw new _ember.default.Error('Can\'t save an uninitialized record.');
			}

			var typeKey = record.get('typeKey');

			return this.adapterFor(typeKey).createRecord(record).then(function (payload) {
				var tempId = record.get('id');
				var newId = _ember.default.get(payload, 'meta.createdRecord.id');

				if (!newId) {
					if (payload[typeKey].length === 1) {
						newId = payload[typeKey][0].id;
					} else {
						throw new _ember.default.Error('Missing `createdRecord` meta attribute.');
					}
				}

				record.set('id', newId);

				var recordCache = _this5.get('recordCache');
				recordCache.deleteRecord(typeKey, tempId);
				recordCache.storeRecord(record);
				_this5.updateRelationshipsWithNewId(typeKey, tempId, newId);

				_this5.pushPayload(payload);
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
		updateRecord: function (record) {
			var _this6 = this;

			var recordJson = {
				id: record.get('id')
			};

			record.constructor.eachAttribute(function (name) {
				recordJson[name] = record.get(name);
			});

			record.constructor.eachRelationship(function (name) {
				recordJson[name] = record.get('_' + name);
			});

			var potentialPayload = {};
			potentialPayload[record.get('typeKey')] = [recordJson];

			return this.adapterFor(record.get('typeKey')).updateRecord(record).then(function (payload) {
				_this6.pushPayload(payload || potentialPayload);
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
		deleteRecord: function (record) {
			var _this7 = this;

			if (record.get('isCreating')) {
				return Promise.reject('Can\'t delete a record before it\'s created.');
			}

			var typeKey = record.get('typeKey');
			var id = record.get('id');

			if (record.get('isNew')) {
				this.deleteRecordFromStore(typeKey, id);
				return Promise.resolve();
			}

			return this.adapterFor(typeKey).deleteRecord(record).then(function (payload) {
				_this7.deleteRecordFromStore(typeKey, id);
				_this7.pushPayload(payload);
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
		deleteRecordFromStore: function (typeKey, id) {
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
		reloadRecord: function (record) {
			var _this8 = this;

			if (record.get('isDirty') && !this.get('reloadDirty')) {
				throw new _ember.default.Error('Can\'t reload a record while it\'s dirty and `reloadDirty` is turned off.');
			}

			return this.adapterFor(record.typeKey).findRecord(record.typeKey, record.get('id')).then(function (payload) {
				_this8.pushPayload(payload);
				return record;
			});
		},

		/**
   * @method extractPayload
   * @deprecated Renamed to `pushPayload` to be more familiar to Ember-Data users.
   */
		extractPayload: (0, _emberGraphUtilUtil.deprecateMethod)('`extractPayload` is deprecated in favor of `pushPayload`', 'pushPayload'),

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
		pushPayload: function () {
			var _this9 = this;

			var payload = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

			if (Object.keys(payload).length === 0) {
				return;
			}

			_ember.default.changeProperties(function () {
				var reloadDirty = _this9.get('reloadDirty');

				(_ember.default.get(payload, 'meta.deletedRecords') || []).forEach(function (record) {
					_this9.deleteRecordFromStore(record.type, record.id);
				});

				delete payload.meta;

				Object.keys(payload).forEach(function (typeKey) {
					var model = _this9.modelFor(typeKey);

					payload[typeKey].forEach(function (json) {
						var record = _this9.getRecord(typeKey, json.id);

						if (record) {
							if (!record.get('isDirty') || reloadDirty) {
								record.loadDataFromServer(json);
							}
						} else {
							record = model.create(_this9);
							record.set('id', json.id);

							_this9.get('recordCache').storeRecord(record);
							_this9.connectQueuedRelationships(record);
							record.loadDataFromServer(json);
						}
					});
				});
			});
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
		unloadRecord: function (record, discardChanges) {
			var _this10 = this;

			if (!discardChanges && record.get('isDirty')) {
				throw new _ember.default.Error('Can\'t unload a dirty record.');
			}

			_ember.default.changeProperties(function () {
				record.rollback();

				_this10.queueConnectedRelationships(record);
				_this10.get('recordCache').deleteRecord(record.get('typeKey'), record.get('id'));
				record.set('store', null);
			});
		}

	});

	Store.reopen(_emberGraphStoreLookup.default);
	Store.reopen(_emberGraphStoreRelationship.default);

	exports.default = Store;
});

define('ember-graph/util/array', ['exports', 'ember'], function (exports, _ember) {

	var mapBy = function (property) {
		return this.map(function (item) {
			return _ember.default.get(item, property);
		});
	};

	exports.mapBy = mapBy;
});

define('ember-graph/util/compatibility', ['exports', 'ember'], function (exports, _ember) {

	/**
  * This function will return `true` if the current version of
  * Ember is at least the version number specified. If not,
  * it will return false.
  *
  * @param {Number} major
  * @param {Number} minor
  * @param {Number} patch
  * @return {Boolean}
  */
	function verifyAtLeastEmberVersion(major, minor, patch) {
		var emberVersionParts = _ember.default.VERSION.split(/\.|\-/);
		var emberVersionNumbers = emberVersionParts.map(function (part) {
			return parseInt(part, 10);
		});

		if (emberVersionNumbers[0] < major) {
			return false;
		} else if (emberVersionNumbers[0] > major) {
			return true;
		}

		if (emberVersionNumbers[1] < minor) {
			return false;
		} else if (emberVersionNumbers[1] > minor) {
			return true;
		}

		if (emberVersionNumbers[2] < patch) {
			return false;
		}

		return true;
	}

	exports.verifyAtLeastEmberVersion = verifyAtLeastEmberVersion;
});

define('ember-graph/util/computed', ['exports', 'ember', 'ember-graph/util/compatibility'], function (exports, _ember, _emberGraphUtilCompatibility) {
	function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

	var isNewVersion = (0, _emberGraphUtilCompatibility.verifyAtLeastEmberVersion)(1, 12, 0);

	var oldComputed = function () {
		for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
			args[_key] = arguments[_key];
		}

		var dependentProperties = args.slice(0, -1);
		var definition = args[args.length - 1];
		var readOnly = !definition.set;

		if (readOnly) {
			return _ember.default.computed.apply(_ember.default, _toConsumableArray(dependentProperties).concat([function (key) {
				return definition.get.call(this, key);
			}])).readOnly();
		} else {
			return _ember.default.computed.apply(_ember.default, _toConsumableArray(dependentProperties).concat([function (key, value) {
				if (arguments.length > 1) {
					definition.set.call(this, key, value);
				}

				return definition.get.call(this, key);
			}]));
		}
	};

	var newComputed = function () {
		for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
			args[_key2] = arguments[_key2];
		}

		var dependentProperties = args.slice(0, -1);
		var definition = args[args.length - 1];
		var readOnly = !definition.set;

		if (definition.set) {
			(function () {
				var oldSet = definition.set;
				definition.set = function (key, value) {
					oldSet.call(this, key, value);
					return definition.get.call(this, key);
				};
			})();
		}

		var property = _ember.default.computed.apply(_ember.default, _toConsumableArray(dependentProperties).concat([definition]));

		if (readOnly) {
			return property.readOnly();
		} else {
			return property;
		}
	};

	var computed = isNewVersion ? newComputed : oldComputed;

	exports.computed = computed;
});

define('ember-graph/util/data_adapter', ['exports', 'ember', 'ember-graph/model/model', 'ember-graph/util/computed'], function (exports, _ember, _emberGraphModelModel, _emberGraphUtilComputed) {

	/**
  * Extends Ember's `DataAdapter` class to provide debug functionality for the Ember Inspector.
  *
  * Thanks to the Ember-Data team for the reference implementation.
  *
  * @class DataAdapter
  * @private
  */
	var EmberGraphDataAdapter = _ember.default.DataAdapter && _ember.default.DataAdapter.extend({

		containerDebugAdapter: (0, _emberGraphUtilComputed.computed)({
			get: function () {
				return this.get('container').lookup('container-debug-adapter:main');
			}
		}),

		getFilters: function () {
			return [{ name: 'isNew', desc: 'New' }, { name: 'isModified', desc: 'Modified' }, { name: 'isClean', desc: 'Clean' }];
		},

		detect: function (modelClass) {
			return modelClass !== _emberGraphModelModel.default && _emberGraphModelModel.default.detect(modelClass);
		},

		columnsForType: function (modelClass) {
			var attributeLimit = this.get('attributeLimit');
			var columns = [{ name: 'id', desc: 'Id' }];

			modelClass.eachAttribute(function (name, meta) {
				if (columns.length > attributeLimit) {
					return;
				}

				var desc = _ember.default.String.capitalize(_ember.default.String.underscore(name).replace(/_/g, ' '));
				columns.push({ name: name, desc: desc });
			});

			return columns;
		},

		getRecords: function (modelClass) {
			var typeKey = _ember.default.get(modelClass, 'typeKey');
			return this.get('store').getLiveRecordArray(typeKey);
		},

		getRecordColumnValues: function (record) {
			var values = { id: record.get('id') };

			record.constructor.eachAttribute(function (name, meta) {
				values[name] = record.get(name);
			});

			return values;
		},

		getRecordKeywords: function (record) {
			var keywords = [];

			record.constructor.eachAttribute(function (name) {
				keywords.push(record.get(name) + '');
			});

			return keywords;
		},

		getRecordFilterValues: function (record) {
			var isNew = record.get('isNew');
			var isDirty = record.get('isDirty');

			return {
				isNew: isNew,
				isModified: isDirty && !isNew,
				isClean: !isDirty
			};
		},

		getRecordColor: function (record) {
			if (record.get('isNew')) {
				return 'green';
			} else if (record.get('isDirty')) {
				return 'blue';
			} else {
				return 'black';
			}
		},

		observeRecord: function (record, recordUpdated) {
			var _this = this;

			var releaseMethods = _ember.default.A();
			var propertiesToObserve = _ember.default.A(['id', 'isNew', 'isDirty']);

			propertiesToObserve.addObjects(_ember.default.get(record.constructor, 'attributes').toArray());

			propertiesToObserve.forEach(function (name) {
				var handler = function () {
					return _this.wrapRecord(record);
				};

				_ember.default.addObserver(record, name, handler);

				releaseMethods.push(function () {
					return _ember.default.removeObserver(record, name, handler);
				});
			});

			return function () {
				releaseMethods.forEach(function (release) {
					return release();
				});
			};
		}
	});

	var DataAdapter = _ember.default.DataAdapter ? EmberGraphDataAdapter : null;

	exports.default = DataAdapter;
});

define('ember-graph/util/inflector', ['exports', 'ember'], function (exports, _ember) {

	/*
  I took the rules in this code from inflection.js, whose license can be found below.
  */

	/*
  Copyright (c) 2010 Ryan Schuft (ryan.schuft@gmail.com)
 
  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:
 
  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.
 
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.
  */

	var uncountableWords = ['equipment', 'information', 'rice', 'money', 'species', 'series', 'fish', 'sheep', 'moose', 'deer', 'news'];

	var pluralRules = [[/(m)an$/gi, '$1en'], [/(pe)rson$/gi, '$1ople'], [/(child)$/gi, '$1ren'], [/^(ox)$/gi, '$1en'], [/(ax|test)is$/gi, '$1es'], [/(octop|vir)us$/gi, '$1i'], [/(alias|status)$/gi, '$1es'], [/(bu)s$/gi, '$1ses'], [/(buffal|tomat|potat)o$/gi, '$1oes'], [/([ti])um$/gi, '$1a'], [/sis$/gi, 'ses'], [/(?:([^f])fe|([lr])f)$/gi, '$1$2ves'], [/(hive)$/gi, '$1s'], [/([^aeiouy]|qu)y$/gi, '$1ies'], [/(x|ch|ss|sh)$/gi, '$1es'], [/(matr|vert|ind)ix|ex$/gi, '$1ices'], [/([m|l])ouse$/gi, '$1ice'], [/(quiz)$/gi, '$1zes'], [/s$/gi, 's'], [/$/gi, 's']];

	var singularRules = [[/(m)en$/gi, '$1an'], [/(pe)ople$/gi, '$1rson'], [/(child)ren$/gi, '$1'], [/([ti])a$/gi, '$1um'], [/((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$/gi, '$1$2sis'], [/(hive)s$/gi, '$1'], [/(tive)s$/gi, '$1'], [/(curve)s$/gi, '$1'], [/([lr])ves$/gi, '$1f'], [/([^fo])ves$/gi, '$1fe'], [/([^aeiouy]|qu)ies$/gi, '$1y'], [/(s)eries$/gi, '$1eries'], [/(m)ovies$/gi, '$1ovie'], [/(x|ch|ss|sh)es$/gi, '$1'], [/([m|l])ice$/gi, '$1ouse'], [/(bus)es$/gi, '$1'], [/(o)es$/gi, '$1'], [/(shoe)s$/gi, '$1'], [/(cris|ax|test)es$/gi, '$1is'], [/(octop|vir)i$/gi, '$1us'], [/(alias|status)es$/gi, '$1'], [/^(ox)en/gi, '$1'], [/(vert|ind)ices$/gi, '$1ex'], [/(matr)ices$/gi, '$1ix'], [/(quiz)zes$/gi, '$1'], [/s$/gi, '']];

	var apply = function (str, rules) {
		if (uncountableWords.indexOf(str) >= 0) {
			return str;
		}

		for (var i = 0; i < rules.length; i = i + 1) {
			if (str.match(rules[i][0])) {
				return str.replace(rules[i][0], rules[i][1]);
			}
		}

		return str;
	};

	var PLURALIZE_CACHE = {};
	function pluralize(str) {
		if (!PLURALIZE_CACHE[str]) {
			PLURALIZE_CACHE[str] = apply(str, pluralRules);
		}

		return PLURALIZE_CACHE[str];
	}

	var SINGULARIZE_CACHE = {};
	function singularize(str) {
		if (!SINGULARIZE_CACHE[str]) {
			SINGULARIZE_CACHE[str] = apply(str, singularRules);
		}

		return SINGULARIZE_CACHE[str];
	}

	function overridePluralRule(singular, plural) {
		PLURALIZE_CACHE[singular] = plural;
	}

	function overrideSingularRule(plural, singular) {
		SINGULARIZE_CACHE[plural] = singular;
	}

	if (_ember.default.EXTEND_PROTOTYPES === true || _ember.default.EXTEND_PROTOTYPES.String) {
		String.prototype.pluralize = String.prototype.pluralize || function () {
			return pluralize(this);
		};

		String.prototype.singularize = String.prototype.singularize || function () {
			return singularize(this);
		};
	}

	exports.pluralize = pluralize;
	exports.singularize = singularize;
	exports.overridePluralRule = overridePluralRule;
	exports.overrideSingularRule = overrideSingularRule;
});

define('ember-graph/util/set', ['exports', 'ember'], function (exports, _ember) {

	/* eslint-disable */
	/**
  * Pulled from the Ember 1.13 release.
  *
  * withoutAll added by me
  *
  * TODO: Remove and use ES6 Set
  */
	exports.default = _ember.default.CoreObject.extend(_ember.default.MutableEnumerable, _ember.default.Copyable, _ember.default.Freezable, {

		length: 0,

		clear: function () {
			if (this.isFrozen) {
				throw new _ember.default.Error(_ember.default.FROZEN_ERROR);
			}

			var len = _ember.default.get(this, 'length');
			if (len === 0) {
				return this;
			}

			var guid;

			this.enumerableContentWillChange(len, 0);
			_ember.default.propertyWillChange(this, 'firstObject');
			_ember.default.propertyWillChange(this, 'lastObject');

			for (var i = 0; i < len; i++) {
				guid = _ember.default.guidFor(this[i]);
				delete this[guid];
				delete this[i];
			}

			_ember.default.set(this, 'length', 0);

			_ember.default.propertyDidChange(this, 'firstObject');
			_ember.default.propertyDidChange(this, 'lastObject');
			this.enumerableContentDidChange(len, 0);

			return this;
		},

		isEqual: function (obj) {
			// fail fast
			if (!_ember.default.Enumerable.detect(obj)) {
				return false;
			}

			var loc = _ember.default.get(this, 'length');
			if (_ember.default.get(obj, 'length') !== loc) {
				return false;
			}

			while (--loc >= 0) {
				if (!obj.contains(this[loc])) {
					return false;
				}
			}

			return true;
		},

		add: _ember.default.aliasMethod('addObject'),

		remove: _ember.default.aliasMethod('removeObject'),

		pop: function () {
			if (_ember.default.get(this, 'isFrozen')) {
				throw new _ember.default.Error(_ember.default.FROZEN_ERROR);
			}

			var obj = this.length > 0 ? this[this.length - 1] : null;
			this.remove(obj);
			return obj;
		},

		push: _ember.default.aliasMethod('addObject'),

		shift: _ember.default.aliasMethod('pop'),

		unshift: _ember.default.aliasMethod('push'),

		addEach: _ember.default.aliasMethod('addObjects'),

		removeEach: _ember.default.aliasMethod('removeObjects'),

		init: function (items) {
			// Suppress deprecation notices
			// Also make sure groundskeeper doesn't remove the code
			var name = 'deprecate';
			var deprecate = _ember.default[name];
			_ember.default[name] = function () {};
			this._super.apply(this, arguments);
			_ember.default[name] = deprecate;

			if (items) {
				this.addObjects(items);
			}
		},

		nextObject: function (idx) {
			return this[idx];
		},

		firstObject: _ember.default.computed(function () {
			return this.length > 0 ? this[0] : undefined;
		}),

		lastObject: _ember.default.computed(function () {
			return this.length > 0 ? this[this.length - 1] : undefined;
		}),

		addObject: function (obj) {
			if (_ember.default.get(this, 'isFrozen')) {
				throw new _ember.default.Error(_ember.default.FROZEN_ERROR);
			}

			if (_ember.default.isNone(obj)) {
				return this; // nothing to do
			}

			var guid = _ember.default.guidFor(obj);
			var idx = this[guid];
			var len = _ember.default.get(this, 'length');
			var added;

			if (idx >= 0 && idx < len && this[idx] === obj) {
				return this; // added
			}

			added = [obj];

			this.enumerableContentWillChange(null, added);
			_ember.default.propertyWillChange(this, 'lastObject');

			len = _ember.default.get(this, 'length');
			this[guid] = len;
			this[len] = obj;
			_ember.default.set(this, 'length', len + 1);

			_ember.default.propertyDidChange(this, 'lastObject');
			this.enumerableContentDidChange(null, added);

			return this;
		},

		removeObject: function (obj) {
			if (_ember.default.get(this, 'isFrozen')) {
				throw new _ember.default.Error(_ember.default.FROZEN_ERROR);
			}

			if (_ember.default.isNone(obj)) {
				return this; // nothing to do
			}

			var guid = _ember.default.guidFor(obj);
			var idx = this[guid];
			var len = _ember.default.get(this, 'length');
			var isFirst = idx === 0;
			var isLast = idx === len - 1;
			var last, removed;

			if (idx >= 0 && idx < len && this[idx] === obj) {
				removed = [obj];

				this.enumerableContentWillChange(removed, null);
				if (isFirst) {
					_ember.default.propertyWillChange(this, 'firstObject');
				}
				if (isLast) {
					_ember.default.propertyWillChange(this, 'lastObject');
				}

				// swap items - basically move the item to the end so it can be removed
				if (idx < len - 1) {
					last = this[len - 1];
					this[idx] = last;
					this[_ember.default.guidFor(last)] = idx;
				}

				delete this[guid];
				delete this[len - 1];
				_ember.default.set(this, 'length', len - 1);

				if (isFirst) {
					_ember.default.propertyDidChange(this, 'firstObject');
				}
				if (isLast) {
					_ember.default.propertyDidChange(this, 'lastObject');
				}
				this.enumerableContentDidChange(removed, null);
			}

			return this;
		},

		contains: function (obj) {
			return this[_ember.default.guidFor(obj)] >= 0;
		},

		copy: function () {
			var C = this.constructor;
			var ret = new C();
			var loc = _ember.default.get(this, 'length');

			set(ret, 'length', loc);
			while (--loc >= 0) {
				ret[loc] = this[loc];
				ret[_ember.default.guidFor(this[loc])] = loc;
			}
			return ret;
		},

		toString: function () {
			var len = this.length;
			var array = [];
			var idx;

			for (idx = 0; idx < len; idx++) {
				array[idx] = this[idx];
			}
			return _ember.default.fmt('Ember.Set<%@>', [array.join(',')]);
		},

		withoutAll: function (items) {
			var ret = this.copy();
			ret.removeObjects(items);
			return ret;
		}
	});

	/* eslint-enable */
});

define('ember-graph/util/string', ['exports', 'ember'], function (exports, _ember) {

	function startsWith(string, prefix) {
		return string.indexOf(prefix) === 0;
	}

	function endsWith(string, suffix) {
		return string.indexOf(suffix, string.length - suffix.length) >= 0;
	}

	function capitalize(string) {
		return string[0].toLocaleUpperCase() + string.substring(1);
	}

	function decapitalize(string) {
		return string[0].toLocaleLowerCase() + string.substring(1);
	}

	if (_ember.default.EXTEND_PROTOTYPES === true || _ember.default.EXTEND_PROTOTYPES.String) {

		/**
   * Polyfill for String.prototype.startsWith
   *
   * @method startsWith
   * @param {String} prefix
   * @return {Boolean}
   * @namespace String
   */
		String.prototype.startsWith = String.prototype.startsWith || function (prefix) {
			return startsWith(this, prefix);
		};

		/**
   *Polyfill for String.prototype.endsWith
   *
   * @method endsWith
   * @param {String} suffix
   * @return {Boolean}
   * @namespace String
   */
		String.prototype.endsWith = String.prototype.endsWith || function (suffix) {
			return endsWith(this, suffix);
		};

		/**
   * Capitalizes the first letter of a string.
   *
   * @method capitalize
   * @return {String}
   * @namespace String
   */
		String.prototype.capitalize = String.prototype.capitalize || function () {
			return capitalize(this);
		};

		/**
   * Decapitalizes the first letter of a string.
   *
   * @method decapitalize
   * @return {String}
   * @namespace String
   */
		String.prototype.decapitalize = String.prototype.decapitalize || function () {
			return decapitalize(this);
		};
	}

	exports.startsWith = startsWith;
	exports.endsWith = endsWith;
	exports.capitalize = capitalize;
	exports.decapitalize = decapitalize;
});

define('ember-graph/util/util', ['exports', 'ember', 'ember-graph/util/set', 'ember-graph/util/computed'], function (exports, _ember, _emberGraphUtilSet, _emberGraphUtilComputed) {

  /**
   * Denotes that method must be implemented in a subclass.
   * If it's not overridden, calling it will throw an error.
   *
   * ```js
   * var Shape = Ember.Object.extend({
   *     getNumberOfSides: EG.abstractMethod('getNumberOfSides')
   * });
   * ```
   *
   * @method abstractMethod
   * @param {String} methodName
   * @return {Function}
   * @namespace EmberGraph
   */
  function abstractMethod(methodName) {
    return function () {
      throw new _ember.default.Error('You failed to implement the abstract `' + methodName + '` method.');
    };
  }

  /**
   * Denotes that a property must be overridden in a subclass.
   * If it's not overridden, using it will throw an error.
   *
   * ```js
   * var Shape = Ember.Object.extend({
   *     name: EG.abstractProperty('name')
   * });
   * ```
   *
   * @method abstractProperty
   * @param {String} propertyName
   * @return {ComputedProperty}
   * @namespace EmberGraph
   */
  function abstractProperty(propertyName) {
    return (0, _emberGraphUtilComputed.computed)({
      get: function () {
        throw new _ember.default.Error('You failed to override the abstract `' + propertyName + '` property.');
      }
    });
  }

  /**
   * Generates a version 4 (random) UUID.
   *
   * @method generateUUID
   * @return {String}
   * @namespace EmberGraph
   */
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0; // eslint-disable-line
      var v = c == 'x' ? r : r & 0x3 | 0x8; // eslint-disable-line
      return v.toString(16);
    });
  }

  /**
   * Compares the contents of two arrays for equality. Uses
   * Ember.Set to make the comparison, so the objects must
   * be equal with `===`.
   *
   * @method arrayContentsEqual
   * @param {Array} a
   * @param {Array} b
   * @returns {Boolean}
   * @namespace EmberGraph
   */
  function arrayContentsEqual(a, b) {
    var set = _emberGraphUtilSet.default.create();
    set.addObjects(a);
    return a.length === b.length && set.isEqual(b);
  }

  /**
   * Takes a list of record objects (with `type` and `id`)
   * and groups them into arrays based on their type.
   *
   * @method groupRecords
   * @param {Object[]} records
   * @return {Array[]}
   * @namespace EmberGraph
   */
  function groupRecords(records) {
    var groups = records.reduce(function (groups, record) {
      if (groups[record.type]) {
        groups[record.type].push(record);
      } else {
        groups[record.type] = [record];
      }

      return groups;
    }, {});

    return Object.keys(groups).reduce(function (array, key) {
      if (groups[key].length > 0) {
        array.push(groups[key]);
      }

      return array;
    }, []);
  }

  /**
   * Calls `callback` once for each value of the given object.
   * The callback receives `key` and `value` parameters.
   *
   * @method values
   * @param {Object} obj
   * @param {Function} callback
   * @param {Any} [thisArg=undefined]
   * @namespace EmberGraph
   */
  function values(obj, callback, thisArg) {
    var keys = Object.keys(obj);

    for (var i = 0; i < keys.length; ++i) {
      callback.call(thisArg, keys[i], obj[keys[i]]);
    }
  }

  /**
   * Works like `Ember.aliasMethod` only it displays a
   * deprecation warning before the aliased method is called.
   *
   * @method deprecateMethod
   * @param {String} message
   * @param {String} method
   * @return {Function}
   * @namespace EmberGraph
   */
  function deprecateMethod(message, method) {
    return function () {
      _ember.default.deprecate(message);
      this[method].apply(this, arguments);
    };
  }

  /**
   * Works like 'Ember.computed.alias' only it displays a
   * deprecation warning before the aliased property is returned.
   *
   * @method deprecateProperty
   * @param {String} message
   * @param {String} property
   * @return {ComputedProperty}
   * @namespace EmberGraph
   */
  function deprecateProperty(message, property) {
    return (0, _emberGraphUtilComputed.computed)(property, {
      get: function () {
        _ember.default.deprecate(message);
        return this.get(property);
      },
      set: function (key, value) {
        this.set(property, value);
      }
    });
  }

  exports.abstractMethod = abstractMethod;
  exports.abstractProperty = abstractProperty;
  exports.generateUUID = generateUUID;
  exports.arrayContentsEqual = arrayContentsEqual;
  exports.groupRecords = groupRecords;
  exports.values = values;
  exports.deprecateMethod = deprecateMethod;
  exports.deprecateProperty = deprecateProperty;
});

/* global define require */

var configureAliases = function() {
	var configureAlias = function(original, alias) {
		define(alias, ['exports', original], function(exports, original) {
			for (var key in original) {
				if (original.hasOwnProperty(key)) {
					exports[key] = original[key];
				}
			}
		});
	};

	configureAlias('ember-graph/main', 'ember-graph');
	configureAlias('ember-graph/util/util', 'ember-graph/util');
	configureAlias('ember-graph/serializer/serializer', 'ember-graph/serializer');
	configureAlias('ember-graph/adapter/adapter', 'ember-graph/adapter');
	configureAlias('ember-graph/adapter/ember_graph/adapter', 'ember-graph/adapter/ember_graph');
	configureAlias('ember-graph/model/model', 'ember-graph/model');
	configureAlias('ember-graph/attribute_type/type', 'ember-graph/attribute_type');
	configureAlias('ember-graph/store/store', 'ember-graph/store');
};

require(['ember-graph/initializer']);
require(['ember-graph/shim']);

configureAliases();

}).call(window || this);