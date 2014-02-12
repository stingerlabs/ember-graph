var BELONGS_TO_KEY = Eg.Model.BELONGS_TO_KEY = 'belongsTo';
var HAS_MANY_KEY = Eg.Model.HAS_MANY_KEY = 'hasMany';

var NEW_STATE = Eg.Relationship.NEW_STATE;
var SAVED_STATE = Eg.Relationship.SAVED_STATE;
var DELETED_STATE = Eg.Relationship.DELETED_STATE;

var disallowedRelationshipNames = new Em.Set(['id', 'type', 'content']);

var createRelationship = function(kind, options) {
	Eg.debug.assert('Your relationship must specify a relatedType.', typeof options.relatedType === 'string');
	Eg.debug.assert('Your relationship must specify an inverse relationship.',
		options.inverse === null || typeof options.inverse === 'string');

	var meta = {
		isRelationship: true,
		kind: kind,
		isRequired: options.isRequired !== false,
		defaultValue: options.defaultValue || (kind === HAS_MANY_KEY ? [] : null),
		relatedType: options.relatedType,
		inverse: options.inverse,
		readOnly: options.readOnly === true
	};

	return function(key, value) {
		var fun = (kind === HAS_MANY_KEY ? '_hasManyValue' : '_belongsToValue');
		return this[fun](key, false);
	}.property('_serverRelationships', '_clientRelationships').meta(meta).readOnly();
};

Eg.hasMany = function(options) {
	return createRelationship(HAS_MANY_KEY, options);
};

Eg.belongsTo = function(options) {
	return createRelationship(BELONGS_TO_KEY, options);
};

