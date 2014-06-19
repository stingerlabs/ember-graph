var map = Em.ArrayPolyfills.map;
var forEach = Em.ArrayPolyfills.forEach;

var HAS_ONE_KEY = EG.Model.HAS_ONE_KEY = 'hasOne';
var HAS_MANY_KEY = EG.Model.HAS_MANY_KEY = 'hasMany';

var disallowedRelationshipNames = new Em.Set(['id', 'type', 'content', 'length']);

var createRelationship = function(name, kind, options) {
	Em.assert('Invalid relatedType', Em.typeOf(options.relatedType) === 'string');
	Em.assert('Invalid inverse', options.inverse === null || Em.typeOf(options.inverse) === 'string');

	var meta = {
		isRelationship: false, // the 'real' relationship (without _) is the relationship
		kind: kind,
		isRequired: (options.hasOwnProperty('defaultValue') ? false : options.isRequired !== false),
		defaultValue: options.defaultValue || (kind === HAS_MANY_KEY ? [] : null),
		relatedType: options.relatedType,
		inverse: options.inverse,
		readOnly: options.readOnly === true
	};

	Em.assert('defaultValue for hasMany must be an array.', meta.kind === HAS_ONE_KEY || Em.isArray(meta.defaultValue));
	Em.assert('defaultValue for hasOne must be null or a string.',
			meta.kind === HAS_MANY_KEY || meta.defaultValue === null || Em.typeOf(meta.defaultValue) === 'string');

	if (meta.kind === HAS_MANY_KEY) {
		return Em.computed(function(key) {
			return this.hasManyValue(key.substring(1), false);
		}).property('relationships.client.' + name, 'relationships.deleted.' + name).meta(meta).readOnly();
	} else {
		return Em.computed(function(key) {
			return this.hasOneValue(key.substring(1), false);
		}).property('relationships.client.' + name, 'relationships.deleted.' + name).meta(meta).readOnly();
	}
};

EG.Model.reopenClass({

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

	areRelationshipsDirty: Em.computed(function() {
		return this.get('relationships.client.size') > 0 || this.get('relationships.deleted.size' > 0);
	}).property('relationships.client.length', 'relationships.deleted.length'),

	changedRelationships: function() {
		var changes = {};

		this.constructor.eachRelationship(function(name, meta) {
			var oldVal, newVal;

			if (meta.kind === HAS_MANY_KEY) {
				oldVal = map.call(this.hasManyValue(name, true), function(value) {
					return value.type + '.' + value.id;
				});

				newVal = map.call(this.hasManyValue(name, false), function(value) {
					return value.type + '.' + value.id;
				});

				if (!EG.arrayContentsEqual(oldVal, newVal)) {
					changes[name] = [oldVal, newVal];
				}
			} else {
				oldVal = this.hasOneValue(name, true);
				newVal = this.hasOneValue(name, false);

				if (oldVal !== newVal) {
					changes[name] = [oldVal, newVal];
				}
			}
		}, this);

		return changes;
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

EG.Model.reopen({

	relationships: null,

	initializeRelationships: Em.on('init', function() {
		this.set('relationships', new EG.RelationshipStore());
	}),

	loadRelationships: function(json) {

	},

	hasOneValue: function(name, server) {
		var relationships;

		if (server) {
			relationships = this.get('relationships').getServerRelationships(name);
		} else {
			relationships = this.get('relationships').getCurrentRelationships(name);
		}

		if (relationships.length <= 0) {
			return null;
		}

		return {
			id: relationships[0].otherId(this),
			type: relationships[0].otherType(this)
		};
	},

	hasManyValue: function(name, server) {
		var relationships;

		if (server) {
			relationships = this.get('relationships').getServerRelationships(name);
		} else {
			relationships = this.get('relationships').getCurrentRelationships(name);
		}

		return map.call(relationships, function(relationship) {
			return {
				id: relationship.otherId(this),
				type: relationship.otherType(this)
			};
		}, this);
	}

});