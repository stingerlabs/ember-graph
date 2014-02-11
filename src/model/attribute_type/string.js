/**
 * The string type expects only strings from the server and expects you
 * to only set string property types to string values. By default, the
 * validity function will prevent you from setting the value to a non-string.
 * Note: `null` counts as a valid string value.
 */
Eg.StringType = Eg.AttributeType.extend({
	/**
	 * @param {*} obj Javascript object
	 * @returns {Boolean} Whether or not the object is a valid value for this type
	 */
	isValid: function(obj) {
		return (obj === null || typeof obj === 'string');
	}
});

Eg.AttributeType.registerAttributeType('string', Eg.StringType);