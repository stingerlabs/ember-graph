/**
 * Specifies the details of a custom attribute type.
 *
 * @class {AttributeType}
 */
EG.AttributeType = Em.Object.extend({

	/**
	 * The default value to use if a value of this type is missing.
	 */
	defaultValue: null,

	/**
	 * @param {*} obj Javascript object
	 * @returns {Object} JSON representation
	 */
	serialize: function(obj) {
		return obj;
	},

	/**
	 * @param {Object} json JSON representation of object
	 * @returns {*} Javascript object
	 */
	deserialize: function(json) {
		return json;
	},

	/**
	 * @param {*} obj Javascript object
	 * @returns {Boolean} Whether or not the object is a valid value for this type
	 */
	isValid: function(obj) {
		return true;
	},

	/**
	 * @param {*} a Javascript Object
	 * @param {*} b Javascript Object
	 * @returns {Boolean} Whether or not the objects are equal or not
	 */
	isEqual: function(a, b) {
		return (a === b);
	}
});