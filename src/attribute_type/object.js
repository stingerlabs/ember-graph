/**
 * @class ObjectType
 * @extends AttributeType
 * @constructor
 */
EG.ObjectType = EG.AttributeType.extend({

	/**
	 * If the value is a JSON object, it's returned.
	 * Otherwise, it serializes to `null`.
	 *
	 * @method serialize
	 * @param {Object} obj
	 * @return {Object}
	 */
	serialize: function(obj) {
		if (this.isObject(obj)) {
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
	 * Returns the value if it's an object, `null` otherwise.
	 *
	 * @method deserialize
	 * @param {Object} json
	 * @return {Object}
	 */
	deserialize: function(json) {
		if (this.isObject(json)) {
			return json;
		} else {
			return null;
		}
	},

	/**
	 * Checks for equality using
	 * {{#link-to-method 'ObjectType', 'deepCompare'}}deepCompare{{/link-to-method}}.
	 *
	 * @method isEqual
	 * @param {Object} a
	 * @param {Object} b
	 * @return {Boolean}
	 */
	isEqual: function(a, b) {
		if (!this.isObject(a) || !this.isObject(b)) {
			return false;
		}

		return this.deepCompare(a, b);
	},

	/**
	 * Determines if the value is a plain Javascript object.
	 *
	 * @method isObject
	 * @param {Object} obj
	 * @return {Boolean}
	 */
	isObject: function(obj) {
		return !Em.isNone(obj) && Em.typeOf(obj) === 'object' && obj.constructor === Object;
	},

	/**
	 * Performs a deep comparison on the objects, iterating
	 * objects and arrays, and using `===` on primitives.
	 *
	 * @method deepCompare
	 * @param {Object} a
	 * @param {Object} b
	 * @return {Boolean}
	 */
	deepCompare: function(a, b) {
		if (this.isObject(a) && this.isObject(b)) {
			if (!new Em.Set(Em.keys(a)).isEqual(new Em.Set(Em.keys(b)))) {
				return false;
			}

			var keys = Em.keys(a);

			for (var i = 0; i < keys.length; i = i + 1) {
				if (!this.deepCompare(a[keys[i]], b[keys[i]])) {
					return false;
				}
			}

			return true;
		} else if (Em.isArray(a) && Em.isArray(b)) {
			return Em.compare(a, b) === 0;
		} else {
			return (a === b);
		}
	}
});