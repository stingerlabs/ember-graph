var map = Em.ArrayPolyfills.map;
var forEach = Em.ArrayPolyfills.forEach;

var CLIENT_STATE = EG.Relationship.CLIENT_STATE;
var SERVER_STATE = EG.Relationship.SERVER_STATE;
var DELETED_STATE = EG.Relationship.DELETED_STATE;

var STATE_MAP = {};
STATE_MAP[CLIENT_STATE] = 'client';
STATE_MAP[SERVER_STATE] = 'server';
STATE_MAP[DELETED_STATE] = 'deleted';

var RelationshipMap = Em.Object.extend({

	length: 0,

	addRelationship: function(name, relationship) {
		if (this.hasOwnProperty(name)) {
			this.set(name + '.' + relationship.get('id'), relationship);
			this.notifyPropertyChange(name);
		} else {
			var o = new Em.Object();
			o.set(relationship.get('id'), relationship);
			this.set(name, o);
		}

		this.incrementProperty('length');
	},

	removeRelationship: function(id) {
		forEach.call(Em.keys(this), function(key) {
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

		return map.call(Em.keys(relationships), function(key) {
			return relationships[key];
		});
	},

	getAllRelationships: function() {
		var relationships = [];
		var keys = new EG.Set(Em.keys(this)).without('length');

		forEach.call(keys, function(key) {
			relationships = relationships.concat(this.getRelationships(key));
		}, this);

		return relationships;
	},

	clearRelationships: function(name) {
		this.set(name, new Em.Object());
		this.recalculateLength();
	},

	recalculateLength: function() {
		var length = 0;

		forEach.call(Em.keys(this), function(key) {
			if (key !== 'length') {
				length += Em.keys(this[key]).length;
			}
		}, this);

		this.set('length', length);
	}

});

EG.RelationshipStore = Em.Object.extend({

	server: null,

	client: null,

	deleted: null,

	initializeMaps: Em.on('init', function() {
		this.setProperties({
			server: new RelationshipMap(),
			client: new RelationshipMap(),
			deleted: new RelationshipMap()
		});
	}),

	addRelationship: function(name, relationship) {
		if (name === null) {
			return;
		}

		return this.get(STATE_MAP[relationship.get('state')]).addRelationship(name, relationship);
	},

	removeRelationship: function(id) {
		if (Em.typeOf(id) !== 'string') {
			id = Em.get(id, 'id');
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