/**
 * @class FixtureAdapter
 */
EG.FixtureAdapter = EG.SynchronousAdapter.extend({

	/**
	 * Gets a record from the appropriate fixtures array.
	 *
	 * @param {String} typeKey
	 * @param {String} id
	 * @return {Object} Serialized JSON Object
	 * @private
	 */
	_getRecord: function(typeKey, id) {
		var model = this.get('store').modelForType(typeKey);
		model.FIXTURES = model.FIXTURES || [];

		for (var i = 0; i < model.FIXTURES.length; i+=1) {
			if (model.FIXTURES[i].id === id) {
				return this._fixtureToJson(typeKey, model.FIXTURES[i]);
			}
		}

		return null;
	},

	/**
	 * Gets all fixtures of the specified type.
	 *
	 * @param {String} typeKey
	 * @returns {Object[]} Serialized JSON Objects
	 * @private
	 */
	_getRecords: function(typeKey) {
		return (this.get('store').modelForType(typeKey).FIXTURES || []).map(function(fixture) {
			return this._fixtureToJson(typeKey, fixture);
		}, this);
	},

	/**
	 * Puts a record in the appropriate fixtures array.
	 *
	 * @param {Model} record
	 * @private
	 */
	_setRecord: function(record) {
		var fixture = this._recordToFixture(record);
		var model = record.constructor;
		model.FIXTURES = model.FIXTURES || [];

		for (var i = 0; i < model.FIXTURES.length; i+=1) {
			if (model.FIXTURES[i].id === fixture.id) {
				model.FIXTURES[i] = fixture;
				return;
			}
		}

		model.FIXTURES.push(fixture);
	},

	/**
	 * Deletes a record from the appropriate fixtures array.
	 *
	 * @param {String} typeKey
	 * @param {String} id
	 * @private
	 */
	_deleteRecord: function(typeKey, id) {
		var model = this.get('store').modelForType(typeKey);
		model.FIXTURES = model.FIXTURES || [];

		for (var i = 0; i < model.FIXTURES.length; i+=1) {
			if (model.FIXTURES[i].id === id) {
				model.FIXTURES.splice(i, 1);
				return;
			}
		}
	},

	_fixtureToJson: function(typeKey, fixture) {
		var model = this.get('store').modelForType(typeKey);
		var json = {
			id: fixture.id,
			links: {}
		};

		model.eachAttribute(function(name, meta) {
			var type = this.get('store').attributeTypeFor(meta.type);
			json[name] = type.serialize(fixture[name]);
		}, this);

		model.eachRelationship(function(name, meta) {
			var val = fixture[name];

			if (meta.kind === EG.Model.HAS_MANY_KEY) {
				json.links[name] = val.filter(function(id) {
					return (!EG.Model.isTemporaryId(id));
				});
			} else {
				if (val === null || EG.Model.isTemporaryId(val)) {
					json.links[name] = null;
				} else {
					json.links[name] = val;
				}
			}
		});

		return json;
	},

	_recordToFixture: function(record) {
		var fixture = {
			id: record.get('id')
		};

		record.constructor.eachAttribute(function(name, meta) {
			fixture[name] = record.get(name);
		});

		record.constructor.eachRelationship(function(name, meta) {
			fixture[name] = record.get('_' + name);

			if (fixture[name] && fixture[name].toArray) {
				fixture[name] = fixture[name].toArray();
			}
		});

		return fixture;
	}
});