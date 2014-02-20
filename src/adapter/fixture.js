/**
 * @class FixtureAdapter
 */
EG.FixtureAdapter = EG.SynchronousAdapter.extend({

	/**
	 * Gets a record from the appropriate fixtures array.
	 *
	 * @param {String} typeKey
	 * @param {String} id
	 * @return {Object}
	 * @private
	 */
	_getRecord: function(typeKey, id) {
		var model = this.get('store').modelForType(typeKey);
		model.FIXTURES = model.FIXTURES || [];

		for (var i = 0; i < model.FIXTURES.length; i+=1) {
			if (model.FIXTURES[i].id === id) {
				return model.FIXTURES[i];
			}
		}

		return null;
	},

	/**
	 * Gets all fixtures of the specified type.
	 *
	 * @param {String} typeKey
	 * @returns {Array}
	 * @private
	 */
	_getRecords: function(typeKey) {
		return this.get('store').modelForType(typeKey).FIXTURES || [];
	},

	/**
	 * Puts a record in the appropriate fixtures array.
	 *
	 * @param {String} typeKey
	 * @param {Object} json
	 * @private
	 */
	_setRecord: function(typeKey, json) {
		var model = this.get('store').modelForType(typeKey);
		model.FIXTURES = model.FIXTURES || [];

		for (var i = 0; i < model.FIXTURES.length; i+=1) {
			if (model.FIXTURES[i].id === json.id) {
				model.FIXTURES[i] = json;
				return;
			}
		}

		model.FIXTURES.push(json);
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
	}
});