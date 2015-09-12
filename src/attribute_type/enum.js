import Ember from 'ember';
import EmberGraphSet from 'ember-graph/util/set';
import AttributeType from 'ember-graph/attribute_type/type';

import { computed } from 'ember-graph/util/computed';


/**
 * Represents an enumeration or multiple choice type. This class cannot be
 * instantiated directly, you must extend the class, overriding both the
 * `defaultValue` and `values` properties. The `values` property must be
 * an array of unique strings (case insensitive). The `defaultValue` must
 * be a string, and the value must also exist in the `values` array.
 *
 * @class EnumType
 * @extends AttributeType
 * @constructor
 */
export default AttributeType.extend({

	/**
	 * The default enum value. Must be overridden in subclasses.
	 *
	 * @property defaultValue
	 * @type String
	 * @final
	 */
	defaultValue: computed({
		get() {
			throw new Ember.Error('You must override the `defaultValue` in an enumeration type.');
		}
	}),

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
	valueSet: computed('values', {
		get() {
			const set = EmberGraphSet.create();
			const values = this.get('values');

			set.addObjects(values.map((value) => value.toLocaleLowerCase()));

			return set;
		}
	}),

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
		const optionString = option + '';

		if (this.isValidValue(optionString)) {
			return optionString;
		} else {
			var defaultValue = this.get('defaultValue');

			if (this.isValidValue(defaultValue)) {
				return defaultValue;
			} else {
				throw new Ember.Error('The default value you provided isn\'t a valid value.');
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
	deserialize: Ember.aliasMethod('serialize'),

	/**
	 * Compares two enum values, case-insensitive.
	 * @param {String} a
	 * @param {String} b
	 * @return {Boolean}
	 */
	isEqual: function(a, b) {
		if (Ember.typeOf(a) !== 'string' || Ember.typeOf(b) !== 'string') {
			return false;
		} else {
			return ((a + '').toLocaleLowerCase() === (b + '').toLocaleLowerCase());
		}
	}
});