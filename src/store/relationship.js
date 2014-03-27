EG.Store.reopen({

	/**
	 * A boolean for whether or not to reload dirty records. If this is
	 * true, data from the server will be merged with the data on the
	 * client according to the other options defined on this class.
	 * If it's false, calling reload on a dirty record will throw an
	 * error, and any side loaded data from the server will be discarded.
	 *
	 * Note: If this is turned off, no relationship can be reloaded if
	 * either of the records is dirty. So if the server says that
	 * record 1 is connected to record 2, and you reload record 1, which
	 * is clean, Ember-Graph will abort the reload if record 2 is dirty.
	 * This is a particularly annoying corner case that can be mostly
	 * avoided in two ways: either enable reloadDirty, or ensure that
	 * records are changed and then saved or rollback back in the same
	 * 'action'. (Don't let users perform different modifications at
	 * the same time.)
	 *
	 * @type {Boolean}
	 */
	reloadDirty: true,

	/**
	 * If reloadDirty is true, this determines which side the store will
	 * settle conflicts for. If true, new client side relationships always
	 * take precedence over server side relationships loaded when the
	 * record is dirty. If false, server side relationships will overwrite
	 * any temporary client side relationships on reload.
	 *
	 * Note: This only affects relationships. Attributes aren't as tricky,
	 * so the server data can be loaded without affecting the client data.
	 * To have the server overwrite client data, use the option below.
	 *
	 * @type {Boolean}
	 */
	sideWithClientOnConflict: true,

	/**
	 * If reloadDirty is true, this will overwrite client attributes on
	 * reload. Because of the more simplistic nature of attributes, it is
	 * recommended to keep this false. The server data will still be loaded
	 * into the record and can be activated at any time by rolling back
	 * attribute changes on the record.
	 *
	 * @type {Boolean}
	 */
	overwriteClientAttributes: false,

	/**
	 * Stores all of the relationships created so far.
	 *
	 * @type {Object.<String, Relationship>}
	 */
	_relationships: {},

	/**
	 * Holds all of the relationships that are waiting to be connected to a record
	 * when it gets loaded into the store. (relationship ID -> relationship)
	 *
	 * @type {Object.<String, Relationship>}
	 */
	_queuedRelationships: null,

	/**
	 * @param {String} typeKey
	 * @param {String} id
	 * @returns {Boolean}
	 */
	_hasQueuedRelationships: function(typeKey, id) {
		var queued = EG.util.values(this.get('_queuedRelationships'));

		for (var i = 0; i < queued.length; i = i + 1) {
			if (queued[i].get('type2') === typeKey && queued[i].get('object2') === id) {
				return true;
			}
		}

		return false;
	},

	/**
	 * Will connect all queued relationships to the given record.
	 *
	 * @param {Model} record
	 * @returns {Object[]} The objects to alert of changes, along with the corresponding properties
	 */
	_connectQueuedRelationships: function(record) {
		var alerts = [];
		var queued = this.get('_queuedRelationships');
		var toConnect = this._queuedRelationshipsFor(record.typeKey, record.get('id'));

		toConnect.forEach(function(relationship) {
			alerts.push(record._connectRelationship(relationship));
			relationship.set('object2', record);
			delete queued[relationship.get('id')];
		});

		this.notifyPropertyChange('_queuedRelationships');

		return alerts;
	},

	/**
	 * Gets all of the relationships that are queued to be connected to the given record.
	 * Does not deleted the relationships from the queue, just fetches them.
	 *
	 * @param {String} typeKey
	 * @param {String} id
	 * @returns {Relationship[]}
	 * @private
	 */
	_queuedRelationshipsFor: function(typeKey, id) {
		return EG.util.values(this.get('_queuedRelationships')).filter(function(relationship) {
			return (relationship.get('type2') === typeKey && relationship.get('object2') === id);
		});
	},

	/**
	 * Creates a new relationship and connects the two records,
	 * queueing the relationship if necessary.
	 *
	 * @param {String} type1
	 * @param {String} relationship1
	 * @param {String} id1
	 * @param {String} type2
	 * @param {String} relationship2
	 * @param {String} id2
	 * @param {String} state The state of the relationship
	 * @returns {Object[]} The objects to alert of changes, along with the corresponding properties
	 */
	_createRelationship: function(type1, relationship1, id1, type2, relationship2, id2, state) { // jshint ignore:line
		var alerts = [];
		var record1 = this.getRecord(type1, id1);
		var record2 = this.getRecord(type2, id2);

		if (record1 === null && record2 === null) {
			return alerts;
		}

		if (record1 === null) {
			var temp = record1;
			record1 = record2;
			record2 = temp;

			temp = id1;
			id1 = id2;
			id2 = id1;

			temp = relationship1;
			relationship1 = relationship2;
			relationship2 = temp;
		}

		if (relationship1 === null) {
			return alerts;
		}

		if (record1._isLinkedTo(relationship1, id2)) {
			// TODO: Do we need to check both sides, or can we assume consistency?
			return alerts;
		}

		var relationship = EG.Relationship.create({
			object1: record1,
			relationship1: relationship1,
			object2: (record2 === null ? id2 : record2),
			relationship2: relationship2,
			state: state
		});

		this.get('_relationships')[relationship.get('id')] = relationship;

		alerts.push(record1._connectRelationship(relationship));

		if (record2 !== null) {
			alerts.push(record2._connectRelationship(relationship));
		} else {
			this.set('_queuedRelationships.' + relationship.get('id'), relationship);
			this.notifyPropertyChange('_queuedRelationships');
		}

		return alerts;
	},

	/**
	 * Deletes the given relationship. Disconnects from both records,
	 * then destroys, all references to the relationship.
	 *
	 * @param {String} id
	 * @returns {Object[]} The objects to alert of changes, along with the corresponding properties
	 */
	_deleteRelationship: function(id) {
		var alerts = [];

		var relationship = this.get('_relationships')[id];
		if (Em.isNone(relationship)) {
			return alerts;
		}

		var object1 = relationship.get('object1');
		var object2 = relationship.get('object2');

		alerts.push(object1._disconnectRelationship(relationship));
		if (object2 instanceof EG.Model) {
			alerts.push(object2._disconnectRelationship(relationship));
		} else {
			delete this.get('_queuedRelationships')[id];
			this.notifyPropertyChange('_queuedRelationships');
		}

		delete this.get('_relationships')[id];

		return alerts;
	},

	/**
	 * @param {String} id
	 * @param {String} state
	 *
	 * @returns {Object[]} The objects to alert of changes, along with the corresponding properties
	 */
	_changeRelationshipState: function(id, state) {
		var alerts = [];

		var relationship = this.get('_relationships')[id];
		if (Em.isNone(relationship) || relationship.get('state') === state) {
			return alerts;
		}

		var object1 = relationship.get('object1');
		var object2 = relationship.get('object2');

		var oldHash = EG.Relationship.stateToHash(relationship.get('state'));
		var newHash = EG.Relationship.stateToHash(state);

		relationship.set('state', state);

		object1.set(newHash + '.' + id, object1.get(oldHash + '.' + id));
		delete object1.get(oldHash)[id];
		alerts.push({ record: object1, property: oldHash });
		alerts.push({ record: object1, property: newHash });

		if (object2 instanceof EG.Model) {
			object2.set(newHash + '.' + id, object2.get(oldHash + '.' + id));
			delete object2.get(oldHash)[id];
			alerts.push({ record: object2, property: oldHash });
			alerts.push({ record: object2, property: newHash });
		}

		return alerts;
	},

	/**
	 * Gets all relationships related to the given record.
	 *
	 * @param {String} typeKey
	 * @param {String} name
	 * @param {String} id
	 * @returns {Boolean}
	 */
	_relationshipsForRecord: function(typeKey, name, id) {
		return EG.util.values(this.get('_relationships')).filter(function(relationship) {
			if (relationship.get('type1') === typeKey && relationship.get('id') === id &&
				relationship.get('relationship1') === name) {
				return true;
			}

			if (relationship.get('type2') === typeKey && relationship.get('relationship2') === name) {
				var object2 = relationship.get('object2');

				if (typeof object2 === 'string') {
					if (object2 === id) {
						return true;
					}
				} else if (object2.get('id') === id) {
					return true;
				}
			}

			return false;
		});
	},

	_deleteRelationshipsForRecord: function(typeKey, id) {
		var alerts = [];
		var relationships = EG.util.values(this.get('_relationships'));

		relationships.forEach(function(relationship) {
			if (relationship.isConnectedTo(typeKey, id)) {
				alerts = alerts.concat(this._deleteRelationship(Em.get(relationship, 'id')));
			}
		}, this);

		alerts.forEach(function(alert) {
			Em.tryInvoke(alert.record, 'notifyPropertyChange', [alert.property]);
		});
	}
});
