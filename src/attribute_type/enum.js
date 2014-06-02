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

	defaultValue: Em.computed(function() {
		throw new Error('You must override the `defaultValue` in an enumeration type.');
	}).property(),

	values: [],

	_valuesSet: Em.computed(function() {
		return new Em.Set(this.get('values').map(function(value) {
			return value.toLocaleLowerCase();
		}));
	}).property(),

	_isValidValue: function(option) {
		return this.get('_valuesSet').contains(option.toLowerCase());
	},

	serialize: function(obj) {
		obj = obj + '';

		if (this._isValidValue(obj)) {
			return obj;
		} else {
			return this.get('defaultValue');
		}
	},

	deserialize: Em.aliasMethod('serialize'),

	isEqual: function(a, b) {
		if (Em.typeOf(a) !== 'string' || Em.typeOf(b) !== 'string') {
			return false;
		} else {
			return ((a + '').toLocaleLowerCase() === (b + '').toLocaleLowerCase());
		}
	}
});