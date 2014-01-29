Eg.DateTransform = Eg.Transform.extend({
	serialize: function(obj) {
		return obj instanceof Date ? obj.getTime() : null;
	},

	deserialize: function(json) {
		return new Date(json);
	}
});

Eg.registerTypeTransform('date', Eg.DateTransform);