Eg.Model.reopenClass({

	/**
	 * Goes through the subclass and declares an additional property for
	 * each relationship. The properties will be capitalized and then prefixed
	 * with 'loaded'. So rather than 'projects', use 'loadedProjects'.
	 * This will return the relationship as a promise rather than in ID form.
	 *
	 * @static
	 * @private
	 */
	_declareRelationships: function() {
		this.eachRelationship(function(name, meta) {
			var obj = {};

			obj['loaded' + Eg.String.capitalize(name)] = function(key, value) {
				Eg.debug.assert('You can\'t set relationships directly.', value === undefined);
				var id = (meta.kind === HAS_MANY_KEY ? this.get(name).toArray() : this.get(name));
				return this.get('store').find(meta.relatedType, id);
			}.property(name);

			this.reopen(obj);
		}, this);
	},

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
	 * @static
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
	 * @static
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
	 * Determines the value of a belongsTo relationship, either the
	 * original value sent from the server, or the current client value.
	 *
	 * @param {String} relationship
	 * @param {Boolean} server True for original value, false for client value
	 * @returns {String}
	 * @private
	 */
	_belongsToValue: function(relationship, server) {
		var serverRelationships = Eg.util.values(this.get('_serverRelationships'));
		var otherRelationships = Eg.util.values(this.get((server ? '_deleted' : '_client') + 'Relationships'));
		var current = serverRelationships.concat(otherRelationships);

		for (var i = 0; i < current.length; i = i + 1) {
			if (current[i].relationshipName(this) === relationship) {
				return current[i].otherId(this);
			}
		}

		return null;
	},

	/**
	 * Determines the value of a hasMany relationship, either the
	 * original value sent from the server, or the current client value.
	 *
	 * @param {String} relationship
	 * @param {Boolean} server True for original value, false for client value
	 * @returns {Set}
	 * @private
	 */
	_hasManyValue: function(relationship, server) {
		var serverRelationships = Eg.util.values(this.get('_serverRelationships'));
		var otherRelationships = Eg.util.values(this.get((server ? '_deleted' : '_client') + 'Relationships'));
		var current = serverRelationships.concat(otherRelationships);

		var found = [];
		for (var i = 0; i < current.length; i = i + 1) {
			if (current[i].relationshipName(this) === relationship) {
				found.push(current[i].otherId(this));
			}
		}

		return new Em.Set(found);
	},

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
		var changed = {};

		this.constructor.eachRelationship(function(name, meta) {
			var oldVal, newVal;

			if (meta.kind === HAS_MANY_KEY) {
				oldVal = this._hasManyValue(name, true);
				newVal = this._hasManyValue(name, false);

				if (!oldVal.isEqual(newVal)) {
					changed[name] = [oldVal, newVal];
				}
			} else {
				oldVal = this._belongsToValue(name, true);
				newVal = this._belongsToValue(name, false);

				if (oldVal !== newVal) {
					changed[name] = [oldVal, newVal];
				}
			}
		}, this);

		return changed;
	},

	/**
	 * Resets all relationship changes to last known server relationships.
	 */
	rollbackRelationships: function() {
		var store = this.get('store');

		this._getAllRelationships().forEach(function(relationship) {
			switch (relationship.get('state')) {
				case NEW_STATE:
					store._deleteRelationship(relationship.get('id'));
					break;
				case SAVED_STATE:
					// NOP
					break;
				case DELETED_STATE:
					store._changeRelationshipState(relationship.get('id'), SAVED_STATE);
					break;
			}
		}, this);
	},

	/**
	 * A convenience method to add an item to a hasMany relationship. This will
	 * ensure that all of the proper observers are notified of the change.
	 *
	 * @param {String} relationship The relationship to modify
	 * @param {String} id The ID to add to the relationship
	 */
	addToRelationship: function(relationship, id) {
		var meta = this.constructor.metaForRelationship(relationship);
		Eg.debug.assert('Cannot modify a read-only relationship', meta.readOnly === false);
		if (meta.readOnly) {
			return;
		}

		var link = this._findLinkTo(relationship, id);
		if (link && (link.get('state') === NEW_STATE || link.get('state') === SAVED_STATE)) {
			return;
		}

		if (link && link.get('state') === DELETED_STATE) {
			this.get('store')._changeRelationshipState(link.get('id'), SAVED_STATE);
			return;
		}

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
		var meta = this.constructor.metaForRelationship(relationship);
		Eg.debug.assert('Cannot modify a read-only relationship', meta.readOnly === false);
		if (meta.readOnly) {
			return;
		}

		var r = this._findLinkTo(relationship, id);

		if (r !== null) {
			switch (r.get('state')) {
				case NEW_STATE:
					this.get('store')._deleteRelationship(r.get('id'));
					break;
				case SAVED_STATE:
					this.get('store')._changeRelationshipState(r.get('id'), DELETED_STATE);
					break;
				case DELETED_STATE:
					// NOP?
					break;
			}
		}
	},

	/**
	 * Sets the value of a belongsTo relationship to the given ID.
	 *
	 * @param {String} relationship
	 * @param {String} id
	 */
	setBelongsTo: function(relationship, id) {
		var meta = this.constructor.metaForRelationship(relationship);
		Eg.debug.assert('Cannot modify a read-only relationship', meta.readOnly === false);
		if (meta.readOnly) {
			return;
		}

		var link = this._findLinkTo(relationship, id);
		if (link && (link.get('state') === NEW_STATE || link.get('state') === SAVED_STATE)) {
			return;
		}

		if (link && link.get('state') === DELETED_STATE) {
			this.get('store')._changeRelationshipState(link.get('id'), SAVED_STATE);
			return;
		}

		this.clearBelongsTo(relationship);

		if (id === null) {
			return;
		}

		if (id === null) {
			this.clearBelongsTo(relationship);
			return;
		}

		this.get('store')._createRelationship(this.typeKey, relationship,
			this.get('id'), meta.relatedType, meta.inverse, id, false);
	},

	/**
	 * Sets the value of a belongsTo relationship to `null`.
	 * @param {String} relationship
	 */
	clearBelongsTo: function(relationship) {
		var meta = this.constructor.metaForRelationship(relationship);
		Eg.debug.assert('Cannot modify a read-only relationship', meta.readOnly === false);
		if (meta.readOnly) {
			return;
		}

		var current = this.get(relationship);

		if (current !== null) {
			var r = this._findLinkTo(relationship, current);

			if (r !== null) {
				switch (r.get('state')) {
					case NEW_STATE:
						this.get('store')._deleteRelationship(r.get('id'));
						break;
					case SAVED_STATE:
						this.get('store')._changeRelationshipState(r.get('id'), DELETED_STATE);
						break;
					case DELETED_STATE:
						// NOP?
						break;
				}
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
		var hash = Eg.Relationship.stateToHash(relationship.get('state'));
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
		var hash = Eg.Relationship.stateToHash(relationship.get('state'));
		delete this.get(hash)[relationship.get('id')];
		this.notifyPropertyChange(hash);
	}
});