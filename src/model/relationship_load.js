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
// Split the data apart in `pushPayload`
EG.Model.reopen({

	/**
	 * Sets up relationships given to the constructor for this record.
	 * Equivalent to calling the relationship functions individually.
	 *
	 * @private
	 */
	initializeRelationships: function(json) {
		this.constructor.eachRelationship(function(name, meta) {
			var value = json[name];

			if (value === undefined) {
				return;
			}

			this.set('initializedRelationships.' + name, true);

			if (meta.kind === HAS_MANY_KEY) {
				forEach.call(value, function(v) {
					switch (Em.typeOf(v)) {
						case 'string':
							this.addToRelationship(name, v);
							break;
						case 'instance':
							this.addToRelationship(name, v.get('id'), v.get('typeKey'));
							break;
						default:
							this.addToRelationship(name, v.id, v.type);
							break;
					}
				}, this);
			} else {
				switch (Em.typeOf(value)) {
					case 'string':
						this.setHasOneRelationship(name, value);
						break;
					case 'null':
						// It's already null
						break;
					case 'instance':
						this.setHasOneRelationship(name, value.get('id'), value.get('typeKey'));
						break;
					default:
						this.setHasOneRelationship(name, value.id, value.type);
						break;
				}
			}
		}, this);
	},

	/**
	 * Merges relationship data from the server into the relationships
	 * already connected to this record. Any absolutely correct choices
	 * are made automatically, while choices that come down to preference
	 * are decided based on the configurable store properties.
	 *
	 * @param {Object} json
	 * @private
	 */
	loadRelationshipsFromServer: function(json) {
		this.constructor.eachRelationship(function(name, meta) {
			var otherKind = null;

			if (meta.inverse) {
				otherKind = this.get('store').modelFor(meta.relatedType).metaForRelationship(meta.inverse).kind;
			}

			// TODO: I don't much like this here. Same for the attributes one.
			if (meta.isRequired && json[name] === undefined) {
				throw new Em.Error('Your JSON is missing the required `' + name + '` relationship.');
			}

			if (json[name] === undefined) {
				json[name] = meta.getDefaultValue();
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
		var relationships = store.sortHasOneRelationships(this.typeKey, this.get('id'), name);

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

		var theseValues = store.sortHasOneRelationships(thisType, thisId, name);
		var otherValues = store.sortHasOneRelationships(value.type, value.id, meta.inverse);

		var thisCurrent = theseValues[SERVER_STATE] || theseValues[CLIENT_STATE] || null;
		var otherCurrent = otherValues[SERVER_STATE] || otherValues[CLIENT_STATE] || null;
		if (thisCurrent === otherCurrent) {
			store.changeRelationshipState(thisCurrent, SERVER_STATE);
			return;
		}

		// Hehe, I'm going to look back on this one day...

		/* jshint ignore:start */
		var handled;

		if (!theseValues[SERVER_STATE] && !theseValues[CLIENT_STATE] && theseValues[DELETED_STATE].length <= 0) {
			if (!otherValues[SERVER_STATE] && !otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length <= 0) {
				store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				return;
			}

			if (otherValues[SERVER_STATE] && !otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length <= 0) {
				store.deleteRelationship(otherValues[SERVER_STATE]);
				store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				return;
			}

			if (!otherValues[SERVER_STATE] && otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length <= 0) {
				if (sideWithClientOnConflict) {
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
				} else {
					store.deleteRelationship(otherValues[CLIENT_STATE]);
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				}
				return;
			}

			if (!otherValues[SERVER_STATE] && !otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length > 0) {
				handled = false;

				forEach.call(otherValues[DELETED_STATE], function(relationship) {
					if (relationship.otherType(this) === value.type && relationship.otherId(this) === value.id) {
						if (sideWithClientOnConflict) {
							// NOOP
						} else {
							store.changeRelationshipState(relationship, SERVER_STATE);
						}

						handled = true;
					} else {
						store.deleteRelationship(relationship);
					}
				}, this);

				if (!handled) {
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				}

				return;
			}

			if (!otherValues[SERVER_STATE] && otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length > 0) {
				handled = false;

				forEach.call(otherValues[DELETED_STATE], function(relationship) {
					if (relationship.otherType(this) === value.type && relationship.otherId(this) === value.id) {
						if (sideWithClientOnConflict) {
							// NOOP
						} else {
							store.deleteRelationship(otherValues[CLIENT_STATE]);
							store.changeRelationshipState(relationship, SERVER_STATE);
						}

						handled = true;
					} else {
						store.deleteRelationship(relationship);
					}
				}, this);

				if (!handled) {
					if (sideWithClientOnConflict) {
						store.createRelationship(thisType, thisId, name,
							value.type, value.id, meta.inverse, DELETED_STATE);
					} else {
						store.deleteRelationship(otherValues[CLIENT_STATE]);
						store.createRelationship(thisType, thisId, name,
							value.type, value.id, meta.inverse, SERVER_STATE);
					}
				}

				return;
			}
		}

		if (theseValues[SERVER_STATE] && !theseValues[CLIENT_STATE] && theseValues[DELETED_STATE].length <= 0) {
			store.deleteRelationship(theseValues[SERVER_STATE]);

			if (!otherValues[SERVER_STATE] && !otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length <= 0) {
				store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				return;
			}

			if (otherValues[SERVER_STATE] && !otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length <= 0) {
				store.deleteRelationship(otherValues[SERVER_STATE]);
				store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				return;
			}

			if (!otherValues[SERVER_STATE] && otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length <= 0) {
				if (sideWithClientOnConflict) {
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
				} else {
					store.deleteRelationship(otherValues[CLIENT_STATE]);
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				}

				return;
			}

			if (!otherValues[SERVER_STATE] && !otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length > 0) {
				handled = false;

				forEach.call(otherValues[DELETED_STATE], function(relationship) {
					if (relationship.otherType(this) === value.type && relationship.otherId(this) === value.id) {
						if (sideWithClientOnConflict) {
							// NOOP
						} else {
							store.changeRelationshipState(relationship, SERVER_STATE);
						}

						handled = true;
					} else {
						store.deleteRelationship(relationship);
					}
				}, this);

				if (!handled) {
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				}

				return;
			}

			if (!otherValues[SERVER_STATE] && otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length > 0) {
				handled = false;

				forEach.call(otherValues[DELETED_STATE], function(relationship) {
					if (relationship.otherType(this) === value.type && relationship.otherId(this) === value.id) {
						if (sideWithClientOnConflict) {
							// NOOP
						} else {
							store.deleteRelationship(otherValues[CLIENT_STATE]);
							store.changeRelationshipState(relationship, SERVER_STATE);
						}

						handled = true;
					} else {
						store.deleteRelationship(relationship);
					}
				}, this);

				if (!handled) {
					if (sideWithClientOnConflict) {
						store.createRelationship(thisType, thisId, name,
							value.type, value.id, meta.inverse, DELETED_STATE);
					} else {
						store.deleteRelationship(otherValues[CLIENT_STATE]);
						store.createRelationship(thisType, thisId, name,
							value.type, value.id, meta.inverse, SERVER_STATE);
					}
				}

				return;
			}
		}

		if (!theseValues[SERVER_STATE] && theseValues[CLIENT_STATE] && theseValues[DELETED_STATE].length <= 0) {
			if (!otherValues[SERVER_STATE] && !otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length <= 0) {
				if (sideWithClientOnConflict) {
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
				} else {
					store.deleteRelationship(theseValues[CLIENT_STATE]);
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				}

				return;
			}

			if (otherValues[SERVER_STATE] && !otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length <= 0) {
				store.deleteRelationship(otherValues[SERVER_STATE]);

				if (sideWithClientOnConflict) {
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
				} else {
					store.deleteRelationship(theseValues[CLIENT_STATE]);
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				}

				return;
			}

			if (!otherValues[SERVER_STATE] && otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length <= 0) {
				if (sideWithClientOnConflict) {
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
				} else {
					store.deleteRelationship(theseValues[CLIENT_STATE]);
					store.deleteRelationship(otherValues[CLIENT_STATE]);
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				}

				return;
			}

			if (!otherValues[SERVER_STATE] && !otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length > 0) {
				forEach.call(otherValues[DELETED_STATE], function(relationship) {
					store.deleteRelationship(relationship);
				});

				if (sideWithClientOnConflict) {
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
				} else {
					store.deleteRelationship(theseValues[CLIENT_STATE]);
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				}

				return;
			}

			if (!otherValues[SERVER_STATE] && otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length > 0) {
				forEach.call(otherValues[DELETED_STATE], function(relationship) {
					store.deleteRelationship(relationship);
				});

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

		if (!theseValues[SERVER_STATE] && !theseValues[CLIENT_STATE] && theseValues[DELETED_STATE].length > 0) {
			if (!otherValues[SERVER_STATE] && !otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length <= 0) {
				forEach.call(theseValues[DELETED_STATE], function(relationship) {
					store.deleteRelationship(relationship);
				});

				store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				return;
			}

			if (otherValues[SERVER_STATE] && !otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length <= 0) {
				forEach.call(theseValues[DELETED_STATE], function(relationship) {
					store.deleteRelationship(relationship);
				});

				store.deleteRelationship(otherValues[SERVER_STATE]);
				store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				return;
			}

			if (!otherValues[SERVER_STATE] && otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length <= 0) {
				forEach.call(theseValues[DELETED_STATE], function(relationship) {
					store.deleteRelationship(relationship);
				});

				if (sideWithClientOnConflict) {
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
				} else {
					store.deleteRelationship(otherValues[CLIENT_STATE]);
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				}

				return;
			}

			if (!otherValues[SERVER_STATE] && !otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length > 0) {
				handled = null;

				forEach.call(theseValues[DELETED_STATE], function(relationship) {
					if (relationship.otherType(this) === value.type && relationship.otherId(this) === value.id) {
						if (sideWithClientOnConflict) {
							// NOOP
						} else {
							store.changeRelationshipState(relationship, SERVER_STATE);
						}

						handled = relationship;
					} else {
						store.deleteRelationship(relationship);
					}
				}, this);

				forEach.call(theseValues[DELETED_STATE], function(relationship) {
					if (relationship !== handled) {
						store.deleteRelationship(relationship);
					}
				});

				if (handled === null) {
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				}

				return;
			}

			if (!otherValues[SERVER_STATE] && otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length > 0) {
				handled = null;

				forEach.call(theseValues[DELETED_STATE], function(relationship) {
					if (relationship.otherType(this) === value.type && relationship.otherId(this) === value.id) {
						if (sideWithClientOnConflict) {
							// NOOP
						} else {
							store.deleteRelationship(otherValues[CLIENT_STATE]);
							store.changeRelationshipState(relationship, SERVER_STATE);
						}

						handled = relationship;
					} else {
						store.deleteRelationship(relationship);
					}
				}, this);

				forEach.call(theseValues[DELETED_STATE], function(relationship) {
					if (relationship !== handled) {
						store.deleteRelationship(relationship);
					}
				});

				if (handled === null) {
					if (sideWithClientOnConflict) {
						store.createRelationship(thisType, thisId, name,
							value.type, value.id, meta.inverse, DELETED_STATE);
					} else {
						store.deleteRelationship(otherValues[CLIENT_STATE]);
						store.createRelationship(thisType, thisId, name,
							value.type, value.id, meta.inverse, SERVER_STATE);
					}
				}

				return;
			}
		}

		if (!theseValues[SERVER_STATE] && theseValues[CLIENT_STATE] && theseValues[DELETED_STATE].length > 0) {
			forEach.call(theseValues[DELETED_STATE], function(relationship) {
				store.deleteRelationship(relationship);
			});

			if (!otherValues[SERVER_STATE] && !otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length <= 0) {
				if (sideWithClientOnConflict) {
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
				} else {
					store.deleteRelationship(theseValues[CLIENT_STATE]);
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				}

				return;
			}

			if (otherValues[SERVER_STATE] && !otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length <= 0) {
				store.deleteRelationship(otherValues[SERVER_STATE]);

				if (sideWithClientOnConflict) {
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
				} else {
					store.deleteRelationship(theseValues[CLIENT_STATE]);
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				}

				return;
			}

			if (!otherValues[SERVER_STATE] && otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length <= 0) {
				if (sideWithClientOnConflict) {
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
				} else {
					store.deleteRelationship(theseValues[CLIENT_STATE]);
					store.deleteRelationship(otherValues[CLIENT_STATE]);
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				}

				return;
			}

			if (!otherValues[SERVER_STATE] && !otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length > 0) {
				forEach.call(otherValues[DELETED_STATE], function(relationship) {
					store.deleteRelationship(relationship);
				});

				if (sideWithClientOnConflict) {
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
				} else {
					store.deleteRelationship(theseValues[CLIENT_STATE]);
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				}

				return;
			}

			if (!otherValues[SERVER_STATE] && otherValues[CLIENT_STATE] && otherValues[DELETED_STATE].length > 0) {
				forEach.call(otherValues[DELETED_STATE], function(relationship) {
					store.deleteRelationship(relationship);
				});

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
		/* jshint ignore:end */
	},

	connectHasOneToHasMany: function(name, meta, value) {
		var thisType = this.typeKey;
		var thisId = this.get('id');
		var store = this.get('store');
		var relationships = store.sortHasOneRelationships(thisType, thisId, name);
		var sideWithClientOnConflict = store.get('sideWithClientOnConflict');

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
			if (sideWithClientOnConflict) {
				store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
			} else {
				store.deleteRelationship(relationships[CLIENT_STATE]);
				store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
			}

			return;
		}

		var handled;

		if (!relationships[SERVER_STATE] && !relationships[CLIENT_STATE] && relationships[DELETED_STATE].length >= 0) {
			handled = false;

			forEach.call(relationships[DELETED_STATE], function(relationship) {
				if (relationship.otherType(this) === value.type && relationship.otherId(this) === value.id) {
					if (sideWithClientOnConflict) {
						// NOOP
					} else {
						store.changeRelationshipState(relationship, SERVER_STATE);
					}

					handled = true;
				} else {
					store.deleteRelationship(relationship);
				}
			}, this);

			if (!handled) {
				store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
			}

			return;
		}

		if (!relationships[SERVER_STATE] && relationships[CLIENT_STATE] && relationships[DELETED_STATE].length >= 0) {
			handled = false;

			forEach.call(relationships[DELETED_STATE], function(relationship) {
				if (relationship.otherType(this) === value.type && relationship.otherId(this) === value.id) {
					if (sideWithClientOnConflict) {
						// NOOP
					} else {
						store.deleteRelationship(relationships[CLIENT_STATE]);
						store.changeRelationshipState(relationship, SERVER_STATE);
					}

					handled = true;
				} else {
					store.deleteRelationship(relationship);
				}
			}, this);

			if (!handled) {
				if (sideWithClientOnConflict) {
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
				} else {
					store.deleteRelationship(relationships[CLIENT_STATE]);
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				}
			}

			return;
		}
	},

	connectHasManyToNull: Em.aliasMethod('connectHasManyToHasMany'),

	connectHasManyToHasOne: function(name, meta, values) {
		var thisType = this.typeKey;
		var thisId = this.get('id');
		var store = this.get('store');
		var sideWithClientOnConflict = store.get('sideWithClientOnConflict');

		var valueMap = reduce.call(values, function(map, value) {
			map[value.type + ':' + value.id] = value;
			return map;
		}, {});

		var relationships = store.relationshipsForRecord(thisType, thisId, name);

		forEach.call(relationships, function(relationship) {
			var valueKey = relationship.otherType(this) + ':' + relationship.otherId(this);

			if (valueMap[valueKey]) {
				switch (relationship.get('state')) {
					case SERVER_STATE:
						// NOOP
						break;
					case DELETED_STATE:
						if (sideWithClientOnConflict) {
							// NOOP
						} else {
							store.changeRelationshipState(relationship, SERVER_STATE);
						}
						break;
					case CLIENT_STATE:
						store.changeRelationshipState(relationship, SERVER_STATE);
						break;
				}
			} else {
				switch (relationship.get('state')) {
					case SERVER_STATE:
					case DELETED_STATE:
						store.deleteRelationship(relationship);
						break;
					case CLIENT_STATE:
						if (sideWithClientOnConflict) {
							// NOOP
						} else {
							store.deleteRelationship(relationship);
						}
						break;
				}
			}

			delete valueMap[valueKey];
		}, this);

		// We've narrowed it down to relationships that have to be created from scratch. (Possibly with conflicts.)
		EG.values(valueMap, function(key, value) {
			var conflicts = store.sortHasOneRelationships(value.type, value.id, meta.inverse);

			if (!conflicts[SERVER_STATE] && !conflicts[CLIENT_STATE] && conflicts[DELETED_STATE].length <= 0) {
				store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				return;
			}

			if (conflicts[SERVER_STATE] && !conflicts[CLIENT_STATE] && conflicts[DELETED_STATE].length <= 0) {
				store.deleteRelationship(conflicts[SERVER_STATE]);
				store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				return;
			}

			if (!conflicts[SERVER_STATE] && conflicts[CLIENT_STATE] && conflicts[DELETED_STATE].length <= 0) {
				if (sideWithClientOnConflict) {
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, DELETED_STATE);
				} else {
					store.deleteRelationship(conflicts[CLIENT_STATE]);
					store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				}
				return;
			}

			if (!conflicts[SERVER_STATE] && !conflicts[CLIENT_STATE] && conflicts[DELETED_STATE].length > 0) {
				forEach.call(conflicts[DELETED_STATE], function(relationship) {
					store.deleteRelationship(relationship);
				});

				store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
				return;
			}

			if (!conflicts[SERVER_STATE] && conflicts[CLIENT_STATE] && conflicts[DELETED_STATE].length > 0) {
				forEach.call(conflicts[DELETED_STATE], function(relationship) {
					store.deleteRelationship(relationship);
				});

				if (sideWithClientOnConflict) {
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
		var sideWithClientOnConflict = store.get('sideWithClientOnConflict');

		var valueMap = reduce.call(values, function(map, value) {
			map[value.type + ':' + value.id] = value;
			return map;
		}, {});

		var relationships = store.relationshipsForRecord(thisType, thisId, name);

		forEach.call(relationships, function(relationship) {
			var valueKey = relationship.otherType(this) + ':' + relationship.otherId(this);

			if (valueMap[valueKey]) {
				switch (relationship.get('state')) {
					case SERVER_STATE:
						// NOOP
						break;
					case DELETED_STATE:
						if (sideWithClientOnConflict) {
							// NOOP
						} else {
							store.changeRelationshipState(relationship, SERVER_STATE);
						}
						break;
					case CLIENT_STATE:
						store.changeRelationshipState(relationship, SERVER_STATE);
						break;
				}
			} else {
				switch (relationship.get('state')) {
					case SERVER_STATE:
					case DELETED_STATE:
						store.deleteRelationship(relationship);
						break;
					case CLIENT_STATE:
						if (sideWithClientOnConflict) {
							// NOOP
						} else {
							store.deleteRelationship(relationship);
						}
						break;
				}
			}

			delete valueMap[valueKey];
		}, this);

		// We've narrowed it down to relationships that have to be created from scratch.
		EG.values(valueMap, function(key, value) {
			store.createRelationship(thisType, thisId, name, value.type, value.id, meta.inverse, SERVER_STATE);
		});
	}
});