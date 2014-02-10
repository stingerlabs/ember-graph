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
		Eg.debug.assert('You can\'t set relationships directly.', value === undefined);

		var server = Eg.util.values(this.get('_serverRelationships'));
		var client = Eg.util.values(this.get('_clientRelationships'));
		var relationships = server.concat(client);

		var found = [];
		for (var i = 0; i < relationships.length; i = i + 1) {
			if (relationships[i].relationshipName(this) === key) {
				found.push(relationships[i].otherId(this));
			}
		}

		return new Em.Set(found);
	}.property('_serverRelationships', '_clientRelationships').meta(meta);

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
		Eg.debug.assert('You can\'t set relationships directly.', value === undefined);

		var server = Eg.util.values(this.get('_serverRelationships'));
		var client = Eg.util.values(this.get('_clientRelationships'));
		var relationships = server.concat(client);

		for (var i = 0; i < relationships.length; i = i + 1) {
			if (relationships[i].relationshipName(this) === key) {
				return relationships[i].otherId(this);
			}
		}

		return null;
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
	 * @param {Function} callback Function that takes `name` and `meta` parameters
	 * @param {*} [binding] Object to use as `this`
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
	}.property('_clientRelationships', '_deletedRelationships'),

	/**
	 * Gets all relationships currently linked to this record.
	 *
	 * @returns {Relationship[]}
	 * @private
	 */
	_getAllRelationships: function() {
		var server = Eg.util.values(this.get('_serverRelationships'));
		var client = Eg.util.values(this.get('_clientRelationships'));
		var deleted = Eg.util.values(this.get('_deletedRelationships'));

		return server.concat(client.concat(deleted));
	},

	/**
	 * Loads relationships from the server. Completely replaces
	 * the current relationships with the given ones.
	 *
	 * @param json The JSON with properties to load
	 * @private
	 */
	_loadRelationships: function(json) {
		// TODO: Don't delete client side relationships
		var store = this.get('store');

		this.constructor.eachRelationship(function(name, meta) {
			if (meta.isRequired && json[name] === undefined) {
				throw new Error('You left out the required \'' + name + '\' relationship.');
			}

			json[name] = json[name] || meta.defaultValue;

			if (meta.kind === HAS_MANY_KEY) {
				var currentSet = new Em.Set();
				var givenSet = new Em.Set(json[name]);

				this._relationshipsForName(name).forEach(function(relationship) {
					var id = relationship.otherId(this);
					currentSet.addObject(id);

					if (givenSet.contains(id)) {
						if (relationship.isNew()) {
							store._changeRelationshipState(relationship.get('id'), 'saved');
						}
					} else {
						store._deleteRelationship(relationship.get('id'));
					}
				}, this);

				givenSet.forEach(function(id) {
					if (currentSet.contains(id)) {
						return;
					}

					store._createRelationship(this.typeKey, name,
						this.get('id'), meta.relatedType, meta.inverse, id, true);
				}, this);
			} else {
				var current = this.get(name);
				if (current === json[name]) {
					return;
				}

				if (current !== null) {
					store._deleteRelationship(Em.get(this._findLinkTo(name, current), 'id'));
				}

				if (json[name] !== null) {
					store._createRelationship(this.typeKey, name,
						this.get('id'), meta.relatedType, meta.inverse, json[name], true);
				}
			}
		}, this);
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
	 */
	addToRelationship: function(relationship, id) {
		if (this._isLinkedTo(relationship, id)) {
			return;
		}

		var meta = this.constructor.metaForRelationship(relationship);

		this.get('store')._createRelationship(this.typeKey, relationship,
			this.get('id'), meta.relatedType, meta.inverse, id, false);
	},

	/**
	 * A convenience method to remove an item from a hasMany relationship. This will
	 * ensure that all of the proper observers are notified of the change.
	 *
	 * @param {String} relationship The relationship to modify
	 * @param {String} id The ID to add to the relationship
	 */
	removeFromRelationship: function(relationship, id) {
		var r = this._findLinkTo(relationship, id);

		if (r !== null) {
			this.get('store')._deleteRelationship(r.get('id'));
		}
	},

	setBelongsTo: function(relationship, id) {
		var current = this.get(relationship);
		if (current === id) {
			return;
		}

		this.clearBelongsTo(relationship);

		if (id === null) {
			return;
		}

		if (id === null) {
			return this.clearBelongsTo(relationship);
		}

		var meta = this.constructor.metaForRelationship(relationship);
		this.get('store')._createRelationship(this.typeKey, relationship,
			this.get('id'), meta.relatedType, meta.inverse, id, false);
	},

	clearBelongsTo: function(relationship) {
		var current = this.get(relationship);

		if (current !== null) {
			var r = this._findLinkTo(relationship, current);

			if (r !== null) {
				this.get('store')._deleteRelationship(r.get('id'));
			}
		}
	},

	/**
	 * If this record is linked to the given record via the given ID, this returns
	 * the relationship that links the two. If they aren't linked, it returns null.
	 *
	 * @param {String} relationship
	 * @param {String} id
	 * @returns {Relationship}
	 * @private
	 */
	_findLinkTo: function(relationship, id) {
		var relationships = this._getAllRelationships();
		for (var i = 0; i < relationships.length; i = i + 1) {
			if (relationships[i].relationshipName(this) === relationship && relationships[i].otherId(this) === id) {
				return relationships[i];
			}
		}

		return null;
	},

	/**
	 * Determines if this record is linked to the given ID via the given relationship.
	 * This will search all relationships: saved, deleted and new
	 *
	 * @param {String} relationship
	 * @param {String} id
	 * @returns {Boolean}
	 */
	_isLinkedTo: function(relationship, id) {
		return this._findLinkTo(relationship, id) !== null;
	},

	/**
	 * Given a relationship name, returns all current relationships associated with that name.
	 *
	 * @param {String} relationship
	 * @returns {Relationship[]}
	 * @private
	 */
	_relationshipsForName: function(relationship) {
		var current = this._getAllRelationships();

		return current.filter(function(r) {
			return (r.relationshipName(this) === relationship);
		}, this);
	},

	/**
	 * Connects the given relationship blindly. Will not check to see if the
	 * relationship is already connected, that should have done beforehand.
	 * Relies on the relationship state to find the relationship.
	 *
	 * @param {Relationship} relationship
	 * @private
	 */
	_connectRelationship: function(relationship) {
		var hash = this._stateToHash(relationship.get('state'));
		this.set(hash + '.' + relationship.get('id'), relationship);
		this.notifyPropertyChange(hash);
	},

	/**
	 * Disconnects the relationship from this record.
	 * Relies on the relationship state to find the relationship.
	 *
	 * @param {Relationship} relationship
	 * @private
	 */
	_disconnectRelationship: function(relationship) {
		var hash = this._stateToHash(relationship.get('state'));
		delete this.get(hash)[relationship.get('id')];
		this.notifyPropertyChange(hash);
	},

	/**
	 * Given the state of a relationship, returns the hash it should be in.
	 *
	 * @param {String} state
	 * @returns {String}
	 * @private
	 */
	_stateToHash: function(state) {
		switch (state) {
			case 'new':
				return '_clientRelationships';
			case 'saved':
				return '_serverRelationships';
			case 'deleted':
				return '_deletedRelationships';
			default:
				throw new Error('The given state was invalid.');
		}
	}
});