/**
 * The boolean type expects only booleans from the server and expects you
 * to only set boolean property types to boolean values. By default, the
 * validity function will prevent you from setting the value to a non-boolean.
 */
Eg.BooleanType = Eg.AttributeType.extend({

	/**
	 * The default value to use if a value of this type is missing.
	 */
	defaultValue: false,

	/**
	 * @param {*} obj Javascript object
	 * @returns {Boolean} Whether or not the object is a valid value for this type
	 */
	isValid: function(obj) {
		return (typeof obj === 'boolean');
	}
});

Eg.AttributeType.registerAttributeType('boolean', Eg.BooleanType);