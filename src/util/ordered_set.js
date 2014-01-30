Eg.OrderedSet = Em.CoreObject.extend(Em.MutableEnumerable, Em.Copyable, Em.Freezable, {
	length: 0,
	itemExistence: {},
	itemOrder: [],

	init: function() {
		this.itemExistence = {};
		this.itemOrder = [];
	},

	nextObject: function(index) {
		return this.itemOrder[index];
	},

	contains: function(object) {
		
	},

	addObject: function(object) {

	},

	removeObject: function(object) {

	}
});