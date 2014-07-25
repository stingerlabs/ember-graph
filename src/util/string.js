EG.String = {
	startsWith: function(string, prefix) {
		return string.indexOf(prefix) === 0;
	},

	endsWith: function(string, suffix) {
		return string.indexOf(suffix, string.length - suffix.length) >= 0;
	},

	capitalize: function(string) {
		return string[0].toLocaleUpperCase() + string.substring(1);
	},

	decapitalize: function(string) {
		return string[0].toLocaleLowerCase() + string.substring(1);
	}
};

if (Em.EXTEND_PROTOTYPES === true || Em.EXTEND_PROTOTYPES.String) {

	/**
	 * Polyfill for String.prototype.startsWith
	 *
	 * @method startsWith
	 * @param {String} prefix
	 * @return {Boolean}
	 * @namespace String
	 */
	String.prototype.startsWith = String.prototype.startsWith || function(prefix) {
		return EG.String.startsWith(this, prefix);
	};

	/**
	 *Polyfill for String.prototype.endsWith
	 *
	 * @method endsWith
	 * @param {String} suffix
	 * @return {Boolean}
	 * @namespace String
	 */
	String.prototype.endsWith = String.prototype.endsWith || function(suffix) {
		return EG.String.endsWith(this, suffix);
	};

	/**
	 * Capitalizes the first letter of a string.
	 *
	 * @method capitalize
	 * @return {String}
	 * @namespace String
	 */
	String.prototype.capitalize = String.prototype.capitalize || function() {
		return EG.String.capitalize(this);
	};

	/**
	 * Decapitalizes the first letter of a string.
	 *
	 * @method decapitalize
	 * @return {String}
	 * @namespace String
	 */
	String.prototype.decapitalize = String.prototype.decapitalize || function() {
		return EG.String.decapitalize(this);
	};
}