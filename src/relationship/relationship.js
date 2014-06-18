var CLIENT_STATE = 'client';
var SERVER_STATE = 'server';
var DELETED_STATED = 'deleted';

EG.Relationship = Em.Object.extend({

	typeKey1: null,

	id1: null,

	relationship1: null,

	typeKey2: null,

	id2: null,

	relationship2: null,

	otherType: function(record) {
		if (this.get('id1') === record.get('id')) {
			return this.get('type2');
		} else {
			return this.get('type1');
		}
	},

	otherId: function(record) {
		if (this.get('id1') === record.get('id')) {
			return this.get('id2');
		} else {
			return this.get('id1');
		}
	},

	otherName: function(record) {
		if (this.get('id1') === record.get('id')) {
			return this.get('relationship2');
		} else {
			return this.get('relationship1');
		}
	}
});

EG.Relationship.reopenClass({
	CLIENT_STATE: CLIENT_STATE,
	SERVER_STATE: SERVER_STATE,
	DELETED_STATED: DELETED_STATED
});