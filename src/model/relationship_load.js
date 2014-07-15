var map = Em.ArrayPolyfills.map;
var filter = Em.ArrayPolyfills.filter;
var reduce = EG.ArrayPolyfills.reduce;
var forEach = Em.ArrayPolyfills.forEach;

var HAS_ONE_KEY = EG.Model.HAS_ONE_KEY;
var HAS_MANY_KEY = EG.Model.HAS_MANY_KEY;

var CLIENT_STATE = EG.Relationship.CLIENT_STATE;
var SERVER_STATE = EG.Relationship.SERVER_STATE;
var DELETED_STATE = EG.Relationship.DELETED_STATE;

// TODO: This can probably be moved into the store to be more model-agnostic
// Idea: load attributes into records directly, but load relationships into store
// Split the data apart in `extractPayload`
EG.Model.reopen({

	/**
	 * Merges relationship data from the client into the relationships
	 * already connected to this record. Any absolutely correct choices
	 * are made automatically, while choices that come down to preference
	 * are decided based on the configurable store properties.
	 *
	 * @param {Object} json
	 * @private
	 */
	loadRelationships: function(json) {
		this.constructor.eachRelationship(function(name, meta) {
			var otherKind = null;

			if (meta.inverse) {
				otherKind = this.get('store').modelForType(meta.relatedType).metaForRelationship(meta.inverse).kind;
			}

			// TODO: I don't much like this here. Same for the attributes one.
			Em.assert('Your JSON is missing a required relationship.', !meta.isRequired || json.hasOwnProperty(name));
			if (!json.hasOwnProperty(name)) {
				json[name] = meta.defaultValue;
			}

			if (meta.kind === HAS_MANY_KEY) {
				switch (otherKind) {
					case HAS_ONE_KEY:
						this.connectHasManyToHasOne(name, meta, json[name]);
						break;
					case HAS_MANY_KEY:
						this.connectHasManyToHasMany(name, meta, json[name]);
						break;
					default:
						this.connectHasManyToNull(name, meta, json[name]);
						break;
				}
			} else {
				if (json[name]) {
					switch (otherKind) {
						case HAS_ONE_KEY:
							this.connectHasOneToHasOne(name, meta, json[name]);
							break;
						case HAS_MANY_KEY:
							this.connectHasOneToHasMany(name, meta, json[name]);
							break;
						default:
							this.connectHasOneToNull(name, meta, json[name]);
							break;
					}
				} else {
					switch (otherKind) {
						case HAS_ONE_KEY:
							this.disconnectHasOneFromHasOne(name, meta);
							break;
						case HAS_MANY_KEY:
							this.disconnectHasOneFromHasMany(name, meta);
							break;
						default:
							this.disconnectHasOneFromNull(name, meta);
							break;
					}
				}
			}
		}, this);
	},

	disconnectHasOneFromNull: Em.aliasMethod('disconnectHasOneFromHasMany'),

	disconnectHasOneFromHasOne: Em.aliasMethod('disconnectHasOneFromHasMany'),

	disconnectHasOneFromHasMany: function(name, meta) {
		var store = this.get('store');
		var relationships = this.sortHasOneRelationships(this.typeKey, this.get('id'), name);

		if (relationships[DELETED_STATE].length > 0) {
			forEach.call(relationships[DELETED_STATE], function (relationship) {
				store.deleteRelationship(relationship);
			}, this);
		}

		if (!relationships[SERVER_STATE] && !relationships[CLIENT_STATE]) {
			return;
		}

		if (relationships[SERVER_STATE] && !relationships[CLIENT_STATE]) {
			store.deleteRelationship(relationships[SERVER_STATE]);
			return;
		}

		if (!relationships[SERVER_STATE] && relationships[CLIENT_STATE]) {
			if (!store.get('sideWithClientOnConflict')) {
				store.deleteRelationship(relationships[CLIENT_STATE]);
			}
		}
	},

	connectHasOneToNull: Em.aliasMethod('connectHasOneToHasMany'),

	connectHasOneToHasOne: function(name, meta, value) {
		// TODO: This is going to be LONG. But make it right, then make it good
		var thisType = this.typeKey;
		var thisId = this.get('id');
		var store = this.get('store');
		var sideWithClientOnConflict = store.get('sideWithClientOnConflict');

		var theseValues = this.sortHasOneRelationships(thisType, thisId, name);
		var otherValues = this.sortHasOneRelationships(value.type, value.id, meta.inverse);

		var thisCurrent = theseValues[SERVER_STATE] || theseValues[CLIENT_STATE] || null;
		var otherCurrent = otherValues[SERVER_STATE] || otherValues[CLIENT_STATE] || null;
		if (thisCurrent === otherCurrent) {
			store.changeRelationshipState(thisCurrent, SERVER_STATE);
			return;
		}

		forEach.call(theseValues[DELETED_STATE], function(relationship) {
			store.deleteRelationship(relationship);
		}, this);

		forEach.call(otherValues[DELETED_STATE], function(relationship) {
			store.deleteRelationship(relationship);
		}, this);

		if (!theseValues[SERVER_STATE] && !theseValues[CLIENT_STATE]) {
			if (!otherValues[SERVER_STATE] && !otherValues[CLIENT_STATE]) {
				store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				return;
			}

			if (otherValues[SERVER_STATE] && !otherValues[CLIENT_STATE]) {
				store.deleteRelationship(otherValues[SERVER_STATE]);
				store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				return;
			}

			if (!otherValues[SERVER_STATE] && otherValues[CLIENT_STATE]) {
				if (sideWithClientOnConflict) {
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
				} else {
					store.deleteRelationship(otherValues[CLIENT_STATE]);
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				}

				return;
			}
		}

		if (theseValues[SERVER_STATE] && !theseValues[CLIENT_STATE]) {
			if (!otherValues[SERVER_STATE] && !otherValues[CLIENT_STATE]) {
				store.deleteRelationship(theseValues[SERVER_STATE]);
				store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				return;
			}

			if (otherValues[SERVER_STATE] && !otherValues[CLIENT_STATE]) {
				store.deleteRelationship(theseValues[SERVER_STATE]);
				store.deleteRelationship(otherValues[SERVER_STATE]);
				store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				return;
			}

			if (!otherValues[SERVER_STATE] && otherValues[CLIENT_STATE]) {
				if (sideWithClientOnConflict) {
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
				} else {
					store.deleteRelationship(theseValues[SERVER_STATE]);
					store.deleteRelationship(otherValues[CLIENT_STATE]);
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				}

				return;
			}
		}

		if (!theseValues[SERVER_STATE] && theseValues[CLIENT_STATE]) {
			if (!otherValues[SERVER_STATE] && !otherValues[CLIENT_STATE]) {
				if (sideWithClientOnConflict) {
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
				} else {
					store.deleteRelationship(theseValues[CLIENT_STATE]);
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				}

				return;
			}

			if (otherValues[SERVER_STATE] && !otherValues[CLIENT_STATE]) {
				if (sideWithClientOnConflict) {
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
				} else {
					store.deleteRelationship(theseValues[CLIENT_STATE]);
					store.deleteRelationship(otherValues[SERVER_STATE]);
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				}

				return;
			}

			if (!otherValues[SERVER_STATE] && otherValues[CLIENT_STATE]) {
				if (sideWithClientOnConflict) {
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
				} else {
					store.deleteRelationship(theseValues[CLIENT_STATE]);
					store.deleteRelationship(otherValues[CLIENT_STATE]);
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				}

				return;
			}
		}
	},

	connectHasOneToHasMany: function(name, meta, value) {
		var thisType = this.typeKey;
		var thisId = this.get('id');
		var store = this.get('store');
		var relationships = this.sortHasOneRelationships(thisType, thisId, name);

		// TODO: Make it right, then make it good
		if (relationships[SERVER_STATE] && relationships[SERVER_STATE].otherType(this) === value.type &&
			relationships[SERVER_STATE].otherId(this) === value.id) {
			return;
		}

		if (relationships[CLIENT_STATE] && relationships[CLIENT_STATE].otherType(this) === value.type &&
			relationships[CLIENT_STATE].otherId(this) === value.id) {
			store.changeRelationshipState(relationships[CLIENT_STATE], SERVER_STATE);
			return;
		}

		if (!relationships[SERVER_STATE] && !relationships[CLIENT_STATE] && relationships[DELETED_STATE].length <= 0) {
			store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
			return;
		}

		if (relationships[SERVER_STATE] && !relationships[CLIENT_STATE] && relationships[DELETED_STATE].length <= 0) {
			store.deleteRelationship(relationships[SERVER_STATE]);
			store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
			return;
		}

		if (!relationships[SERVER_STATE] && relationships[CLIENT_STATE] && relationships[DELETED_STATE].length <= 0) {
			if (store.get('sideWithClientOnConflict')) {
				store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
			} else {
				store.deleteRelationship(relationships[CLIENT_STATE]);
				store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
			}

			return;
		}

		if (!relationships[SERVER_STATE] && !relationships[CLIENT_STATE] && relationships[DELETED_STATE].length >= 0) {
			forEach.call(relationships[DELETED_STATE], function(relationship) {
				store.deleteRelationship(relationship);
			});

			store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
			return;
		}

		if (!relationships[SERVER_STATE] && relationships[CLIENT_STATE] && relationships[DELETED_STATE].length >= 0) {
			forEach.call(relationships[DELETED_STATE], function(relationship) {
				store.deleteRelationship(relationship);
			});

			if (store.get('sideWithClientOnConflict')) {
				store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
			} else {
				store.deleteRelationship(relationships[CLIENT_STATE]);
				store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
			}

			return;
		}
	},

	connectHasManyToNull: Em.aliasMethod('connectHasManyToHasMany'),

	connectHasManyToHasOne: function(name, meta, values) {
		var thisType = this.typeKey;
		var thisId = this.get('id');
		var store = this.get('store');

		var relationships = store.relationshipsForRecord(thisType, thisId, name);

		forEach.call(relationships, function(relationship) {
			store.deleteRelationship(relationship);
		});

		var clientRelationships = filter.call(relationships, function(relationship) {
			return !!Em.get(relationship, 'state');
		});

		var clientMap = reduce.call(clientRelationships, function(map, relationship) {
			map[relationship.otherType(this) + ':' + relationship.otherId(this)] = relationship;
			return map;
		}.bind(this), {});

		forEach.call(values, function(value) {
			if (clientMap[value.type + ':' + value.id]) {
				store.changeRelationshipState(clientMap[value.type + ':' + value.id], SERVER_STATE);
				return;
			}

			var conflicts = this.sortHasOneRelationships(value.type, value.id, meta.inverse);

			if (!conflicts[SERVER_STATE] && !conflicts[CLIENT_STATE] && conflicts[DELETED_STATE].length <= 0) {
				store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				return;
			}

			if(conflicts[SERVER_STATE] && !conflicts[CLIENT_STATE] && conflicts[DELETED_STATE].length <= 0) {
				store.deleteRelationship(conflicts[SERVER_STATE]);
				store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				return;
			}

			if(!conflicts[SERVER_STATE] && conflicts[CLIENT_STATE] && conflicts[DELETED_STATE].length <= 0) {
				if (store.get('sideWithClientOnConflict')) {
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
				} else {
					store.deleteRelationship(conflicts[CLIENT_STATE]);
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				}

				return;
			}

			if(!conflicts[SERVER_STATE] && !conflicts[CLIENT_STATE] && conflicts[DELETED_STATE].length > 0) {
				forEach.call(conflicts[DELETED_STATE], function(relationship) {
					store.deleteRelationship(relationship);
				});
				store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				return;
			}

			if(conflicts[SERVER_STATE] && conflicts[CLIENT_STATE] && conflicts[DELETED_STATE].length > 0) {
				forEach.call(conflicts[DELETED_STATE], function(relationship) {
					store.deleteRelationship(relationship);
				});

				if (store.get('sideWithClientOnConflict')) {
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
				} else {
					store.deleteRelationship(conflicts[CLIENT_STATE]);
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				}

				return;
			}
		}, this);
	},

	connectHasManyToHasMany: function(name, meta, values) {
		var thisType = this.typeKey;
		var thisId = this.get('id');
		var store = this.get('store');

		var relationships = store.relationshipsForRecord(thisType, thisId, name);

		forEach.call(relationships, function(relationship) {
			store.deleteRelationship(relationship);
		});

		var clientRelationships = filter.call(relationships, function(relationship) {
			return !!Em.get(relationship, 'state');
		});

		var clientMap = reduce.call(clientRelationships, function(map, relationship) {
			map[relationship.otherType(this) + ':' + relationship.otherId(this)] = relationship;
			return map;
		}.bind(this), {});

		forEach.call(values, function(value) {
			if (clientMap[value.type + ':' + value.id]) {
				store.changeRelationshipState(clientMap[value.type + ':' + value.id], SERVER_STATE);
			} else {
				store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
			}
		}, this);
	},

	sortHasOneRelationships: function(type, id, name) {
		var values = {};
		var relationships = this.get('store').relationshipsForRecord(type, id, name);

		values[SERVER_STATE] = filter.call(relationships, function(relationship) {
			return relationship.get('state') === SERVER_STATE;
		})[0] || null;

		values[DELETED_STATE] = filter.call(relationships, function(relationship) {
			return relationship.get('state') === DELETED_STATE;
		});

		values[CLIENT_STATE] = filter.call(relationships, function(relationship) {
			return relationship.get('state') === CLIENT_STATE;
		})[0] || null;

		Em.runInDebug(function() {
			/* jshint ignore:start */
			// No relationships at all
			if (!values[SERVER_STATE] && values[DELETED_STATE].length <= 0 && !values[CLIENT_STATE]) return;
			// One server relationship, nothing else
			if (values[SERVER_STATE] && values[DELETED_STATE].length <= 0 && !values[CLIENT_STATE]) return;
			// One client relationship, nothing else
			if (!values[SERVER_STATE] && values[DELETED_STATE].length <= 0 && values[CLIENT_STATE]) return;
			// One client relationship and some deleted relationships
			if (!values[SERVER_STATE] && values[DELETED_STATE].length > 0 && values[CLIENT_STATE]) return;
			// Some deleted relationships, nothing else
			if (!values[SERVER_STATE] && values[DELETED_STATE].length > 0 && !values[CLIENT_STATE]) return;
			// Everything else is invalid
			Em.assert('Invalid hasOne relationship values.');
			/* jshint ignore:end */
		});

		return values;
	}
});