import Ember from 'ember';

function startsWith(string, prefix) {
	return string.indexOf(prefix) === 0;
}

function endsWith(string, suffix) {
	return string.indexOf(suffix, string.length - suffix.length) >= 0;
}

function capitalize(string) {
	return string[0].toLocaleUpperCase() + string.substring(1);
}

function decapitalize(string) {
	return string[0].toLocaleLowerCase() + string.substring(1);
}

if (Ember.EXTEND_PROTOTYPES === true || Ember.EXTEND_PROTOTYPES.String) {

	/**
	 * Polyfill for String.prototype.startsWith
	 *
	 * @method startsWith
	 * @param {String} prefix
	 * @return {Boolean}
	 * @namespace String
	 */
	String.prototype.startsWith = String.prototype.startsWith || function(prefix) {
		return startsWith(this, prefix);
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
		return endsWith(this, suffix);
	};

	/**
	 * Capitalizes the first letter of a string.
	 *
	 * @method capitalize
	 * @return {String}
	 * @namespace String
	 */
	String.prototype.capitalize = String.prototype.capitalize || function() {
		return capitalize(this);
	};

	/**
	 * Decapitalizes the first letter of a string.
	 *
	 * @method decapitalize
	 * @return {String}
	 * @namespace String
	 */
	String.prototype.decapitalize = String.prototype.decapitalize || function() {
		return decapitalize(this);
	};
}

export {
	startsWith,
	endsWith,
	capitalize,
	decapitalize
};