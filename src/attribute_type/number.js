var isValidNumber = function(num) {
	return (Em.typeOf(num) === 'number' && !isNaN(num) && isFinite(num));
};

/**
 * Will coerce any type to a number (0 being the default). `null` is not a valid value.
 */
EG.NumberType = EG.AttributeType.extend({

	/**
	 * The default value to use if a value of this type is missing.
	 */
	defaultValue: 0,

	/**
	 * Will
	 *
	 * @param {*} obj Javascript object
	 * @returns {Object} JSON representation
	 */
	serialize: function(obj) {
		return this._coerceToNumber(obj);
	},

	/**
	 * @param {Object} json JSON representation of object
	 * @returns {*} Javascript object
	 */
	deserialize: function(json) {
		return this._coerceToNumber(json);
	},

	/**
	 * If the object passed is a number (and not NaN), it returns
	 * the object coerced to a number primitive. If the object is
	 * a string, it attempts to parse it (again, no NaN allowed).
	 * Otherwise, the default value (0) is returned.
	 *
	 * @param obj
	 * @returns {*}
	 * @private
	 */
	_coerceToNumber: function(obj) {
		if (isValidNumber(obj)) {
			return Number(obj);
		}

		if (Em.typeOf(obj) === 'string') {
			var parsed = Number(obj);
			if (isValidNumber(parsed)) {
				return parsed;
			}
		}

		return 0;
	}
});