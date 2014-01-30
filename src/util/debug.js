Eg.debug = {
	assert: function(message, test) {
		if (typeof test === 'function') {
			test = test();
		}

		if (!test) {
			throw new Error(message);
		}
	},

	warn: function(message) {
		console.warn(message);
	}
};