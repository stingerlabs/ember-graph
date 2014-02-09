Eg.Store.reopen({
	/**
	 * Holds all of the relationships that are waiting to be connected to a record
	 * when it gets loaded into the store. (relationship ID -> relationship)
	 *
	 * @type {Object.<String, Relationship>}
	 */
	_queuedRelationships: null,

	/**
	 * Will connect all queued relationships to the given record.
	 *
	 * @param {Model} record
	 * @private
	 */
	_connectQueuedRelationships: function(record) {
		var queued = this.get('_queuedRelationships');
		var toConnect = this._queuedRelationshipsFor(record.typeKey, record.get('id'));

		toConnect.forEach(function(relationship) {
			record._connectRelationship(relationship);
			delete queued[relationship.get('id')];
		});

		this.notifyPropertyChange('_queuedRelationships');
	},

	/**
	 * Gets all of the relationships that are queued to be connected to the given record.
	 * Does not deleted the relationships from the queue, just fetches them.
	 *
	 * @param {String} type
	 * @param {String} id
	 * @returns {Relationship[]}
	 * @private
	 */
	_queuedRelationshipsFor: function(type, id) {
		return Eg.util.values(this.get('_queuedRelationships')).filter(function(relationship) {
			return (relationship.get('type2') === type && relationship.get('object2') === id);
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
	 * @param {Boolean} saved True if a server side relationship, false if a client side relationship
	 */
	_createRelationship: function(type1, relationship1, id1, type2, relationship2, id2, saved) { // jshint ignore:line
		var record1 = this.getRecord(type1, id1);
		var record2 = this.getRecord(type2, id2);

		if (record1 === null && record2 === null) {
			return;
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
			return;
		}

		if (record1._isLinkedTo(relationship1, id2)) {
			// Do we need to check both sides, or can we assume consistency?
			return;
		}

		var relationship = Eg.Relationship.create({
			object1: record1,
			relationship1: relationship1,
			object2: id2,
			relationship2: relationship2,
			state: (saved ? 'saved' : 'new')
		});

		record1._connectRelationship(relationship);

		if (record2 !== null) {
			record2._connectRelationship(relationship);
		} else {
			this.set('_queuedRelationships.' + relationship.get('id'), relationship);
			this.notifyPropertyChange('_queuedRelationships');
		}
	},

	/**
	 * Deletes the given relationship. Disconnects from both records,
	 * then destroys, all references to the relationship.
	 *
	 * @param {String} id
	 * @private
	 */
	_deleteRelationship: function(id) {
		var relationship = Eg.Relationship.getRelationship(id);
		if (Em.isNone(relationship)) {
			return;
		}

		var object1 = relationship.get('object1');
		var object2 = relationship.get('object2');

		object1._disconnectRelationship(relationship);
		if (object2 instanceof Eg.Model) {
			object2._disconnectRelationship(relationship);
		} else {
			delete this.get('_queuedRelationships')[id];
			this.notifyPropertyChange('_queuedRelationships');
		}

		Eg.Relationship.deleteRelationship(id);
	}
});
