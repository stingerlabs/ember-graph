(function() {
	'use strict';

	// Save the original date object to do our heavy lifting
	var OriginalDate = Date;

	// Keep track of the difference between now and the desired time
	var difference = 0;

	var currentTime = function() {
		return OriginalDate.now() + difference;
	};

	// Create our custom Date object
	var PrimerDate = function() {
		// Why is this not better?
		// http://stackoverflow.com/questions/181348/instantiating-a-javascript-object-by-calling-prototype-constructor-apply

		var a = Array.prototype.slice.call(arguments, 0);

		if (a.length === 1 && !a[0]) {
			a = [];
		}

		var ret;

		switch(a.length) {
			case 0:
				ret = new OriginalDate(currentTime());
				break;
			case 1:
				ret = new OriginalDate(a[0]);
				break;
			case 2:
				ret = new OriginalDate(a[0], a[1]);
				break;
			case 3:
				ret = new OriginalDate(a[0], a[1], a[2]);
				break;
			case 4:
				ret = new OriginalDate(a[0], a[1], a[2], a[3]);
				break;
			case 5:
				ret = new OriginalDate(a[0], a[1], a[2], a[3], a[4]);
				break;
			case 6:
				ret = new OriginalDate(a[0], a[1], a[2], a[3], a[4], a[5]);
				break;
			case 7:
				ret = new OriginalDate(a[0], a[1], a[2], a[3], a[4], a[5], a[6]);
				break;
			default:
				throw new Error('You\'ve passed too many arguments to the `Date` constructor.');
		}

		if (this instanceof OriginalDate) {
			return ret;
		} else {
			return ret.toString();
		}
	};

	PrimerDate.prototype = OriginalDate.prototype;

	// Proxy the 3 functions on the Date function itself
	PrimerDate.now = function() {
		return currentTime();
	};

	PrimerDate.parse = OriginalDate.parse;

	PrimerDate.UTC = OriginalDate.UTC;

	/**
	 * Changes the time. If only one argument is used, the argument
	 * will be used as the current time (although it will continue
	 * to advance as usual). The single argument should be a date
	 * instance, a date string or a timestamp.
	 *
	 * If the second argument is true, then the first argument should
	 * be a timestamp, and will be used as the difference between
	 * the current time and the time that shows. For instance, using
	 * -5*60*1000 would set the time 5 minutes in the past.
	 */
	PrimerDate.setTime = function(time, diffOnly) {
		if (diffOnly) {
			if (typeof time === 'number') {
				difference = time;
			} else {
				throw new Error('The different for `setTime` must be a number.');
			}
		} else {
			if (time instanceof Date) {
				difference = time.getTime() - OriginalDate.now();
			} else if (typeof time === 'string' || typeof time === 'number') {
				difference = new OriginalDate(time).getTime() - OriginalDate.now();
			} else {
				throw new Error('`setTime` accepts a Date instance, a string date or a timestamp.');
			}
		}
	};


	// Reset any changes made using `setTime`.
	PrimerDate.resetTime = function() {
		difference = 0;
	};

	// Switch back to the original Date object, just in case
	PrimerDate.disablePrimer = function() {
		window.Date = OriginalDate;
	};

	// Enable the Primer Date object. Called on load by default
	window.enablePrimer = function() {
		window.Date = PrimerDate;
	};

	enablePrimer();
})();
