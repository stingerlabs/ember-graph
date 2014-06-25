var map = Em.ArrayPolyfills.map;
var forEach = Em.ArrayPolyfills.forEach;

// TODO: This can probably be moved into the store to be more model-agnostic
EG.Model.reopen({

	/**
	 * Merges relationship data from the client into the relationships
	 * already connected to this record. Any absolutely correct choices
	 * are made automatically, while choices that come down to preference
	 * are decided base on the configurable store properties.
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

	disconnectHasOneFromHasOne: function(name, meta) {

	},

	disconnectHasOneFromHasMany: function(name, meta) {

	},

	connectHasOneToNull: Em.aliasMethod('connectHasOneToHasMany'),

	connectHasOneToHasOne: function(name, meta, value) {

	},

	connectHasOneToHasMany: function(name, meta, value) {

	},

	connectHasManyToNull: Em.aliasMethod('connectHasManyToHasMany'),

	connectHasManyToHasOne: function(name, meta, values) {

	},

	connectHasManyToHasMany: function(name, meta, values) {
		var thisType = this.typeKey;
		var thisId = this.get('id');
		var store = this.get('store');
		var relationships = store.relationshipsForRecord(thisType, thisId, name);

		var valueSet = new Em.Set(map.call(values, function(value) {
			return value.type + ':' + value.id;
		}));

		// Upgrade any client relationships that match our values to server relationships
		var alreadyCreated = new Em.Set();
		forEach.call(relationships, function(relationship) {
			var key = relationship.otherType(this) + ':' + relationship.otherId(this);
			if (valueSet.contains(key)) {
				// If it's a client relationship, upgrade it
				// If it's a deleted relationship, but we're overriding the client, upgrade it
				if (relationship.get('state') === CLIENT_STATE) {
					store.changeRelationshipState(relationship, SERVER_STATE);
				} else if (relationship.get('state') === DELETED_STATE && !store.get('sideWithClientOnConflict')) {
					store.changeRelationshipState(relationship, SERVER_STATE);
				}
			}

			alreadyCreated.addObject(key);
		}, this);

		// Create the values that aren't already created
		forEach.call(values, function(value) {
			var key = value.type + ':' + value.id;
			if (!alreadyCreated.contains(key)) {
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