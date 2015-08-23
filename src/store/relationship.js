import Ember from 'ember';
import Relationship from 'ember-graph/relationship/relationship';


var CLIENT_STATE = Relationship.CLIENT_STATE;
var SERVER_STATE = Relationship.SERVER_STATE;
var DELETED_STATE = Relationship.DELETED_STATE;

export default {

	allRelationships: Ember.Object.create(),

	queuedRelationships: Ember.Object.create(),

	initializeRelationships: Ember.on('init', function() {
		this.setProperties({
			allRelationships: Ember.Object.create(),
			queuedRelationships: Ember.Object.create()
		});
	}),

	createRelationship: function(type1, id1, name1, type2, id2, name2, state) { // jshint ignore:line
		var relationship = Relationship.create(type1, id1, name1, type2, id2, name2, state);

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
		delete this.get('queuedRelationships')[relationship.get('id')];

		relationship.erase();
	},

	changeRelationshipState: function(relationship, newState) {
		if (relationship.get('state') === newState) {
			return;
		}

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
		var filtered = Object.keys(queuedRelationships).filter(function(id) {
			return queuedRelationships[id].isConnectedTo(record);
		});

		if (filtered.length <= 0) {
			return;
		}

		filtered.forEach(function(id) {
			var relationship = queuedRelationships[id];
			this.connectRelationshipTo(record, relationship);
			delete queuedRelationships[id];
		}, this);

		this.notifyPropertyChange('queuedRelationships');
	},

	queueConnectedRelationships: function(record) {
		var queued = this.get('queuedRelationships');
		var server = record.get('relationships').getRelationshipsByState(SERVER_STATE);

		server.forEach(function(relationship) {
			this.disconnectRelationshipFrom(record, relationship);
			queued[relationship.get('id')] = relationship;
		}, this);

		this.notifyPropertyChange('queuedRelationships');
	},

	relationshipsForRecord: function(type, id, name) {
		var data, filtered = [];
		var all = this.get('allRelationships');

		Object.keys(all).forEach(function(key) {
			if (all[key].matchesOneSide(type, id, name)) {
				filtered.push(all[key]);
			}
		});

		return filtered;
	},

	deleteRelationshipsForRecord: function(type, id) {
		Ember.changeProperties(function() {
			var all = this.get('allRelationships');
			var keys = Object.keys(all);

			keys.forEach(function(key) {
				var relationship = all[key];

				if (relationship.get('type1') === type && relationship.get('id1') === id) {
					this.deleteRelationship(relationship);
				} else if (relationship.get('type2') === type && relationship.get('id2') === id) {
					this.deleteRelationship(relationship);
				}
			}, this);
		}, this);
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

		record.get('relationships').addRelationship(relationship.thisName(record), relationship);
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
	},

	/**
	 * Takes the relationships for a hasOne relationship, and sorts them in
	 * an object that is easy to manipulate. The object returned contains
	 * the following properties:
	 *
	 * - `[SERVER_STATE]` - A single relationship or `null`
	 * - `[CLIENT_STATE]` - A single relationship or `null`
	 * - `[DELETED_STATE]` - An array of relationships
	 *
	 * There are 5 valid configurations for a hasOne relationship at any
	 * given time:
	 *
	 * 1. No relationships connected
	 * 2. A single server relationship is connected
	 * 3. A single client relationship is connected
	 * 4. One or more delete relationships is connected
	 * 5. A single client relationship, along with one or more deleted relationships
	 *
	 * This function will make assertions to ensure that the relationship
	 * exists in one of these 5 states.
	 *
	 * @param {String} type
	 * @param {String} id
	 * @param {String} name
	 * @returns {Object}
	 */
	sortHasOneRelationships: function(type, id, name) {
		var values = {};
		var relationships = this.relationshipsForRecord(type, id, name);

		values[SERVER_STATE] = relationships.filter(function(relationship) {
			return relationship.get('state') === SERVER_STATE;
		})[0] || null;

		values[DELETED_STATE] = relationships.filter(function(relationship) {
			return relationship.get('state') === DELETED_STATE;
		});

		values[CLIENT_STATE] = relationships.filter(function(relationship) {
			return relationship.get('state') === CLIENT_STATE;
		})[0] || null;

		Ember.runInDebug(function() {
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
			Ember.assert('Invalid hasOne relationship values.');
			/* jshint ignore:end */
		});

		return values;
	},

	updateRelationshipsWithNewId: function(typeKey, oldId, newId) {
		var all = this.get('allRelationships');

		Object.keys(all).forEach(function(id) {
			all[id].changeId(typeKey, oldId, newId);
		});

		this.notifyPropertyChange('allRelationships');
	}

};
