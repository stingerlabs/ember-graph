var map = Em.ArrayPolyfills.map;
var filter = Em.ArrayPolyfills.filter;

EG.EmberGraphAdapter.reopen({

	/**
	 * @method serverCreateRecord
	 * @param {String} typeKey
	 * @param {JSON} json
	 * @return {Promise}
	 * @protected
	 * @for EmberGraphAdapter
	 */
	serverCreateRecord: function(typeKey, json) {
		var _this = this;
		var newId = null;

		return this.getDatabase().then(function(db) {
			newId = _this.generateIdForRecord(typeKey, json, db);
			db = _this.putRecordInDatabase(typeKey, newId, json[EG.String.pluralize(typeKey)][0], db);
			return _this.setDatabase(db);
		}).then(function(db) {
			var record = _this.getRecordFromDatabase(typeKey, newId, db);
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
	 * @for EmberGraphAdapter
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
	 * @for EmberGraphAdapter
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
	 * @for EmberGraphAdapter
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
	 * @return {Promise} Resolves to update record payload
	 * @protected
	 * @for EmberGraphAdapter
	 */
	serverUpdateRecord: function(typeKey, id, changes) {
		var _this = this;

		return this.getDatabase().then(function(db) {
			db = _this.applyChangesToDatabase(typeKey, id, changes, db);
			return _this.setDatabase(db);
		}).then(function(db) {
			var payload = {};
			payload[EG.String.pluralize(typeKey)] = [_this.getRecordFromDatabase(typeKey, id, db)];
			return payload;
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
		return EG.generateUUID();
	}

});