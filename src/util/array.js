// This function taken from Ember
var isNativeFunction = function(fn) {
	return fn && Function.prototype.toString.call(fn).indexOf('[native code]') >= 0;
};

EG.ArrayPolyfills = {

	/**
	 * Polyfill for Array.prototype.some
	 *
	 * @method some
	 * @param {Function} predicate
	 * @param {Any} thisArg
	 * @return {Boolean}
	 * @namespace Array
	 */
	some: isNativeFunction(Array.prototype.some) ? Array.prototype.some : function(predicate, thisArg) {
		if (this === void 0 || this === null) {
			throw new TypeError('Array.prototype.some called on null or undefined');
		}

		if (typeof predicate !== 'function') {
			throw new TypeError('predicate must be a function');
		}

		var list = Object(this);
		var length = list.length >>> 0; // jshint ignore:line

		for (var i = 0; i < length; ++i) {
			if (i in list && predicate.call(thisArg, list[i], i, list)) {
				return true;
			}
		}

		return false;
	},

	/**
	 * Polyfill for Array.prototype.reduce
	 *
	 * @method reduce
	 * @param {Function} predicate
	 * @param {Any} thisArg
	 * @return {Boolean}
	 * @namespace Array
	 */
	reduce: isNativeFunction(Array.prototype.reduce) ? Array.prototype.reduce : function(predicate, initialValue) {
		if (this === void 0 || this === null) {
			throw new TypeError('Array.prototype.reduce called on null or undefined');
		}

		if (typeof predicate !== 'function') {
			throw new TypeError('predicate must be a function');
		}

		var list = Object(this);
		var length = list.length >>> 0; // jshint ignore:line
		var value = initialValue;

		if (length <= 0 && arguments.length < 2) {
			throw new TypeError('Reduce of empty array with no initial value');
		}

		for (var i = 0; i < length; ++i) {
			if (i in list) {
				value = callback(value, list[i], i, list);
			}
		}

		return value;
	},

	mapBy: function(property) {
		return Em.ArrayPolyfills.map.call(this, function(item) {
			return Em.get(item, property);
		});
	}
};

if (Em.SHIM_ES5) {
	Array.prototype.some = Array.prototype.some || EG.ArrayPolyfills.some;

	Array.prototype.reduce = Array.prototype.reduce || EG.ArrayPolyfills.reduce;
}