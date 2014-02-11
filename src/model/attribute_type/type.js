/**
 * Specifies the details of a custom attribute type.
 *
 * @class {AttributeType}
 */
Eg.AttributeType = Em.Object.extend({

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

Eg.AttributeType.reopenClass({

	/**
	 * @type {Object.<String, AttributeType>}
	 */
	_types: {},

	registerAttributeType: function(name, type) {
		var instance = (type instanceof Eg.AttributeType ? type : type.create());
		Eg.debug.assert('', instance instanceof Eg.AttributeType);
		this._types[name] = instance;
	},

	attributeTypeForName: function(name) {
		Eg.debug.assert('The attribute type \'' + name + '\' doesn\'t exist.', !!this._types[name]);
		return this._types[name];
	}
});