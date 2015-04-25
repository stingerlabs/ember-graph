import Ember from 'ember';

/**
 * Specifies the details of a custom attribute type.
 * Comes with reasonable defaults that can be used for some extended types.
 *
 * @class AttributeType
 * @constructor
 */
export default Ember.Object.extend({

	/**
	 * The default value to use if a value of this type is missing.
	 * Can be overridden in subclasses.
	 *
	 * @property defaultValue
	 * @type Any
	 * @default null
	 * @final
	 */
	defaultValue: null,

	/**
	 * Converts a value of this type to its JSON form.
	 * The default function returns the value given.
	 *
	 * @method serialize
	 * @param {Any} obj Javascript value
	 * @return {JSON} JSON representation
	 */
	serialize: function(obj) {
		return obj;
	},

	/**
	 * Converts a JSON value to its Javascript form.
	 * The default function returns the value given.
	 *
	 * @method deserialize
	 * @param {JSON} json JSON representation of object
	 * @return {Any} Javascript value
	 */
	deserialize: function(json) {
		return json;
	},

	/**
	 * Determines if two values of this type are equal.
	 * Defaults to using `===`.
	 *
	 * @method isEqual
	 * @param {Any} a Javascript object
	 * @param {Any} b Javascript object
	 * @returns {Boolean} Whether or not the objects are equal or not
	 */
	isEqual: function(a, b) {
		return (a === b);
	}
});