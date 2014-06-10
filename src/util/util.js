EG.required = function(methodName) {
	return function() {
		throw new Error('You failed to implement the abstract `' + methodName + '` method.');
	};
};

EG.generateUUID = function() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random()*16|0; // jshint ignore:line
		var v = (c == 'x' ? r : (r&0x3|0x8)); // jshint ignore:line
		return v.toString(16);
	});
};

EG.util = {

	/**
	 * @deprecated
	 */
	generateGUID: EG.generateUUID,

	/**
	 * @deprecated
	 */
	values: function(obj) {
		return Em.keys(obj).map(function(key) {
			return obj[key];
		});
	}
};