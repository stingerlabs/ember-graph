import Ember from 'ember';
import Relationship from 'ember-graph/relationship/relationship';

const { CLIENT_STATE, SERVER_STATE, DELETED_STATE } = Relationship;

export default {

	allRelationships: Ember.Object.create(),

	queuedRelationships: Ember.Object.create(),

	initializeRelationships: Ember.on('init', function() {
		this.setProperties({
			allRelationships: Ember.Object.create(),
			queuedRelationships: Ember.Object.create()
		});
	}),

	createRelationship(type1, id1, name1, type2, id2, name2, state) {
		const relationship = Relationship.create(type1, id1, name1, type2, id2, name2, state);

		const queuedRelationships = this.get('queuedRelationships');
		const record1 = this.getRecord(type1, id1);
		const record2 = this.getRecord(type2, id2);

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

	deleteRelationship(relationship) {
		const record1 = this.getRecord(relationship.get('type1'), relationship.get('id1'));
		const record2 = this.getRecord(relationship.get('type2'), relationship.get('id2'));

		this.disconnectRelationshipFrom(record1, relationship);
		this.disconnectRelationshipFrom(record2, relationship);

		const queuedRelationships = this.get('queuedRelationships');
		delete queuedRelationships[relationship.get('id')];
		this.notifyPropertyChange('queuedRelationships');

		delete this.get('allRelationships')[relationship.get('id')];
		delete this.get('queuedRelationships')[relationship.get('id')];

		relationship.erase();
	},

	changeRelationshipState(relationship, newState) {
		if (relationship.get('state') === newState) {
			return;
		}

		const record1 = this.getRecord(relationship.get('type1'), relationship.get('id1'));
		const record2 = this.getRecord(relationship.get('type2'), relationship.get('id2'));

		this.disconnectRelationshipFrom(record1, relationship);
		this.disconnectRelationshipFrom(record2, relationship);

		relationship.set('state', newState);

		this.connectRelationshipTo(record1, relationship);
		this.connectRelationshipTo(record2, relationship);
	},

	connectQueuedRelationships(record) {
		const queuedRelationships = this.get('queuedRelationships');
		const filtered = Object.keys(queuedRelationships).filter((id) => {
			return queuedRelationships[id].isConnectedTo(record);
		});

		if (filtered.length <= 0) {
			return;
		}

		filtered.forEach((id) => {
			const relationship = queuedRelationships[id];
			this.connectRelationshipTo(record, relationship);
			delete queuedRelationships[id];
		});

		this.notifyPropertyChange('queuedRelationships');
	},

	queueConnectedRelationships(record) {
		const queued = this.get('queuedRelationships');
		const server = record.get('relationships').getRelationshipsByState(SERVER_STATE);

		server.forEach((relationship) => {
			this.disconnectRelationshipFrom(record, relationship);
			queued[relationship.get('id')] = relationship;
		});

		this.notifyPropertyChange('queuedRelationships');
	},

	relationshipsForRecord(type, id, name) {
		const filtered = [];
		const all = this.get('allRelationships');

		Object.keys(all).forEach((key) => {
			if (all[key].matchesOneSide(type, id, name)) {
				filtered.push(all[key]);
			}
		});

		return filtered;
	},

	deleteRelationshipsForRecord(type, id) {
		Ember.changeProperties(() => {
			const all = this.get('allRelationships');
			const keys = Object.keys(all);

			keys.forEach((key) => {
				const relationship = all[key];

				if (relationship.get('type1') === type && relationship.get('id1') === id) {
					this.deleteRelationship(relationship);
				} else if (relationship.get('type2') === type && relationship.get('id2') === id) {
					this.deleteRelationship(relationship);
				}
			});
		});
	},

	/**
	 * @param {Model} record
	 * @param {Relationship} relationship
	 * @private
	 */
	connectRelationshipTo(record, relationship) {
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
	disconnectRelationshipFrom(record, relationship) {
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
	sortHasOneRelationships(type, id, name) {
		const values = {};
		const relationships = this.relationshipsForRecord(type, id, name);

		values[SERVER_STATE] = relationships.filter((relationship) => {
			return relationship.get('state') === SERVER_STATE;
		})[0] || null;

		values[DELETED_STATE] = relationships.filter((relationship) => {
			return relationship.get('state') === DELETED_STATE;
		});

		values[CLIENT_STATE] = relationships.filter((relationship) => {
			return relationship.get('state') === CLIENT_STATE;
		})[0] || null;

		Ember.runInDebug(() => {
			/* eslint-disable */
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
			/* eslint-enable */

			// Everything else is invalid
			Ember.assert('Invalid hasOne relationship values.');
		});

		return values;
	},

	updateRelationshipsWithNewId(typeKey, oldId, newId) {
		const all = this.get('allRelationships');

		Object.keys(all).forEach((id) => {
			all[id].changeId(typeKey, oldId, newId);
		});

		this.notifyPropertyChange('allRelationships');
	}

};
