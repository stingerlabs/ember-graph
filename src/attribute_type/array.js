/**
 * Will coerce any value to a JSON array (`null` is a valid value).
 * Ember enumerables are converted to arrays using `toArray()`
 */
EG.ArrayType = EG.AttributeType.extend({

	/**
	 * @param {*} obj Javascript object
	 * @returns {Object} JSON representation
	 */
	serialize: function(obj) {
		if (Em.isNone(obj)) {
			return null;
		}

		obj = (obj.toArray ? obj.toArray() : obj);
		return (Em.isArray(obj) ? obj : null);
	},

	/**
	 * @param {Object} json JSON representation of object
	 * @returns {*} Javascript object
	 */
	deserialize: function(json) {
		return (Em.isArray(json) ? json : null);
	},

	/**
	 * @param {*} obj Javascript object
	 * @returns {Boolean} Whether or not the object is a valid value for this type
	 */
	isValid: function(obj) {
		try {
			JSON.stringify(obj);
			return Em.isArray(obj);
		} catch (e) {
			return false;
		}
	},

	/**
	 * @param {*} a Javascript Object
	 * @param {*} b Javascript Object
	 * @returns {Boolean} Whether or not the objects are equal or not
	 */
	isEqual: function(a, b) {
		if (!Em.isArray(a) || !Em.isArray(b)) {
			return false;
		}

		return Em.compare(a.toArray(), b.toArray()) === 0;
	}
});