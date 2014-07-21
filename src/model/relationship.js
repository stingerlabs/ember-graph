var map = Em.ArrayPolyfills.map;
var reduce = Em.ArrayPolyfills.reduce;
var filter = Em.ArrayPolyfills.filter;
var forEach = Em.ArrayPolyfills.forEach;

var HAS_ONE_KEY = EG.Model.HAS_ONE_KEY = 'hasOne';
var HAS_MANY_KEY = EG.Model.HAS_MANY_KEY = 'hasMany';

var CLIENT_STATE = EG.Relationship.CLIENT_STATE;
var SERVER_STATE = EG.Relationship.SERVER_STATE;
var DELETED_STATE = EG.Relationship.DELETED_STATE;

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
		isReadOnly: options.readOnly === true,
		isPolymorphic: options.polymorphic === true
	};

	Em.assert('defaultValue for hasMany must be an array.', meta.kind === HAS_ONE_KEY || Em.isArray(meta.defaultValue));
	Em.assert('defaultValue for hasOne must be null or a string.',
			meta.kind === HAS_MANY_KEY || meta.defaultValue === null || Em.typeOf(meta.defaultValue) === 'string');

	if (meta.kind === HAS_MANY_KEY) {
		return Em.computed(function(key) {
			return this.getHasManyValue(key.substring(1), false);
		}).property('relationships.client.' + name,
				'relationships.deleted.' + name,
				'relationships.server.' + name).meta(meta).readOnly();
	} else {
		return Em.computed(function(key) {
			return this.getHasOneValue(key.substring(1), false);
		}).property('relationships.client.' + name,
				'relationships.deleted.' + name,
				'relationships.server.' + name).meta(meta).readOnly();
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
		var obj = {};

		Em.runInDebug(function() {
			var disallowedNames = new Em.Set(['id', 'type', 'content', 'length', 'model']);

			forEach.call(Em.keys(relationships), function(name) {
				Em.assert('`' + name + '` cannot be used as a relationship name.', !disallowedNames.contains(name));
				Em.assert('A relationship name cannot start with an underscore.', name.charAt(0) !== '_');
				Em.assert('Relationship names must start with a lowercase letter.', name.charAt(0).match(/[a-z]/));
			});
		});

		forEach.call(Em.keys(relationships), function(name) {
			obj['_' + name] = createRelationship(name, relationships[name].kind, relationships[name].options);
			var meta = Em.copy(obj['_' + name].meta(), true);
			var relatedType = meta.relatedType;

			var relationship;

			// We're not going to close over many variables for the sake of speed
			if (meta.kind === HAS_ONE_KEY) {
				relationship = function(key) {
					var value = this.get('_' + key);
					return (value ? this.get('store').find(value.type, value.id) : null);
				};
			} else if (!meta.isPolymorphic) {
				relationship = function(key) {
					var value = this.get('_' + key);
					var ids = Em.ArrayPolyfills.map.call(value, function(item) {
						return item.id;
					});
					return this.get('store').find(relatedType, ids);
				};
			} else {
				relationship = function(key) {
					var store = this.get('store');
					var value = this.get('_' + key);
					var groups = EG.groupRecords(value);
					var promises = Em.ArrayPolyfills.map.call(groups, function(group) {
						var ids = Em.ArrayPolyfills.map.call(group, function(item) {
							return item.id;
						});
						return store.find(group[0].type, ids);
					});
					return Em.RSVP.Promise.all(promises).then(function(groups) {
						return Em.ArrayPolyfills.reduce.call(groups, function(array, group) {
							return array.concat(group);
						}, []);
					});
				};
			}

			meta.isRelationship = true;
			obj[name] = Em.computed(relationship).property('_' + name).readOnly().meta(meta);
		});

		this.reopen(obj);
	}

});

