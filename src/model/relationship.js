var HAS_ONE_KEY = EG.Model.HAS_ONE_KEY = 'hasOne';
var HAS_MANY_KEY = EG.Model.HAS_MANY_KEY = 'hasMany';

var disallowedRelationshipNames = new Em.Set(['id', 'type', 'content']);

var createRelationship = function(name, kind, options) {
	Em.assert('Your relationship must specify a relatedType.', Em.typeOf(options.relatedType) === 'string');
	Em.assert('Your relationship must specify an inverse relationship.',
		options.inverse === null || Em.typeOf(options.inverse) === 'string');

	var meta = {
		isRelationship: false,
		kind: kind,
		isRequired: (options.hasOwnProperty('defaultValue') ? false : options.isRequired !== false),
		defaultValue: options.defaultValue || (kind === HAS_MANY_KEY ? [] : null),
		relatedType: options.relatedType,
		inverse: options.inverse,
		readOnly: options.readOnly === true
	};

	Em.assert('The default value for a hasOne relationship must be a string or null, and the default value' +
			'for a hasMany relationship must be an array.',
			(kind === HAS_MANY_KEY && Em.isArray(meta.defaultValue)) ||
			(kind === HAS_ONE_KEY && (meta.defaultValue === null || Em.typeOf(meta.defaultValue) === 'string')));

	return Em.computed(function(key) {
		return undefined;
	}).property().meta(meta).readOnly();
};

EG.Model.reopenClass({

	/**
	 * A set of all of the relationship names for this model.
	 *
	 * @property relationships
	 * @for Model
	 * @type Set
	 * @static
	 * @readOnly
	 */
	relationships: Em.computed(function() {
		var relationships = new Em.Set();

		this.eachComputedProperty(function(name, meta) {
			if (meta.isRelationship) {
				Em.assert('`' + name + '` cannot be used as a relationship name.',
					!disallowedRelationshipNames.contains(name));
				Em.assert('Relationship names must start with a lowercase letter.', name[0].match(/[a-z]/g));

				relationships.addObject(name);
			}
		});

		return relationships;
	}).property(),

	/**
	 * Fetch the metadata for a relationship property.
	 *
	 * @method metaForRelationship
	 * @for Model
	 * @param {String} relationshipName
	 * @return {Object}
	 * @static
	 */
	metaForRelationship: Em.aliasMethod('metaForProperty'),

	/**
	 * Determines the kind (multiplicity) of the given relationship.
	 *
	 * @method relationshipKind
	 * @for Model
	 * @param {String} name
	 * @returns {String} `hasMany` or `hasOne`
	 * @static
	 */
	relationshipKind: function(name) {
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
	eachRelationship: function(callback, binding) {
		this.eachComputedProperty(function(name, meta) {
			if (meta.isRelationship) {
				callback.call(binding, name, meta);
			}
		});
	},

	declareRelationships: function(relationships) {

	}
});

EG.Model.reopen({

	loadRelationships: function(json) {

	},

	areRelationshipsDirty: Em.computed(function() {
		return false;
	}).property(),

	changedRelationships: function() {

	},

	rollbackRelationships: function() {

	},

	addToRelationship: function(relationshipName, id) {

	},

	removeFromRelationship: function(relationshipName, id) {

	},

	setHasOneRelationship: function(relationshipName, id) {

	},

	clearHasOneRelationship: function(relationshipName) {

	}
});