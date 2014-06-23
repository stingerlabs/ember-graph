EG.ArrayPolyfills = {
	some: function(array, callback, thisArg) {
		for (var i = 0; i < array.length; ++i) {
			if (callback.call(thisArg, array[i], i, array)) {
				return true;
			}
		}
	}
};

if (Em.SHIM_ES5) {
	Array.prototype.some = Array.prototype.some || function(callback, thisArg) {
		return EG.ArrayPolyfills.some(this, callback, thisArg);
	};
}