EG.Model.reopen({

	areRelationshipsDirty: Em.computed(function() {
		return this.get('relationships.client.length') > 0 || this.get('relationships.deleted.length') > 0;
	}).property('relationships.client.length', 'relationships.deleted.length'),

	changedRelationships: function() {
		var changes = {};

		this.constructor.eachRelationship(function(name, meta) {
			var oldVal, newVal;

			if (meta.isReadOnly) {
				return;
			}

			if (meta.kind === HAS_MANY_KEY) {
				oldVal = this.getHasManyValue(name, true);
				var oldValSet = map.call(oldVal, function(value) {
					return value.type + ':' + value.id;
				});

				newVal = this.getHasManyValue(name, false);
				var newValSet = map.call(newVal, function(value) {
					return value.type + ':' + value.id;
				});

				if (!EG.arrayContentsEqual(oldVal, newVal)) {
					changes[name] = [oldVal, newVal];
				}
			} else {
				oldVal = this.getHasOneValue(name, true);
				newVal = this.getHasOneValue(name, false);

				if (!oldVal && !newVal) {
					return;
				}

				if ((!oldVal && newVal) || (oldVal && !newVal) ||
					(oldVal.typeKey !== newVal.typeKey || oldVal.id !== newVal.id)) {
					changes[name] = [oldVal, newVal];
				}
			}
		}, this);

		return changes;
	},

	rollbackRelationships: function() {
		Em.changeProperties(function() {
			var store = this.get('store');

			var client = this.get('relationships').getRelationshipsByState(CLIENT_STATE);
			forEach.call(client, function(relationship) {
				store.deleteRelationship(relationship);
			});

			var deleted = this.get('relationships').getRelationshipsByState(DELETED_STATE);
			forEach.call(deleted, function(relationship) {
				store.changeRelationshipState(relationship, SERVER_STATE);
			});
		}, this);
	},

	addToRelationship: function(relationshipName, id, polymorphicType) {
		Em.changeProperties(function() {
			var i, store = this.get('store');

			// Don't modify a read-only relationship
			var meta = this.constructor.metaForRelationship(relationshipName);
			if (meta.isReadOnly) {
				Em.assert('Can\'t modify a read-only relationship.');
				return;
			}

			// If the type wasn't provided, fill it in based on the inverse
			if (Em.typeOf(id) !== 'string') {
				polymorphicType = Em.get(id, 'typeKey');
				id = Em.get(id, 'id');
			} else if (Em.typeOf(polymorphicType) !== 'string') {
				polymorphicType = meta.relatedType;
			}

			var otherModel = store.modelForType(polymorphicType);
			var otherMeta = (meta.inverse === null ? null : otherModel.metaForRelationship(meta.inverse));
			var currentValues = this.getHasManyRelationships(relationshipName, false);
			var serverValues = this.getHasManyRelationships(relationshipName, true);

			// Check to see if the records are already connected
			for (i = 0; i < currentValues.length; ++i) {
				if (currentValues[i].otherType(this) === polymorphicType && currentValues[i].otherId(this) === id) {
					return;
				}
			}

			// If the inverse is null or a hasMany, we can create the relationship without conflict
			if (meta.inverse === null || otherMeta.kind === HAS_MANY_KEY) {
				// Check for delete relationships first
				for (i = 0; i < serverValues.length; ++i) {
					if (serverValues[i].otherType(this) === polymorphicType && serverValues[i].otherId(this) === id) {
						store.changeRelationshipState(serverValues[i], SERVER_STATE);
						return;
					}
				}

				store.createRelationship(this.typeKey, this.get('id'), relationshipName,
					polymorphicType, id, meta.inverse, CLIENT_STATE);

				return;
			}

			// Make sure there are no conflicts on the other side since it's a hasOne
			var otherValues = store.sortHasOneRelationships(polymorphicType, id, meta.inverse);
			if (otherValues[SERVER_STATE]) {
				store.changeRelationshipState(otherValues[SERVER_STATE], DELETED_STATE);
			} else if (otherValues[CLIENT_STATE]) {
				store.deleteRelationship(otherValues[CLIENT_STATE]);
			}

			// Check for any deleted relationships that match the one we need
			for (i = 0; i < serverValues.length; ++i) {
				if (serverValues[i].otherType(this) === polymorphicType && serverValues[i].otherId(this) === id) {
					store.changeRelationshipState(serverValues[i], SERVER_STATE);
					return;
				}
			}

			// If all else fails, create a relationship
			store.createRelationship(this.typeKey, this.get('id'), relationshipName,
				polymorphicType, id, meta.inverse, CLIENT_STATE);
		}, this);
	},

	removeFromRelationship: function(relationshipName, id, polymorphicType) {
		Em.changeProperties(function() {
			// Don't modify a read-only relationship
			var meta = this.constructor.metaForRelationship(relationshipName);
			if (meta.isReadOnly) {
				Em.assert('Can\'t modify a read-only relationship.');
				return;
			}

			// If the type wasn't provided, fill it in based on the inverse
			if (Em.typeOf(id) !== 'string') {
				polymorphicType = Em.get(id, 'typeKey');
				id = Em.get(id, 'id');
			} else if (Em.typeOf(polymorphicType) !== 'string') {
				polymorphicType = meta.relatedType;
			}

			var relationships = this.getHasManyRelationships(relationshipName, false);
			for (var i = 0; i < relationships.length; ++i) {
				if (relationships[i].otherType(this) === polymorphicType && relationships[i].otherId(this) === id) {
					if (relationships[i].get('state') === CLIENT_STATE) {
						this.get('store').deleteRelationship(relationships[i]);
					} else {
						this.get('store').changeRelationshipState(relationships[i], DELETED_STATE);
					}

					break;
				}
			}
		}, this);
	},

	setHasOneRelationship: function(relationshipName, id, polymorphicType) {
		Em.changeProperties(function() {
			var store = this.get('store');

			// Don't modify a read-only relationship
			var meta = this.constructor.metaForRelationship(relationshipName);
			if (meta.isReadOnly) {
				Em.assert('Can\'t modify a read-only relationship.');
				return;
			}

			// If the type wasn't provided, fill it in based on the inverse
			if (Em.typeOf(id) !== 'string') {
				polymorphicType = id.typeKey;
				id = id.get('id');
			} else if (Em.typeOf(polymorphicType) !== 'string') {
				polymorphicType = meta.relatedType;
			}

			var otherModel = store.modelForType(polymorphicType);
			var otherMeta = (meta.inverse === null ? null : otherModel.metaForRelationship(meta.inverse));
			var currentRelationships = store.sortHasOneRelationships(this.typeKey, this.get('id'), relationshipName);

			// First make sure they're not already connected
			if (currentRelationships[SERVER_STATE] &&
				currentRelationships[SERVER_STATE].otherType(this) === polymorphicType &&
				currentRelationships[SERVER_STATE].otherId(this) === id) {
				return;
			}

			if (currentRelationships[CLIENT_STATE] &&
				currentRelationships[CLIENT_STATE].otherType(this) === polymorphicType &&
				currentRelationships[CLIENT_STATE].otherId(this) === id) {
				return;
			}

			// They're not connected, so we definitely have to get rid of the current value
			if (currentRelationships[SERVER_STATE]) {
				store.changeRelationshipState(currentRelationships[SERVER_STATE], DELETED_STATE);
			} else if (currentRelationships[CLIENT_STATE]) {
				store.deleteRelationship(currentRelationships[CLIENT_STATE]);
			}

			// If the inverse is null or a hasMany, we can just create the relationship
			if (meta.inverse === null || otherMeta.kind === HAS_MANY_KEY) {
				var temp1;
				// Check for a deleted relationship first
				for (var i = 0; i < currentRelationships[DELETED_STATE].length; ++i) {
					temp1 = currentRelationships[DELETED_STATE][i];
					if (temp1.otherType(this) === polymorphicType && temp1.otherId(this) === id) {
						store.changeRelationshipState(temp1, SERVER_STATE);
						return;
					}
				}

				// If we can't find one, just create a new relationship
				store.createRelationship(this.typeKey, this.get('id'), relationshipName,
					polymorphicType, id, meta.inverse, CLIENT_STATE);

				return;
			}

			// We have to make sure there are no conflicts on the other side, since it's also a hasOne
			var otherRelationships = store.sortHasOneRelationships(polymorphicType, id, meta.inverse);
			if (otherRelationships[SERVER_STATE]) {
				store.changeRelationshipState(otherRelationships[SERVER_STATE], DELETED_STATE);
			} else if (otherRelationships[CLIENT_STATE]) {
				store.deleteRelationship(otherRelationships[CLIENT_STATE]);
			}

			// Finally, check for a deleted relationship between the two
			var temp2;
			for (var j = 0; j < currentRelationships[DELETED_STATE].length; ++j) {
				temp2 = currentRelationships[DELETED_STATE][j];
				if (temp2.otherType(this) === polymorphicType && temp2.otherId(this) === id) {
					store.changeRelationshipState(temp2, SERVER_STATE);
					return;
				}
			}

			// If all else fails, create a relationship
			store.createRelationship(this.typeKey, this.get('id'), relationshipName,
				polymorphicType, id, meta.inverse, CLIENT_STATE);
		}, this);
	},

	clearHasOneRelationship: function(relationshipName) {
		Em.changeProperties(function() {
			var meta = this.constructor.metaForRelationship(relationshipName);
			if (meta.isReadOnly) {
				Em.assert('Can\'t modify a read-only relationship.');
				return;
			}

			var relationship = this.getHasOneRelationship(relationshipName, false);
			if (relationship) {
				if (relationship.get('state') === CLIENT_STATE) {
					this.get('store').deleteRelationship(relationship);
				} else {
					this.get('store').changeRelationshipState(relationship, DELETED_STATE);
				}
			}
		}, this);
	}

});

