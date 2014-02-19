var isObject = function(obj) {
	return !Em.isNone(obj) && typeof obj === 'object' && obj.constructor === Object;
};

var deepCompare = function(a, b) {
	if (isObject(a) && isObject(b)) {
		if (!new Em.Set(Em.keys(a)).isEqual(new Em.Set(Em.keys(b)))) {
			return false;
		}

		var keys = Em.keys(a);

		for (var i = 0; i < keys.length; i = i + 1) {
			if (!deepCompare(a[keys[i]], b[keys[i]])) {
				return false;
			}
		}

		return true;
	} else if (Em.isArray(a) && Em.isArray(b)) {
		return Em.compare(a, b) === 0;
	} else {
		return (a === b);
	}
};

/**
 * Will coerce any value to a JSON object (`null` is a valid value).
 * If JSON.stringify fails because the object is circular, it uses null instead.
 */
EG.ObjectType = EG.AttributeType.extend({

	/**
	 * @param {*} obj Javascript object
	 * @returns {Object} JSON representation
	 */
	serialize: function(obj) {
		if (isObject(obj)) {
			try {
				JSON.stringify(obj);
				return obj;
			} catch (e) {
				return null;
			}
		} else {
			return null;
		}
	},

	/**
	 * @param {Object} json JSON representation of object
	 * @returns {*} Javascript object
	 */
	deserialize: function(json) {
		if (isObject(json)) {
			return json;
		} else {
			return null;
		}
	},

	/**
	 * @param {*} obj Javascript object
	 * @returns {Boolean} Whether or not the object is a valid value for this type
	 */
	isValid: function(obj) {
		try {
			JSON.stringify(obj);
			return isObject(obj);
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
		if (!isObject(a) || !isObject(b)) {
			return false;
		}

		return deepCompare(a, b);
	}
});