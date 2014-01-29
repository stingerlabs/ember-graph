Eg.BooleanTransform = Eg.Transform.extend({
	serialize: function(obj) {
		return !!obj;
	},

	deserialize: function(json) {
		return !!json;
	}
});

Eg.registerTypeTransform('boolean', Eg.BooleanTransform);