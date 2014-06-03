/**
 * @class ArrayType
 * @extends AttributeType
 * @constructor
 */
EG.ArrayType = EG.AttributeType.extend({

	/**
	 * If the object is an array, it's returned. Otherwise, `null` is returned.
	 * This doesn't check the individual elements, just the array.
	 *
	 * @method serialize
	 * @param {Array} arr
	 * @returns {Array}
	 */
	serialize: function(arr) {
		if (Em.isNone(obj)) {
			return null;
		}

		obj = (obj.toArray ? obj.toArray() : obj);
		return (Em.isArray(obj) ? obj : null);
	},

	/**
	 * If the object is an array, it's returned. Otherwise, `null` is returned.
	 * This doesn't check the individual elements, just the array.
	 *
	 * @method deserialize
	 * @param {Array} arr
	 * @returns {Array}
	 */
	deserialize: function(arr) {
		return (Em.isArray(arr) ? arr : null);
	},

	/**
	 * Compares two arrays using `Ember.compare`.
	 *
	 * @method isEqual
	 * @param {Array} a
	 * @param {Array} b
	 * @returns {Boolean}
	 */
	isEqual: function(a, b) {
		if (!Em.isArray(a) || !Em.isArray(b)) {
			return false;
		}

		return Em.compare(a.toArray(), b.toArray()) === 0;
	}
});