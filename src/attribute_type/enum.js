/**
 * Represents an enumeration or multiple choice type. This class cannot be
 * instantiated directly, you must extend the class, overriding both the
 * `defaultValue` and `values` properties. The `values` property must be
 * an array of unique strings (case insensitive). The `defaultValue` must
 * be a string, and the value must also exist in the `values` array.
 *
 * @class EnumType
 */
EG.EnumType = EG.AttributeType.extend({

	/**
	 * The default enum value. Must be overridden in subclasses.
	 *
	 * @property defaultValue
	 * @type String
	 * @final
	 */
	defaultValue: Em.computed(function() {
		throw new Error('You must override the `defaultValue` in an enumeration type.');
	}).property(),

	/**
	 * @property values
	 * @type {Array<String>}
	 * @default []
	 * @final
	 */
	values: [],

	/**
	 * Contains all of the values converted to lower case.
	 *
	 * @property valueSet
	 * @type {Set<String>}
	 * @default []
	 * @final
	 */
	valueSet: Em.computed(function() {
		return new EG.Set(this.get('values').map(function(value) {
			return value.toLocaleLowerCase();
		}));
	}).property('values'),

	/**
	 * Determines if the given option is a valid enum value.
	 *
	 * @property isValidValue
	 * @param {String} option
	 * @return {Boolean}
	 */
	isValidValue: function(option) {
		return this.get('valueSet').contains(option.toLowerCase());
	},

	/**
	 * Converts the given option to a valid enum value.
	 * If the given value isn't valid, it uses the default value.
	 *
	 * @method serialize
	 * @param {String} option
	 * @return {String}
	 */
	serialize: function(option) {
		option = option + '';

		if (this.isValidValue(option)) {
			return option;
		} else {
			var defaultValue = this.get('defaultValue');

			if (this.isValidValue(defaultValue)) {
				return defaultValue;
			} else {
				throw new Error('The default value you provided isn\'t a valid value.');
			}
		}
	},

	/**
	 *
	 * Converts the given option to a valid enum value.
	 * If the given value isn't valid, it uses the default value.
	 *
	 * @method deserialize
	 * @param {String} option
	 * @return {String}
	 */
	deserialize: Em.aliasMethod('serialize'),

	/**
	 * Compares two enum values, case-insensitive.
	 * @param {String} a
	 * @param {String} b
	 * @return {Boolean}
	 */
	isEqual: function(a, b) {
		if (Em.typeOf(a) !== 'string' || Em.typeOf(b) !== 'string') {
			return false;
		} else {
			return ((a + '').toLocaleLowerCase() === (b + '').toLocaleLowerCase());
		}
	}
});