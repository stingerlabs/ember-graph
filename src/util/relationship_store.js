// TODO: This NEEDS tests

var map = Em.ArrayPolyfills.map;
var forEach = Em.ArrayPolyfills.forEach;

var CLIENT_STATE = EG.Relationship.CLIENT_STATE;
var SERVER_STATE = EG.Relationship.SERVER_STATE;
var DELETED_STATED = EG.Relationship.DELETED_STATED;

var RelationshipMap = Em.Object.extend({

	_length: 0,
	length: Em.computed(function(key, value) {

	}).property(),

	addRelationship: function(name, relationship) {
		if (this.hasOwnProperty(name)) {
			this.set(name + '.' + relationship.get('id'), relationship);
			this.notifyPropertyChange(name);
		} else {
			var o = new Em.Object();
			o.set(relationship.get('id'), relationship);
			this.set(name, o);
		}
	},

	removeRelationship: function(relationship) {
		var id = relationship.get('id');

		forEach.call(Em.keys(this), function(key) {
			if (key === 'length' || key === '_length') {
				return;
			}

			var o = this.get(key);
			if (typeof o === 'object' && o.hasOwnProperty(id)) {
				delete o[id];
				this.notifyPropertyChange(key);
			}
		}, this);
	},

	getRelationships: function(name) {
		var relationships = this.get(name) || {};

		return map.call(Em.keys(relationships), function(key) {
			return relationships[key];
		});
	},

	clearRelationships: function(name) {
		this.set(name, new Em.Object());
	}

});

EG.RelationshipStore = Em.Object.extend({

	server: null,

	client: null,

	deleted: null,

	initializeMaps: Em.computed(function() {
		this.setProperties({
			server: new RelationshipMap(),
			client: new RelationshipMap(),
			deleted: new RelationshipMap()
		});
	}).on('init'),

	getServerRelationships: function(name) {
		return this.get('server').getRelationships(name).concat(this.get('deleted').getRelationships(name));
	},

	getCurrentRelationships: function(name) {
		return this.get('server').getRelationships(name).concat(this.get('client').getRelationships(name));
	}
});