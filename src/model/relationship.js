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

		return new Eg.OrderedStringSet(found);
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
	 * This returns a hash of relationship names to values. All known server
	 * relationships are put into the hash, including deleted ones. This will
	 * tell us which relationships already exist so we can determine which
	 * ones to add, and which ones to delete completely.
	 *
	 * @returns {Object}
	 * @private
	 */
	_serverJson: function() {
		var relationships = {};
		var deleted = Eg.util.values(this.get('_deletedRelationships'));
		var server = Eg.util.values(this.get('_serverRelationships')).concat(deleted);

		this.constructor.eachRelationship(function(name, meta) {
			relationships[name] = (meta.kind === HAS_MANY_KEY ? [] : null);
		});

		server.forEach(function(relationship) {
			var name = relationship.relationshipName(this);

			if (name === null) {
				return;
			}

			var id = relationship.otherId(this);

			if (Em.isArray(relationships[name])) {
				relationships[name].push(id);
			} else {
				relationships[name] = id;
			}
		}, this);

		return relationships;
	},

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
	 * Loads relationships from the server. Completely replaces
	 * the current relationships with the given ones.
	 *
	 * @param json The JSON with properties to load
	 * @private
	 */
	_loadRelationships: function(json) {
		var current = this._serverJson();
		this.constructor.eachRelationship(function(name, meta) {
			if (meta.isRequired && json[name] === undefined) {
				throw new Error('You left out the required \'' + name + '\' relationship.');
			}

			json[name] = json[name] || meta.defaultValue;

			if (meta.kind === HAS_MANY_KEY) {
				var currentSet = new Eg.OrderedStringSet(current[name]);
				var givenSet = new Eg.OrderedStringSet(json[name]);

				var toRemove = currentSet.subtract(givenSet);
				var toAdd = givenSet.subtract(currentSet);

				toRemove.forEach(function(id) {
					this._deleteServerRelationship(name, id);
				}, this);

				toAdd.forEach(function(id) {
					this._addServerRelationship(name, id);
				}, this);
			} else {
				if (current[name] === json[name]) {
					return;
				}

				if (current[name] !== null) {
					this._deleteServerRelationship(name, current[name]);
				}

				if (json[name] !== null) {
					this._addServerRelationship(name, json[name]);
				}
			}
		}, this);
	},

	/**
	 * Destroys the specified relationship if it's connected to this record.
	 *
	 * @param {String} name The name of the relationship which links to the record
	 * @param {String} id The ID of the record to which the relationship connects
	 * @private
	 */
	_deleteServerRelationship: function(name, id) {
		if (name === null) {
			return;
		}

		var deleted = Eg.util.values(this.get('_deletedRelationships'));
		var server = Eg.util.values(this.get('_serverRelationships')).concat(deleted);
		var relationship;

		for (var i = 0; i < server.length; i = i + 1) {
			relationship = server[i];

			if (relationship.relationshipName(this) === name && relationship.otherId(this) === id) {
				this._deleteRelationship(relationship.get('id'));
				break;
			}
		}
	},

	/**
	 * Deletes a relationships completely, disconnecting from both
	 * records and removing from the store queue if necessary.
	 *
	 * @param {String} id Relationship ID
	 * @private
	 */
	_deleteRelationship: function(id) {
		var relationship = Eg.Relationship.getRelationship(id);
		if (!relationship) {
			return;
		}

		var disconnectFromRecord = function(record) {
			var server = record.get('_serverRelationships');
			if (server.hasOwnProperty(id)) {
				delete server[id];
				record.notifyPropertyChange('_serverRelationships');
				return true;
			}

			var deleted = record.get('_deletedRelationships');
			if (deleted.hasOwnProperty(id)) {
				delete deleted[id];
				record.notifyPropertyChange('_deletedRelationships');
				return true;
			}

			var client = record.get('_clientRelationships');
			if (client.hasOwnProperty(id)) {
				delete client[id];
				record.notifyPropertyChange('_clientRelationships');
				return true;
			}

			return false;
		};

		if (disconnectFromRecord(this) === true) {
			var record = relationship.otherRecord(this);

			if (record) {
				disconnectFromRecord(record);
			} else {
				delete this.get('store._queuedRelationships')[id];
				this.get('store').notifyPropertyChange('_queuedRelationships');
			}

			Eg.Relationship.deleteRelationship(id);
		}
	},

	/**
	 * Connects this record to the specified record on the specified relationship name.
	 *
	 * @param {String} name The name of the relationship which will link to the record
	 * @param {String} id The ID of the record to connect to
	 * @private
	 */
	_addServerRelationship: function(name, id) {
		var store = this.get('store');
		var meta = this.constructor.metaForRelationship(name);
		var other = store.getRecord(meta.relatedType, id);

		var relationship = Eg.Relationship.create({
			object1: this,
			relationship1: name,
			object2: (other === null ? id : other),
			relationship2: meta.inverse,
			state: 'saved'
		});

		this.get('_serverRelationships')[relationship.get('id')] = relationship;
		this.notifyPropertyChange('_serverRelationships');

		if (other) {
			other.get('_serverRelationships')[relationship.get('id')] = relationship;
			other.notifyPropertyChange('_serverRelationships');
		} else {
			store.get('_queuedRelationships')[relationship.get('id')] = relationship;
			store.notifyPropertyChange('_queuedRelationships');
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
	 */
	addToRelationship: function(relationship, id) {

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