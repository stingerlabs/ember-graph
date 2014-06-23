var filter = Em.ArrayPolyfills.filter;
var forEach = Em.ArrayPolyfills.forEach;

EG.Store.reopen({

	allRelationships: new Em.Object(),

	queuedRelationships: new Em.Object(),

	initializeRelationships: Em.on('init', function() {
		this.setProperties({
			allRelationships: new Em.Object(),
			queuedRelationships: new Em.Object()
		});
	}),

	createRelationship: function(type1, id1, name1, type2, id2, name2, state) { // jshint ignore:line
		var relationship = new EG.Relationship(type1, id1, name1, type2, id2, name2, state);

		var queuedRelationships = this.get('queuedRelationships');
		var record1 = this.getRecord(type1, id1);
		var record2 = this.getRecord(type2, id2);

		if (record1) {
			this.connectRelationshipTo(record1, relationship);
		}

		if (record2) {
			this.connectRelationshipTo(record2, relationship);
		}

		if (!record1 || !record2) {
			queuedRelationships[relationship.get('id')] = relationship;
			this.notifyPropertyChange('queuedRelationships');
		}

		this.get('allRelationships')[relationship.get('id')] = relationship;
	},

	deleteRelationship: function(relationship) {
		var record1 = this.getRecord(relationship.get('type1'), relationship.get('id1'));
		var record2 = this.getRecord(relationship.get('type2'), relationship.get('id2'));

		this.disconnectRelationshipFrom(record1, relationship);
		this.disconnectRelationshipFrom(record2, relationship);

		var queuedRelationships = this.get('queuedRelationships');
		delete queuedRelationships[relationship.get('id')];
		this.notifyPropertyChange('queuedRelationships');

		delete this.get('allRelationships')[relationship.get('id')];

		relationship.destroy();
	},

	changeRelationshipState: function(relationship, newState) {
		var record1 = this.getRecord(relationship.get('type1'), relationship.get('id1'));
		var record2 = this.getRecord(relationship.get('type2'), relationship.get('id2'));

		this.disconnectRelationshipFrom(record1, relationship);
		this.disconnectRelationshipFrom(record2, relationship);

		relationship.set('state', newState);

		this.connectRelationshipTo(record1, relationship);
		this.connectRelationshipTo(record2, relationship);
	},

	connectQueuedRelationships: function(record) {
		var queuedRelationships = this.get('queuedRelationships');
		var filtered = filter.call(queuedRelationships, function(relationship) {
			return relationship.isConnectedTo(record);
		});

		if (filtered.length <= 0) {
			return;
		}

		forEach.call(filtered, function(relationship) {
			this.connectRelationshipTo(record, relationship);
			delete queuedRelationships[relationship.get('id')];
		}, this);

		this.notifyPropertyChange('queuedRelationships');
	},

	relationshipsForRecord: function(type, id, name) {
		var data, filtered = [];
		var all = this.get('allRelationships');

		for (var i = 0; i < all.length; ++i) {
			if (all[i].matchesOneSide(type, id, name)) {
				filtered.push(all[i]);
			}
		}

		return filtered;
	},

	/**
	 * @param {Model} record
	 * @param {Relationship} relationship
	 * @private
	 */
	connectRelationshipTo: function(record, relationship) {
		if (!record) {
			return;
		}

		record.get('relationships').addRelationship(relationship.otherName(record), relationship);
	},

	/**
	 * @param {Model} record
	 * @param {Relationship} relationship
	 * @private
	 */
	disconnectRelationshipFrom: function(record, relationship) {
		if (!record) {
			return;
		}

		record.get('relationships').removeRelationship(relationship);
	}

});
