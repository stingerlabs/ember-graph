var BELONGS_TO_KEY = Eg.Model.BELONGS_TO_KEY = 'belongsTo';
var HAS_MANY_KEY = Eg.Model.HAS_MANY_KEY = 'hasMany';

var disallowedRelationshipNames = new Em.Set(['id', 'type']);

Eg.hasMany = function(options) {
	Eg.debug.assert('Your relationship must specify a relatedType.', typeof options.relatedType === 'string');
	Eg.debug.assert('Your relationship must specify an inverse relationship.',
		options.inverse === null || typeof options.inverse === 'string');

	var meta = {
		isRelationship: true,
		kind: HAS_MANY_KEY,
		isRequired: options.isRequired !== false,
		defaultValue: options.defaultValue || [],
		relatedType: options.relatedType,
		inverse: options.inverse,
		readOnly: options.readOnly === true
	};

	var relationship = function(key, value) {

	}.property().meta(meta);

	return (meta.readOnly ? relationship.readOnly() : relationship);
};

Eg.belongsTo = function(options) {
	Eg.debug.assert('Your relationship must specify a relatedType.', typeof options.relatedType === 'string');
	Eg.debug.assert('Your relationship must specify an inverse relationship.',
		options.inverse === null || typeof options.inverse === 'string');

	var meta = {
		isRelationship: true,
		kind: BELONGS_TO_KEY,
		isRequired: options.isRequired !== false,
		defaultValue: options.defaultValue || null,
		relatedType: options.relatedType,
		inverse: options.inverse,
		readOnly: options.readOnly === true
	};

	var relationship = function(key, value) {

	}.property().meta(meta);

	return (meta.readOnly ? relationship.readOnly() : relationship);
};

Eg.Model.reopenClass({

	/**
	 * @static
	 */
	relationships: function() {
		var relationships = new Em.Set();

		this.eachComputedProperty(function(name, meta) {
			if (meta.isRelationship) {
				Eg.debug.assert('The ' + name + ' cannot be used as a relationship name.',
					!disallowedRelationshipNames.contains(name));

				relationships.addObject(name);
			}
		});

		return relationships;
	}.property(),

	/**
	 * Just a more semantic alias for `metaForProperty`
	 * @alias metaForProperty
	 */
	metaForRelationship: Em.aliasMethod('metaForProperty'),

	/**
	 * @param name Name of property
	 * @returns {Boolean} True if relationship, false otherwise
	 * @static
	 */
	isRelationship: function(name) {
		return Em.get(this, 'relationships').contains(name);
	},

	/**
	 * @param name The name of the relationships
	 * @returns {String} HAS_MANY_KEY or BELONGS_TO_KEY
	 */
	relationshipKind: function(name) {
		return this.metaForProperty(name).kind;
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
	 * Relationships that have been saved to the server
	 * that are currently connected to this record.
	 *
	 * @type {Object.<String, Relationship>}
	 */
	_serverRelationships: null,

	/**
	 * Relationships that have been saved to the server, but aren't currently
	 * connected to this record and are scheduled for deletion on the next save.
	 *
	 * @type {Object.<String, Relationship>}
	 */
	_deletedRelationships: null,

	/**
	 * Relationships that have been created on the client and haven't been
	 * saved to the server yet. Relationships from here that are disconnected
	 * are deleted completely rather than queued for deletion.
	 *
	 * @type {Object.<String, Relationship>}
	 */
	_clientRelationships: null,

	/**
	 * Watches the client side attributes for changes and detects if there are
	 * any dirty attributes based on how many client attributes differ from
	 * the server attributes.
	 */
	_areRelationshipsDirty: function() {
		var client = Em.keys(this.get('_clientRelationships')).length > 0;
		var deleted = Em.keys(this.get('_deletedRelationships')).length > 0;

		return client || deleted;
	}.property(),

	/**
	 * Loads relationships from the server.
	 *
	 * @param json The JSON with properties to load
	 * @param merge False if the object is just created, false if the object is being reloaded
	 * @private
	 */
	_loadRelationships: function(json, merge) {
		if (!merge) {
			this.set('_serverRelationships', {});
			this.set('_clientRelationships', {});
			this.set('_deletedRelationships', {});
		}
	},

	/**
	 * @returns {Object} Keys are relationship names, values are arrays with [oldVal, newVal]
	 */
	changedRelationships: function() {

	},

	/**
	 * Resets all relationship changes to last known server relationships.
	 */
	rollbackRelationships: function() {

	},

	/**
	 * A convenience method to add an item to a hasMany relationship. This will
	 * ensure that all of the proper observers are notified of the change.
	 *
	 * @param {String} relationship The relationship to modify
	 * @param {String} id The ID to add to the relationship
	 * @param {Number} index The place in the array to add the ID. Defaults to the end
	 */
	addToRelationship: function(relationship, id, index) {

	},

	/**
	 * A convenience method to remove an item from a hasMany relationship. This will
	 * ensure that all of the proper observers are notified of the change.
	 *
	 * @param {String} relationship The relationship to modify
	 * @param {String} id The ID to add to the relationship
	 */
	removeFromRelationship: function(relationship, id) {

	},

	setBelongsTo: function(relationship, id) {
		if (id === null) {
			return this.clearBelongsTo(relationship);
		}
	},

	clearBelongsTo: function(relationship) {

	},

	/**
	 * Loads a relationship and returns a promise. Will resolve to the models when
	 * the store fetches the records from the server or the cache. The model must
	 * be loaded into a store before this method will work.
	 *
	 * @param {String} name The name of the relationship
	 * @return {PromiseObject|PromiseArray}
	 */
	loadRelationship: function(name) {
		// TODO: Should be bind this to the relationship?
		// If we don't, they could become out of sync. (Is that so bad?)
		// If we do, we could end up loading records that we don't need to,
		// which is why we moved from Ember-Data in the first place.
	}
});