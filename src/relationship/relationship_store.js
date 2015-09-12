import Ember from 'ember';
import Relationship from 'ember-graph/relationship/relationship';
import EmberGraphSet from 'ember-graph/util/set';


var CLIENT_STATE = Relationship.CLIENT_STATE;
var SERVER_STATE = Relationship.SERVER_STATE;
var DELETED_STATE = Relationship.DELETED_STATE;

var STATE_MAP = {};
STATE_MAP[CLIENT_STATE] = 'client';
STATE_MAP[SERVER_STATE] = 'server';
STATE_MAP[DELETED_STATE] = 'deleted';

var RelationshipMap = Ember.Object.extend({

	length: 0,

	addRelationship: function(name, relationship) {
		if (this.hasOwnProperty(name)) {
			this.set(name + '.' + relationship.get('id'), relationship);
			this.notifyPropertyChange(name);
		} else {
			var o = Ember.Object.create();
			o.set(relationship.get('id'), relationship);
			this.set(name, o);
		}

		this.incrementProperty('length');
	},

	removeRelationship: function(id) {
		Object.keys(this).forEach(function(key) {
			if (key === 'length') {
				return;
			}

			var o = this.get(key);
			if (typeof o === 'object' && o.hasOwnProperty(id)) {
				delete o[id];
				this.notifyPropertyChange(key);
				this.decrementProperty('length');
			}
		}, this);
	},

	getRelationships: function(name) {
		var relationships = this.get(name) || {};

		return Object.keys(relationships).map(function(key) {
			return relationships[key];
		});
	},

	getAllRelationships: function() {
		var relationships = [];
		var keys = EmberGraphSet.create();
		keys.addObjects(Object.keys(this));
		keys = keys.without('length');

		keys.forEach(function(key) {
			relationships = relationships.concat(this.getRelationships(key));
		}, this);

		return relationships;
	},

	clearRelationships: function(name) {
		this.set(name, Ember.Object.create());
		this.recalculateLength();
	},

	recalculateLength: function() {
		var length = 0;

		Object.keys(this).forEach(function(key) {
			if (key !== 'length') {
				length += Object.keys(this[key]).length;
			}
		}, this);

		this.set('length', length);
	}

});

export default Ember.Object.extend({

	server: null,

	client: null,

	deleted: null,

	initializeMaps: Ember.on('init', function() {
		this.setProperties({
			server: RelationshipMap.create(),
			client: RelationshipMap.create(),
			deleted: RelationshipMap.create()
		});
	}),

	addRelationship: function(name, relationship) {
		if (name === null) {
			return;
		}

		return this.get(STATE_MAP[relationship.get('state')]).addRelationship(name, relationship);
	},

	removeRelationship: function(id) {
		if (Ember.typeOf(id) !== 'string') {
			id = Ember.get(id, 'id'); // eslint-disable-line no-param-reassign
		}

		this.get('server').removeRelationship(id);
		this.get('client').removeRelationship(id);
		this.get('deleted').removeRelationship(id);
	},

	clearRelationships: function(name) {
		this.get('server').clearRelationships(name);
		this.get('client').clearRelationships(name);
		this.get('deleted').clearRelationships(name);
	},

	getServerRelationships: function(name) {
		return this.get('server').getRelationships(name).concat(this.get('deleted').getRelationships(name));
	},

	getCurrentRelationships: function(name) {
		return this.get('server').getRelationships(name).concat(this.get('client').getRelationships(name));
	},

	getRelationshipsByState: function(state) {
		return this.get(STATE_MAP[state]).getAllRelationships();
	},

	getRelationshipsByName: function(name) {
		var server = this.get('server').getRelationships(name);
		var client = this.get('client').getRelationships(name);
		var deleted = this.get('deleted').getRelationships(name);

		return server.concat(client).concat(deleted);
	}
});