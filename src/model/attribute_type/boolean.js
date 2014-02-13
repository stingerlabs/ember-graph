/**
 * Will coerce any type to a boolean (`null` being the default). `null` is not a valid value.
 */
Eg.BooleanType = Eg.AttributeType.extend({

	/**
	 * The default value to use if a value of this type is missing.
	 */
	defaultValue: false,

	/**
	 * @param {*} obj Javascript object
	 * @returns {Object} JSON representation
	 */
	serialize: function(obj) {
		return !!obj;
	},

	/**
	 * @param {Object} json JSON representation of object
	 * @returns {*} Javascript object
	 */
	deserialize: function(json) {
		return !!json;
	},

	/**
	 * @param {*} obj Javascript object
	 * @returns {Boolean} Whether or not the object is a valid value for this type
	 */
	isValid: function(obj) {
		return (typeof obj === 'boolean');
	}
});

Eg.AttributeType.registerAttributeType('boolean', Eg.BooleanType);