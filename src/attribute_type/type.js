/**
 * Specifies the details of a custom attribute type.
 * Comes with reasonable defaults that can be used for some extended types.
 *
 * @class AttributeType
 * @constructor
 */
EG.AttributeType = Em.Object.extend({

	/**
	 * The default value to use if a value of this type is missing.
	 * This defaults to `null`, but can be overridden in subclasses.
	 *
	 * @property defaultValue
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
	 * Determines if a value of this type is a valid value.
	 * This function will always be passed the Javascript
	 * representation of the value, not the JSON representation.
	 * The default function always returns `true`.
	 *
	 * @method isValid
	 * @param {Any} obj Javascript object
	 * @return {Boolean} Whether or not the object is a valid value for this type
	 */
	isValid: function(obj) {
		return true;
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