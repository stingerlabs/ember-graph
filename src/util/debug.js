EG.debug = function(fn) {
	fn();
};

EG.debug(function() {
	window.DEBUG_MODE = true;
});

EG.debug.assert = function(message, test) {
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

EG.debug.warn = function(message) {
	console.warn(message);
};