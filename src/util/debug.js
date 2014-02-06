Eg.debug = function(fn) {
	fn();
};

Eg.debug.assert = function(message, test) {
	if (typeof message !== 'string') {
		test = message;
		message = 'Assertion failed.';
	}

	if (typeof test === 'function') {
		test = test();
	}

	if (!test) {
		throw new Error(message);
	}
};

Eg.debug.warn = function(message) {
	console.warn(message);
};