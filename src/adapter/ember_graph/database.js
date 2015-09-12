import Ember from 'ember';
import Model from 'ember-graph/model/model';

import { abstractMethod } from 'ember-graph/util/util';
import { startsWith } from 'ember-graph/util/string';

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
export default {

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
	getDatabase: abstractMethod('getDatabase'),

	/**
	 * Store the updated version of the database in the storage location.
	 *
	 * @method setDatabase
	 * @param {JSON} db
	 * @return {Promise} Resolves or rejects based on saving success (resolves to current DB)
	 * @protected
	 * @for EmberGraphAdapter
	 */
	setDatabase: abstractMethod('saveDatabase'),

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
	databaseHasRecord: function(typeKey, id, db) {
		try {
			return (!!db.records[typeKey][id]);
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
	getRecordFromDatabase: function(typeKey, id, db) {
		var model = this.get('store').modelFor(typeKey);
		var json = Ember.copy(db.records[typeKey][id], true);
		json.id = id;
		json.links = {};

		db.relationships.forEach(function(relationship) {
			var meta;

			if (relationship.t1 === typeKey && relationship.i1 === id && relationship.n1 !== null) {
				meta = model.metaForRelationship(relationship.n1);

				if (meta.kind === Model.HAS_ONE_KEY) {
					json.links[relationship.n1] = { type: relationship.t2, id: relationship.i2 };
				} else {
					json.links[relationship.n1] = json.links[relationship.n1] || [];
					json.links[relationship.n1].push({ type: relationship.t2, id: relationship.i2 });
				}
			} else if (relationship.t2 === typeKey && relationship.i2 === id && relationship.n2 !== null) {
				meta = model.metaForRelationship(relationship.n2);

				if (meta.kind === Model.HAS_ONE_KEY) {
					json.links[relationship.n2] = { type: relationship.t1, id: relationship.i1 };
				} else {
					json.links[relationship.n2] = json.links[relationship.n2] || [];
					json.links[relationship.n2].push({ type: relationship.t1, id: relationship.i1 });
				}
			}
		});

		model.eachRelationship(function(name, meta) {
			if (!json.links[name]) {
				if (meta.kind === Model.HAS_ONE_KEY) {
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
	putRecordInDatabase: function(typeKey, id, json, db) {
		var model = this.get('store').modelFor(typeKey);

		db.records[typeKey] = db.records[typeKey] || {};
		db.records[typeKey][id] = {};

		model.eachAttribute(function(name, meta) {
			db.records[typeKey][id][name] = json[name];
		});

		model.eachRelationship(function(name, meta) {
			if (meta.kind === Model.HAS_ONE_KEY) {
				if (json.links[name]) {
					var relationship = {
						t1: typeKey, i1: id, n1: name,
						t2: json.links[name].type, i2: json.links[name].id, n2: meta.inverse
					};

					db = this.setHasOneRelationshipInDatabase(relationship, db);
				}
			} else {
				json.links[name].forEach(function(value) {
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
	applyChangesToDatabase: function(typeKey, id, changes, db) {
		var model = this.get('store').modelFor(typeKey);

		changes.forEach(function(change) {
			switch (change.op) {
				case 'replace':
					if (startsWith(change.path, '/links/')) {
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
	addHasManyRelationshipToDatabase: function(relationship, db) {
		var relationships = this.getRelationshipsFor(relationship.t1, relationship.i1, relationship.n1, db);

		var connected = relationships.filter(function(r) {
			return (relationship.t2 === r.t2 && relationship.i2 === r.i2 && relationship.n2 === r.n2);
		});

		if (connected.length > 0) {
			return db;
		}

		if (relationship.n2) {
			var inverseModel = this.get('store').modelFor(relationship.t2);
			var inverseMeta = inverseModel.metaForRelationship(relationship.n2);

			if (inverseMeta.kind === Model.HAS_ONE_KEY) {
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
	removeHasManyRelationshipFromDatabase: function(relationship, db) {
		db.relationships = db.relationships.filter(function(r) {
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
	setHasOneRelationshipInDatabase: function(relationship, db) {
		db = this.clearHasOneRelationshipInDatabase(relationship.t1, relationship.i1, relationship.n1, db);

		if (relationship.n2) {
			var inverseModel = this.get('store').modelFor(relationship.t2);
			var inverseMeta = inverseModel.metaForRelationship(relationship.n2);

			if (inverseMeta.kind === Model.HAS_ONE_KEY) {
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
	clearHasOneRelationshipInDatabase: function(typeKey, id, name, db) {
		var relationships = this.getRelationshipsFor(typeKey, id, name, db);

		relationships.forEach(function(relationship) {
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
	getRelationshipsFor: function(typeKey, id, name, db) {
		return db.relationships.filter(function(relationship) {
			return ((relationship.t1 === typeKey && relationship.i1 === id && relationship.n1 === name) ||
				(relationship.t2 === typeKey && relationship.i2 === id && relationship.n2 === name));
		});
	}

};