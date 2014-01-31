var BELONGS_TO_KEY = Eg.Model.BELONGS_TO_KEY = 'belongsTo';
var HAS_MANY_KEY = Eg.Model.HAS_MANY_KEY = 'hasMany';

var disallowedRelationshipNames = new Em.Set(['id', 'type']);

Eg.hasMany = function(options) {
	var meta = {
		isRelationship: true,
		kind: HAS_MANY_KEY,
		isRequired: options.isRequired !== false,
		defaultValue: options.defaultValue || [],
		relatedType: options.relatedType,
		readOnly: options.readOnly === true
	};

	var relationship = function(key, value) {
		var client = this.get('_clientRelationships.' + key);
		var current = (client === undefined ? this.get('_serverRelationships.' + key) : client);

		if (arguments.length > 1) {
			if (!Em.isArray(value)) {
				Eg.debug.warn('\'' + value + '\' is not valid hasMany relationship value.');
				return current;
			}

			if (!current.isEqual(value)) {
				// TODO: Mark as dirty
				this.set('_clientRelationships.' + key, new Eg.OrderedStringSet(value));
			}

			return value;
		}

		return current;
	}.property('_serverRelationships', '_clientRelationships').meta(meta);

	return (meta.readOnly ? relationship.readOnly() : relationship);
};

Eg.belongsTo = function(options) {
	var meta = {
		isRelationship: true,
		kind: BELONGS_TO_KEY,
		isRequired: options.isRequired !== false,
		defaultValue: options.defaultValue || null,
		relatedType: options.relatedType,
		readOnly: options.readOnly === true
	};

	var relationship = function(key, value) {
		var client = this.get('_clientRelationships.' + key);
		var current = (client === undefined ? this.get('_serverRelationships.' + key) : client);

		if (arguments.length > 1) {
			if (value !== null && typeof value !== 'string') {
				Eg.debug.warn('\'' + value + '\' is not valid belongsTo relationship value.');
				return current;
			}

			if (value !== current) {
				// TODO: Mark as dirty
				this.set('_clientRelationships.' + key, value);
			}

			return value;
		}

		return current;
	}.property('_serverRelationships', '_clientRelationships').meta(meta);

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
	 * Loads relationships from the server.
	 *
	 * @param json The JSON with properties to load
	 * @param merge False if the object is just created, false if the object is being reloaded
	 * @private
	 */
	_loadRelationships: function(json, merge) {
		// TODO: If merge, alert observer

		if (!merge) {
			this.set('_serverRelationships', {});
			this.set('_clientRelationships', {});
		}

		this.constructor.eachRelationship(function(name, meta) {
			if (json.hasOwnProperty(name) || !meta.isRequired) {
				var value = json.hasOwnProperty(name) ? json[name] : meta.defaultValue;

				if (meta.kind === BELONGS_TO_KEY) {
					if (value === null || typeof value === 'string') {
						this.set('_serverRelationships.' + name, value);
					} else {
						throw new Error('The value \'' + value + '\' for relationship \'' + name + '\' is invalid.');
					}
				} else if (meta.kind === HAS_MANY_KEY) {
					if (Em.isArray(value)) {
						this.set('_serverRelationship.' + name, new Eg.OrderedStringSet(value));
					} else {
						throw new Error('The value \'' + value + '\' for relationship \'' + name + '\' is invalid.');
					}
				}
			} else if (!merge) {
				throw new Error('The given JSON doesn\'t contain the \'' + name + '\' relationship.');
			}
		}, this);
	},

	/**
	 * @returns {Object} Keys are relationship names, values are arrays with [oldVal, newVal]
	 */
	changedRelationships: function() {
		var diff = {};

		this.constructor.eachRelationship(function(name, meta) {
			var server = this.get('_serverRelationships.' + name);
			var client = this.get('_clientRelationships.' + name);

			if (client === undefined) {
				return;
			}

			if (meta.kind === BELONGS_TO_KEY) {
				if (server !== client) {
					diff[name] = [server, client];
				}
			} else if (meta.kind === HAS_MANY_KEY) {
				if (!server.isEqual(client)) {
					diff[name] = [server, client];
				}
			}
		}, this);

		return diff;
	},

	/**
	 * Resets all relationship changes to last known server relationships.
	 */
	rollbackRelationships: function() {
		this.set('_clientRelationships', {});
		this.notifyPropertyChange('_clientRelationships');
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

	}
});