Eg.NumberTransform = Eg.Transform.extend({
	serialize: function(obj) {
		return Em.isEmpty(obj) ? null : Number(obj);
	},

	deserialize: function(json) {
		return Em.isEmpty(json) ? null : Number(json);
	}
});

Eg.registerTypeTransform('number', Eg.NumberTransform);