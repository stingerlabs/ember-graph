import Ember from 'ember';

import { generateUUID } from 'ember-graph/util/util';
import { RelationshipStates } from 'ember-graph/constants';
import { computed } from 'ember-graph/util/computed';

var CLIENT_STATE = RelationshipStates.CLIENT_STATE;
var SERVER_STATE = RelationshipStates.SERVER_STATE;
var DELETED_STATE = RelationshipStates.DELETED_STATE;

var Relationship = Ember.Object.extend({

	_state: CLIENT_STATE,
	state: computed('_state', {
		get() {
			return this.get('_state');
		},
		set(key, value) {
			switch (value) {
				case CLIENT_STATE:
				case SERVER_STATE:
				case DELETED_STATE:
					this.set('_state', value);
					break;
				default:
					Ember.assert('Invalid relationship state: ' + value);
					break;
			}
		}
	}),

	id: null,

	type1: null,

	id1: null,

	relationship1: null,

	type2: null,

	id2: null,

	relationship2: null,

	isConnectedTo: function(record) {
		if (this.get('type1') === record.typeKey && this.get('id1') === record.get('id')) {
			return true;
		}

		if (this.get('type2') === record.typeKey && this.get('id2') === record.get('id')) {
			return true;
		}

		return false;
	},

	matchesOneSide: function(type, id, name) {
		if (this.get('type1') === type && this.get('id1') === id && this.get('relationship1') === name) {
			return true;
		}

		if (this.get('type2') === type && this.get('id2') === id && this.get('relationship2') === name) {
			return true;
		}

		return false;
	},

	otherType: function(record) {
		// If they have the same type, it won't matter which branch is taken
		if (this.get('type1') === record.typeKey) {
			return this.get('type2');
		} else {
			return this.get('type1');
		}
	},

	otherId: function(record) {
		// If they have the same IDs, it won't matter which branch is taken
		if (this.get('id1') === record.get('id')) {
			return this.get('id2');
		} else {
			return this.get('id1');
		}
	},

	otherName: function(record) {
		if (this.get('id1') === record.get('id') && this.get('type1') === record.typeKey) {
			return this.get('relationship2');
		} else {
			return this.get('relationship1');
		}
	},

	thisName: function(record) {
		if (this.get('id1') === record.get('id') && this.get('type1') === record.typeKey) {
			return this.get('relationship1');
		} else {
			return this.get('relationship2');
		}
	},

	changeId: function(typeKey, oldId, newId) {
		if (this.get('type1') === typeKey && this.get('id1') === oldId) {
			this.set('id1', newId);
		} else if (this.get('type2') === typeKey && this.get('id2') === oldId) {
			this.set('id2', newId);
		}
	},

	erase: function() {
		this.setProperties({
			id: null,
			type1: null,
			id1: null,
			relationship1: null,
			type2: null,
			id2: null,
			relationship2: null,
			_state: null
		});
	}
});

Relationship.reopenClass({
	// TODO: NEW_STATE, SAVED_STATE, DELETED_STATE
	CLIENT_STATE: CLIENT_STATE,
	SERVER_STATE: SERVER_STATE,
	DELETED_STATE: DELETED_STATE,

	create(type1, id1, relationship1, type2, id2, relationship2, state) {
		Ember.assert('Invalid type or ID', type1 && id1 && type2 && id2);
		Ember.assert('First relationship must have a name', relationship1);
		Ember.assert('Second relationship must have a name or be null',
			relationship2 === null || Ember.typeOf(relationship2) === 'string');
		Ember.assert('Invalid state', state === CLIENT_STATE || state === SERVER_STATE || state === DELETED_STATE);

		const id = generateUUID();
		return this._super({ id, type1, id1, relationship1, type2, id2, relationship2, state });
	}
});

export default Relationship;