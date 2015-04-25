import AttributeType from 'ember-graph/attribute_type/type';

/**
 * @class StringType
 * @extends AttributeType
 * @constructor
 */
export default AttributeType.extend({

	/**
	 * Coerces the given value to a string, unless it's `null`,
	 * in which case it returns `null`.
	 *
	 * @method serialize
	 * @param {String} str
	 * @returns {String}
	 */
	serialize: function(str) {
		return (str === null || str === undefined ? null : '' + str);
	},

	/**
	 * Coerces the given value to a string, unless it's `null`,
	 * in which case it returns `null`.
	 *
	 * @method deserialize
	 * @param {String} json
	 * @returns {String}
	 */
	deserialize: function(json) {
		return (json === null || json === undefined ? null : '' + json);
	}
});