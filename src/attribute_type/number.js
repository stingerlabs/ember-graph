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
		if (this.isValid(obj)) {
			return Number(obj);
		}

		if (Em.typeOf(obj) === 'string') {
			var parsed = Number(obj);
			if (this.isValid(parsed)) {
				return parsed;
			}
		}

		return 0;
	},

	/**
	 * @param {*} obj Javascript object
	 * @returns {Boolean} Whether or not the object is a valid value for this type
	 */
	isValid: function(obj) {
		return (Em.typeOf(obj) === 'number' && !isNaN(obj) && isFinite(obj));
	}
});