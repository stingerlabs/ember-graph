/**
 * The date type expects only timestamps from the server and expects you
 * to only the set date property types to date objects. By default, the
 * validity function will prevent you from setting the value to a non-date.
 * Note: `null` counts as a valid date value.
 */
Eg.DateType = Eg.AttributeType.extend({

	/**
	 * @param {*} obj Javascript object
	 * @returns {Object} JSON representation
	 */
	serialize: function(obj) {
		return (obj === null ? null : obj.getTime());
	},

	/**
	 * @param {Object} json JSON representation of object
	 * @returns {*} Javascript object
	 */
	deserialize: function(json) {
		return (json === null ? null : new Date(json));
	},

	/**
	 * @param {*} obj Javascript object
	 * @returns {Boolean} Whether or not the object is a valid value for this type
	 */
	isValid: function(obj) {
		return (obj === null || obj instanceof Date);
	},

	/**
	 * @param {*} a Javascript Object
	 * @param {*} b Javascript Object
	 * @returns {Boolean} Whether or not the objects are equal or not
	 */
	isEqual: function(a, b) {
		var aNone = (a === null);
		var bNone = (b === null);

		if (aNone && bNone) {
			return true;
		} else if ((aNone && !bNone) || (!aNone && bNone)) {
			return false;
		} else {
			return (new Date(a).getTime() === new Date(b).getTime());
		}
	}
});

Eg.AttributeType.registerAttributeType('date', Eg.DateType);