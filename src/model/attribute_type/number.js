/**
 * The number type expects only numbers from the server and expects you
 * to only set number property types to number values. By default, the
 * validity function will prevent you from setting the value to a non-number.
 */
Eg.NumberType = Eg.AttributeType.extend({

	/**
	 * The default value to use if a value of this type is missing.
	 */
	defaultValue: 0,

	/**
	 * @param {*} obj Javascript object
	 * @returns {Boolean} Whether or not the object is a valid value for this type
	 */
	isValid: function(obj) {
		return (typeof obj === 'number');
	}
});

Eg.AttributeType.registerAttributeType('number', Eg.NumberType);