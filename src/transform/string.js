Eg.StringTransform = Eg.Transform.extend({
	serialize: function(obj) {
		return Em.isNone(obj) ? null : String(obj);
	},

	deserialize: function(json) {
		return Em.isNone(json) ? null : String(json);
	}
});

Eg.registerTypeTransform('string', Eg.StringTransform);