EG.Model.reopen({

	/**
	 * Stores all of the relationships currently connected to this record.
	 * The model itself should only read from this object. All additions
	 * and deletions are handled by the store (so they can be reciprocated).
	 *
	 * @type RelationshipMap
	 */
	relationships: null,

	initializeRelationships: Em.on('init', function() {
		this.set('relationships', new EG.RelationshipStore());
	}),

	getHasOneRelationship: function(name, server) {
		var relationships;

		if (server) {
			relationships = this.get('relationships').getServerRelationships(name);
		} else {
			relationships = this.get('relationships').getCurrentRelationships(name);
		}

		if (relationships.length <= 0) {
			return null;
		} else {
			return relationships[0];
		}
	},

	getHasOneValue: function(name, server) {
		var relationship = this.getHasOneRelationship(name, server);

		if (relationship === null) {
			return null;
		} else {
			return {
				type: relationship.otherType(this),
				id: relationship.otherId(this)
			};
		}
	},

	getHasManyRelationships: function(name, server) {
		if (server) {
			return this.get('relationships').getServerRelationships(name);
		} else {
			return this.get('relationships').getCurrentRelationships(name);
		}
	},

	getHasManyValue: function(name, server) {
		return map.call(this.getHasManyRelationships(name, server), function(relationship) {
			return {
				type: relationship.otherType(this),
				id: relationship.otherId(this)
			};
		}, this);
	},

	getRelationshipsByName: function(name) {
		return this.get('relationships').getRelationshipsByName(name);
	}

});