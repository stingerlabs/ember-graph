/**
 * Will coerce any type to a boolean (`null` being the default). `null` is not a valid value.
 */
EG.BooleanType = EG.AttributeType.extend({

	/**
	 * The default value to use if a value of this type is missing.
	 */
	defaultValue: false,

	/**
	 * @param {*} obj Javascript object
	 * @returns {Object} JSON representation
	 */
	serialize: function(obj) {
		return this._coerceToBoolean(obj);
	},

	/**
	 * @param {Object} json JSON representation of object
	 * @returns {*} Javascript object
	 */
	deserialize: function(json) {
		return this._coerceToBoolean(json);
	},

	/**
	 * The only things that equal true are: true (primitive or object) and 'true' (string).
	 * Everything else is false.
	 *
	 * @param obj
	 * @private
	 */
	_coerceToBoolean: function(obj) {
		if (Em.typeOf(obj) === 'boolean' && obj == true) { // jshint ignore:line
			return true;
		}

		if (Em.typeOf(obj) === 'string' && obj == 'true') {  // jshint ignore:line
			return true;
		}

		return false;
	},

	/**
	 * @param {*} obj Javascript object
	 * @returns {Boolean} Whether or not the object is a valid value for this type
	 */
	isValid: function(obj) {
		return (Em.typeOf(obj) === 'boolean');
	}
});