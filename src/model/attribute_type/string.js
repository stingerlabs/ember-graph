Eg.StringType = Eg.AttributeType.extend({

	/**
	 * @param {*} obj Javascript object
	 * @returns {Object} JSON representation
	 */
	serialize: function(obj) {
		return (obj === null ? null : '' + obj);
	},

	/**
	 * @param {Object} json JSON representation of object
	 * @returns {*} Javascript object
	 */
	deserialize: function(json) {
		return (json === null ? null : '' + json);
	},

	/**
	 * @param {*} obj Javascript object
	 * @returns {Boolean} Whether or not the object is a valid value for this type
	 */
	isValid: function(obj) {
		return (obj === null || typeof obj === 'string');
	}
});

Eg.AttributeType.registerAttributeType('string', Eg.StringType);