import Ember from 'ember';

var mapBy = function(property) {
	return this.map((item) => Ember.get(item, property));
};

export { mapBy };