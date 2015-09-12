import Ember from 'ember';
import AttributeType from 'ember-graph/attribute_type/type';

/**
 * @class ArrayType
 * @extends AttributeType
 * @constructor
 */
export default AttributeType.extend({

	/**
	 * If the object is an array, it's returned. Otherwise, `null` is returned.
	 * This doesn't check the individual elements, just the array.
	 *
	 * @method serialize
	 * @param {Array} arr
	 * @returns {Array}
	 */
	serialize: function(arr) {
		if (Ember.isNone(arr)) {
			return null;
		}

		return (Ember.isArray(arr.toArray ? arr.toArray() : arr) ? arr : null);
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
		return (Ember.isArray(arr) ? arr : null);
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
		if (!Ember.isArray(a) || !Ember.isArray(b)) {
			return false;
		}

		return Ember.compare(a.toArray(), b.toArray()) === 0;
	}
});