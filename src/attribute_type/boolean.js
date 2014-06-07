/**
 * @class BooleanType
 * @extends AttributeType
 * @constructor
 */
EG.BooleanType = EG.AttributeType.extend({

	/**
	 * @property defaultValue
	 * @default false
	 * @final
	 */
	defaultValue: false,

	/**
	 * Coerces to a boolean using
	 * {{link-to-method 'BooleanType' 'coerceToBoolean'}}.
	 *
	 * @method serialize
	 * @param {Boolean} bool
	 * @return {Boolean}
	 */
	serialize: function(bool) {
		return this.coerceToBoolean(bool);
	},

	/**
	 * Coerces to a boolean using
	 * {{link-to-method 'BooleanType' 'coerceToBoolean'}}.
	 *
	 * @method deserialize
	 * @param {Boolean} json
	 * @return {Boolean}
	 */
	deserialize: function(json) {
		return this.coerceToBoolean(json);
	},

	/**
	 * Coerces a value to a boolean. `true` and `'true'` resolve to
	 * `true`, everything else resolves to `false`.
	 *
	 * @method coerceToBoolean
	 * @param {Any} obj
	 * @return {Boolean}
	 */
	coerceToBoolean: function(obj) {
		if (Em.typeOf(obj) === 'boolean' && obj == true) { // jshint ignore:line
			return true;
		}

		if (Em.typeOf(obj) === 'string' && obj == 'true') {  // jshint ignore:line
			return true;
		}

		return false;
	}
});