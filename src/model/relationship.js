var disallowedRelationshipNames = new Em.Set(['id', 'type']);

Eg.hasMany = function() {

};

Eg.belongsTo = function() {

};

Eg.hasLinks = function() {

};

Eg.isLinkedTo = function() {

};

Eg.Model.reopenClass({

	/**
	 * @static
	 */
	relationships: function() {
		var relationships = new Em.Set();

		this.eachComputedProperty(function(name, meta) {
			if (meta.isRelationship) {
				Em.assert('The ' + name + ' cannot be used as a relationship name.',
					!disallowedAttributeNames.contains(name));

				relationships.addObject(name);
			}
		});

		return relationships;
	}.property(),

	/**
	 * @param name Name of property
	 * @returns {Boolean} True if relationship, false otherwise
	 * @static
	 */
	isRelationship: function(name) {
		return Em.get(this, 'relationships').contains(name);
	},

	/**
	 * Calls the callback for each relationship defined on the model.
	 *
	 * @param callback Function that takes `name` and `meta` parameters
	 * @param binding Object to use as `this`
	 * @static
	 */
	eachRelationship: function(callback, binding) {
		this.eachComputedProperty(function(name, meta) {
			if (meta.isRelationship) {
				callback.call(binding, name, meta);
			}
		});
	}
});

Eg.Model.reopen({
	/**
	 * Represents the latest set of relationships from the server. The only way these
	 * can be updated is if the server sends over new JSON through an operation,
	 * or a save operation successfully completes, in which case `_serverRelationships`
	 * will be copied into this.
	 *
	 * @private
	 */
	_serverRelationships: null,

	/**
	 * Represents the state of the object on the client. These are likely different
	 * from what the server has and are completely temporary until saved.
	 *
	 * @private
	 */
	_clientRelationships: null,

	/**
	 * @returns {Object} Keys are relationship names, values are arrays with [oldVal, newVal]
	 */
	changedRelationships: function() {
		return {};
	},

	/**
	 * Resets all relationship changes to last known server attributes.
	 */
	rollbackRelationships: function() {

	}
});