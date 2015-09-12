import Ember from 'ember';

import { pluralize } from 'ember-graph/util/inflector';
import { generateUUID } from 'ember-graph/util/util';


export default {

	/**
	 * @method serverCreateRecord
	 * @param {String} typeKey
	 * @param {JSON} json
	 * @return {Promise}
	 * @protected
	 * @for EmberGraphAdapter
	 */
	serverCreateRecord: function(typeKey, json) {
		let newId = null;

		return this.getDatabase().then((db) => {
			newId = this.generateIdForRecord(typeKey, json, db);

			const modifiedDb = this.putRecordInDatabase(typeKey, newId, json[pluralize(typeKey)][0], db);
			return this.setDatabase(modifiedDb);
		}).then((db) => {
			const record = this.getRecordFromDatabase(typeKey, newId, db);
			return {
				[pluralize(typeKey)]: [record]
			};
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
	serverFindRecord: function(typeKey, id) {
		var _this = this;

		return this.getDatabase().then(function(db) {
			if (Ember.get(db, 'records.' + typeKey + '.' + id)) {
				var payload = {};
				payload[pluralize(typeKey)] = [_this.getRecordFromDatabase(typeKey, id, db)];
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
	serverFindMany: function(typeKey, ids) {
		var _this = this;

		return this.getDatabase().then(function(db) {
			var records = ids.map(function(id) {
				if (Ember.get(db, 'records.' + typeKey + '.' + id)) {
					return _this.getRecordFromDatabase(typeKey, id, db);
				} else {
					throw { status: 404, typeKey: typeKey, id: id };
				}
			});

			var payload = {};
			payload[pluralize(typeKey)] = records;
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
	serverFindAll: function(typeKey) {
		var _this = this;

		return this.getDatabase().then(function(db) {
			var records = Object.keys(db.records[typeKey] || {}).map(function(id) {
				return _this.getRecordFromDatabase(typeKey, id, db);
			});

			var payload = {};
			payload[pluralize(typeKey)] = records;
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
	serverUpdateRecord: function(typeKey, id, changes) {
		return this.getDatabase().then((db) => {
			const modifiedDb = this.applyChangesToDatabase(typeKey, id, changes, db);
			return this.setDatabase(modifiedDb);
		}).then((db) => {
			return {
				[pluralize(typeKey)]: [this.getRecordFromDatabase(typeKey, id, db)]
			};
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
	serverDeleteRecord: function(typeKey, id) {
		return this.getDatabase().then((db) => {
			if (db.records[typeKey]) {
				delete db.records[typeKey][id];
			}

			db.relationships = db.relationships.filter((r) => {
				return !((r.t1 === typeKey && r.i1 === id) || (r.t2 === typeKey && r.i2 === id));
			});

			return this.setDatabase(db).then(() => {
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
	generateIdForRecord: function(typeKey, json, db) {
		return generateUUID();
	}

};