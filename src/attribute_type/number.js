import Ember from 'ember';
import AttributeType from 'ember-graph/attribute_type/type';

/**
 * Will coerce any type to a number (0 being the default). `null` is not a valid value.
 *
 * @class NumberType
 * @extends AttributeType
 * @constructor
 */
export default AttributeType.extend({

	/**
	 * @property defaultValue
	 * @default 0
	 * @final
	 */
	defaultValue: 0,

	/**
	 * Coerces the given value to a number.
	 *
	 * @method serialize
	 * @param {Number} obj Javascript object
	 * @return {Number} JSON representation
	 */
	serialize: function(obj) {
		return this.coerceToNumber(obj);
	},

	/**
	 * Coerces the given value to a number.
	 *
	 * @method deserialize
	 * @param {Number} json JSON representation of object
	 * @return {Number} Javascript object
	 */
	deserialize: function(json) {
		return this.coerceToNumber(json);
	},

	/**
	 * If the object passed is a number (and not NaN), it returns
	 * the object coerced to a number primitive. If the object is
	 * a string, it attempts to parse it (again, no NaN allowed).
	 * Otherwise, the default value is returned.
	 *
	 * @method coerceToNumber
	 * @param {Any} obj
	 * @return {Number}
	 * @protected
	 */
	coerceToNumber: function(obj) {
		if (this.isValidNumber(obj)) {
			return Number(obj).valueOf();
		}

		if (Ember.typeOf(obj) === 'string') {
			var parsed = Number(obj).valueOf();
			if (this.isValidNumber(parsed)) {
				return parsed;
			}
		}

		return 0;
	},

	/**
	 * Determines if the given number is an actual number and finite.
	 *
	 * @method isValidNumber
	 * @param {Number} num
	 * @return {Boolean}
	 * @protected
	 */
	isValidNumber: function(num) {
		return (Ember.typeOf(num) === 'number' && !isNaN(num) && isFinite(num));
	}
});