var map = Em.ArrayPolyfills.map;
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
		}).property('relationships.client.' + name, 'relationships.deleted.' + name).meta(meta).readOnly();
	} else {
		return Em.computed(function(key) {
			return this.getHasOneValue(key.substring(1), false);
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
					var value = this.getHasOneValue(key, false);
					return (value ? this.get('store').find(value.type, value.id) : null);
				};
			} else if (!meta.isPolymorphic) {
				relationship = function(key) {
					var value = this.getHasManyValue(key, false);
					var ids = Em.ArrayPolyfills.map.call(value, function(item) {
						return item.id;
					});
					return this.get('store').find(relatedType, ids);
				};
			} else {
				relationship = function(key) {
					var store = this.get('store');
					var value = this.getHasManyValue(key, false);
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
		var store = this.get('store');

		var client = this.get('relationships').getRelationshipsByState(CLIENT_STATE);
		forEach.call(client, store.deleteRelationship, store);

		var deleted = this.get('relationships').getRelationshipsByState(DELETED_STATE);
		forEach.call(deleted, store.changeRelationshipState, store);
	},

	addToRelationship: function(relationshipName, id, polymorphicType) {

	},

	removeFromRelationship: function(relationshipName, id, polymorphicType) {
		var meta = this.constructor.metaForRelationship(relationshipName);
		if (meta.isReadOnly) {
			Em.assert('Can\'t modify a read-only relationship.');
			return;
		}

		if (Em.typeOf(id) !== 'string') {
			polymorphicType = id.typeKey;
			id = id.get('id');
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
	},

	setHasOneRelationship: function(relationshipName, id, polymorphicType) {
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

		// If we're already connected to that record, return.
		// If not, clear the current value for this record.
		var currentValue = this.getHasOneRelationship(relationshipName, false);
		if (currentValue.otherType(this) === polymorphicType && currentValue.otherId(this) === id) {
			return;
		} else {
			if (currentValue.get('state') === CLIENT_STATE) {
				store.deleteRelationship(currentValue);
			} else {
				store.changeRelationshipState(currentValue, DELETED_STATE);
			}
		}

		// If there's a deleted relationship to connect these records, get it.
		var deletedValue = this.getHasOneRelationship(name, true);

		// If the inverse is null, we can create the relationship without conflict
		if (meta.inverse === null) {
			if (deletedValue) {
				store.changeRelationshipState(deletedValue, SERVER_STATE);
			} else {
				store.createRelationship(this.typeKey, this.get('id'), relationshipName,
					polymorphicType, id, null, CLIENT_STATE);
			}

			return;
		}

		// If the relationship isn't null, we have to disconnect any hasOne conflicts
		var otherRecord = store.getRecord(polymorphicType, meta.inverse);
		if (otherRecord) {
			var conflict = otherRecord.getHasOneRelationship(meta.inverse, false);
			if (conflict) {
				if (conflict.get('state') === CLIENT_STATE) {
					store.deleteRelationship(conflict);
				} else {
					store.changeRelationshipState(conflict);
				}
			}
		}

		// Now that everything is free from conflicts, connect the deleted relationship if we found one
		if (deletedValue) {
			store.changeRelationshipState(deletedValue, SERVER_STATE);
			return;
		}

		// If all of that fails, create a new relationship (possibly queued)
		store.createRelationship(this.typeKey, this.get('id'), relationshipName,
			polymorphicType, id, meta.inverse, CLIENT_STATE);
	},

	clearHasOneRelationship: function(relationshipName) {
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

	loadRelationships: function(json) {

	},

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
	}

});