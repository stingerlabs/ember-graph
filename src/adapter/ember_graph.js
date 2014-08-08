var Promise = Em.RSVP.Promise;
var map = Em.ArrayPolyfills.map;
var filter = Em.ArrayPolyfills.filter;
var forEach = Em.ArrayPolyfills.forEach;
var indexOf = Em.ArrayPolyfills.indexOf;

var ADD_OP_NAME_REGEX = /^\/links\/([^/]+)/i;
var REMOVE_OP_REGEX = /^\/links\/([^/]+)\/.+/i;

function getRelationshipNameFromChangePath(path, op) {
	return path.match(op === 'add' ? ADD_OP_NAME_REGEX : REMOVE_OP_REGEX)[1];
}

function cloneJson(json) {
	return JSON.parse(JSON.stringify(json));
}

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
EG.EmberGraphAdapter = EG.Adapter.extend({

	/**
	 * @property serializer
	 * @type JSONSerializer
	 * @protected
	 * @final
	 */
	serializer: Em.computed(function() {
		return this.get('container').lookup('serializer:ember_graph');
	}).property().readOnly(),

	createRecord: function(record) {
		var _this = this;

		var json = this.serialize(record, { requestType: 'createRecord', recordType: record.get('typeKey') });
		return this.serverCreateRecord(record.get('typeKey'), json).then(function(payload) {
			return _this.deserialize(payload, { requestType: 'createRecord', recordType: record.typeKey });
		});
	},

	findRecord: function(typeKey, id) {
		return this.serverFindRecord(typeKey, id);
	},

	findMany: function(typeKey, ids) {
		return this.serverFindMany(typeKey, ids);
	},

	findAll: function(typeKey) {
		return this.serverFindAll(typeKey);
	},

	findQuery: function() {
		return Promise.reject('LocalStorageAdapter doesn\'t implement `findQuery` by default.');
	},

	updateRecord: function(record) {
		var changes = this.serialize(record, { requestType: 'updateRecord', recordType: record.get('typeKey') });
		return this.serverUpdateRecord(record.get('typeKey'), record.get('id'), changes);
	},

	deleteRecord: function(record) {
		return this.serverDeleteRecord(record.get('typeKey'), record.get('id'));
	},

	serialize: function(record, options) {
		return this.get('serializer').serialize(record, options);
	},

	deserialize: function(payload, options) {
		return this.get('serializer').deserialize(payload, options);
	},

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @method serverCreateRecord
	 * @param {String} typeKey
	 * @param {JSON} json
	 * @return {Promise}
	 * @protected
	 */
	serverCreateRecord: function(typeKey, json) {
		var id, _this = this;

		return this.getDatabase().then(function(db) {
			id = _this.generateIdForRecord(typeKey, json, db);
			db = _this.putRecordInDatabase(typeKey, id, json[EG.String.pluralize(typeKey)][0], db);
			return _this.setDatabase(db);
		}).then(function(db) {
			var record = _this.getRecordFromDatabase(typeKey, id, db);
			var payload = {};
			payload[EG.String.pluralize(typeKey)] = [record];
			return payload;
		});
	},

	/**
	 * @method serverFindRecord
	 * @param {String} typeKey
	 * @param {String} id
	 * @return {Promise}
	 * @protected
	 */
	serverFindRecord: function(typeKey, id) {
		var _this = this;

		return this.getDatabase().then(function(db) {
			if (Em.get(db, 'records.' + typeKey + '.' + id)) {
				var payload = {};
				payload[EG.String.pluralize(typeKey)] = [_this.getRecordFromDatabase(typeKey, id, db)];
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
	 */
	serverFindMany: function(typeKey, ids) {
		var _this = this;

		return this.getDatabase().then(function(db) {
			var records = map.call(ids, function(id) {
				if (Em.get(db, 'records.' + typeKey + '.' + id)) {
					return _this.getRecordFromDatabase(typeKey, id, db);
				} else {
					throw { status: 404, typeKey: typeKey, id: id };
				}
			});

			var payload = {};
			payload[EG.String.pluralize(typeKey)] = records;
			return payload;
		});
	},

	/**
	 * @method serverFindAll
	 * @param {String} typeKey
	 * @return {Promise}
	 * @protected
	 */
	serverFindAll: function(typeKey) {
		var _this = this;

		return this.getDatabase().then(function(db) {
			var records = map.call(Em.keys(db.records[typeKey] || {}), function(id) {
				return _this.getRecordFromDatabase(typeKey, id, db);
			});

			var payload = {};
			payload[EG.String.pluralize(typeKey)] = records;
			return payload;
		});
	},

	/**
	 * @method serverUpdateRecord
	 * @param {String} typeKey
	 * @param {String} id
	 * @param {JSON[]} changes
	 * @return {Promise}
	 * @protected
	 */
	serverUpdateRecord: function(typeKey, id, changes) {
		var _this = this;

		return this.getDatabase().then(function(db) {
			db = _this.applyChangesToDatabase(typeKey, id, changes, db);
			return _this.setDatabase(db);
		});
	},

	/**
	 * @method serverDeleteRecord
	 * @param {String} typeKey
	 * @param {String} id
	 * @return {Promise}
	 * @protected
	 */
	serverDeleteRecord: function(typeKey, id) {
		var _this = this;
		var payload = null;

		return this.getDatabase().then(function(db) {
			if (db.records[typeKey]) {
				delete db.records[typeKey][id];
			}

			db.relationships = filter.call(db.relationships, function(r) {
				return !((r.t1 === typeKey && r.i1 === id) || (r.t2 === typeKey && r.i2 === id));
			});

			return _this.setDatabase(db).then(function() {
				return {
					meta: {
						deletedRecords: [{ type: typeKey, id: id }]
					}
				};
			});
		});
	},

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Determines whether or not to bootstrap the database
	 * with an initial set of data. If you want to initialize
	 * the database with data, you should override this property
	 * to return true. Use a computed property if deciding to
	 * initialize requires application logic.
	 *
	 * @property shouldBootstrapDatabase
	 * @returns {Boolean}
	 * @protected
	 */
	shouldBootstrapDatabase: false,

	/**
	 * If {{link-to-method 'EmberGraphAdapter' 'shouldBootstrapDatabase'}} is true,
	 * then this hook is called to get the data to inject into the database. The format
	 * is the same format required by {{link-to-method 'Store' 'extractPayload'}}.
	 *
	 * @method getBootstrappedData
	 * @return {Object}
	 * @protected
	 */
	getBootstrappedData: EG.abstractMethod('getBootstrappedData'),

	bootstrapData: Em.on('init', function() {
		if (!this.get('shouldBootstrapDatabase')) {
			return;
		}

		var data = this.getBootstrappedData();
	}),

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * The value of an empty database. This can be used for initializing
	 * a database if it hasn't been used before.
	 *
	 * @property emptyDatabase
	 * @final
	 * @protected
	 */
	emptyDatabase: Em.computed(function() {
		return { records: {}, relationships: [] };
	}).readOnly().volatile(),

	/**
	 * Return a copy of the database from the storage location in JSON form.
	 *
	 * @method getDatabase
	 * @return {Promise} Resolves to the DB JSON
	 * @protected
	 */
	getDatabase: EG.abstractMethod('getDatabase'),

	/**
	 * Store the updated version of the database in the storage location.
	 *
	 * @method setDatabase
	 * @param {JSON} db
	 * @return {Promise} Resolves or rejects based on saving success (resolves to current DB)
	 * @protected
	 */
	setDatabase: EG.abstractMethod('saveDatabase'),

	/**
	 * @method generateIdForRecord
	 * @param {String} typeKey
	 * @param {JSON} json
	 * @param {JSON} db
	 * @return {String}
	 * @protected
	 */
	generateIdForRecord: function(typeKey, json, db) {
		return EG.generateUUID();
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
	 */
	getRecordFromDatabase: function(typeKey, id, db) {
		var model = this.get('store').modelForType(typeKey);
		var json = cloneJson(db.records[typeKey][id]);
		json.id = id;
		json.links = {};

		forEach.call(db.relationships, function(relationship) {
			var meta;

			if (relationship.t1 === typeKey && relationship.i1 === id) {
				meta = model.metaForRelationship(relationship.n1);

				if (meta.kind === EG.Model.HAS_ONE_KEY) {
					json.links[relationship.n1] = { type: relationship.t2, id: relationship.i2 };
				} else {
					json.links[relationship.n1] = json.links[relationship.n1] || [];
					json.links[relationship.n1].push({ type: relationship.t2, id: relationship.i2 });
				}
			} else if (relationship.t2 === typeKey && relationship.i2 === id) {
				meta = model.metaForRelationship(relationship.n2);

				if (meta.kind === EG.Model.HAS_ONE_KEY) {
					json.links[relationship.n2] = { type: relationship.t1, id: relationship.i1 };
				} else {
					json.links[relationship.n2] = json.links[relationship.n2] || [];
					json.links[relationship.n2].push({ type: relationship.t1, id: relationship.i1 });
				}
			}
		});

		model.eachRelationship(function(name, meta) {
			if (!json.links[name]) {
				if (meta.kind === EG.Model.HAS_ONE_KEY) {
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
	 */
	putRecordInDatabase: function(typeKey, id, json, db) {
		var model = this.get('store').modelForType(typeKey);

		db.records[typeKey] = db.records[typeKey] || {};
		db.records[typeKey][id] = {};

		model.eachAttribute(function(name, meta) {
			db.records[typeKey][id][name] = json[name];
		});

		model.eachRelationship(function(name, meta) {
			if (meta.kind === EG.Model.HAS_ONE_KEY) {
				if (json.links[name]) {
					var relationship = {
						t1: typeKey, i1: id, n1: name,
						t2: json.links[name].type, i2: json.links[name].id, n2: meta.inverse
					};

					db = this.addRelationshipToDatabase(relationship, db);
				}
			} else {
				forEach.call(json.links[name], function(value) {
					var relationship = {
						t1: typeKey, i1: id, n1: name,
						t2: value.type, i2: value.id, n2: meta.inverse
					};

					db = this.addRelationshipToDatabase(relationship, db);
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
	 */
	applyChangesToDatabase: function(typeKey, id, changes, db) {
		var model = this.get('store').modelForType(typeKey);

		forEach.call(changes, function(change) {
			switch (change.op) {
				case 'replace':
					if (EG.String.startsWith(change.path, '/links/')) {
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
	},

	/**
	 * Adds a new hasMany relationship to the database, removing any conflicts.
	 * The hasMany relationship should be the first one in the relationship JSON.
	 *
	 * @method addRelationshipToDatabase
	 * @param {JSON} relationship
	 * @param {JSON} db
	 * @return {JSON} The updated DB
	 * @private
	 */
	addHasManyRelationshipToDatabase: function(relationship, db) {
		var relationships = this.getRelationshipsFor(relationship.t1, relationship.i1, relationship.n1, db);

		var connected = filter.call(relationships, function(r) {
			return (relationship.t2 === r.t2 && relationship.i2 === r.i2 && relationship.n2 === r.n2);
		});

		if (connected.length > 0) {
			return db;
		}

		if (relationship.n2) {
			var inverseModel = this.get('store').modelForType(relationship.t2);
			var inverseMeta = inverseModel.metaForRelationship(relationship.n2);

			if (inverseMeta.kind === EG.Model.HAS_ONE_KEY) {
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
	 */
	removeHasManyRelationshipFromDatabase: function(relationship, db) {
		var relationships = this.getRelationshipsFor(relationship.t1, relationship.i1, relationship.n1, db);

		db.relationships = filter.call(db.relationships, function(r) {
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
	 */
	setHasOneRelationshipInDatabase: function(relationship, db) {
		db = this.clearHasOneRelationshipInDatabase(relationship.t1, relationship.i1, relationship.n1, db);

		if (relationship.n2) {
			var inverseModel = this.get('store').modelForType(relationship.t2);
			var inverseMeta = inverseModel.metaForRelationship(relationship.n2);

			if (inverseMeta.kind === EG.Model.HAS_ONE_KEY) {
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
	 */
	clearHasOneRelationshipInDatabase: function(typeKey, id, name, db) {
		var relationships = this.getRelationshipsFor(typeKey, id, name, db);

		forEach.call(relationships, function(relationship) {
			db.relationships.splice(indexOf.call(db.relationships, relationship), 1);
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
	 */
	getRelationshipsFor: function(typeKey, id, name, db) {
		return filter.call(db.relationships, function(relationship) {
			return ((relationship.t1 === typeKey && relationship.i1 === id && relationship.n1 === name) ||
				(relationship.t2 === typeKey && relationship.i2 === id && relationship.n2 === name));
		});
	}

});