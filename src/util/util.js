/**
 * Denotes that method must be implemented in a subclass.
 * If it's not overridden, calling it will throw an error.
 *
 * @method required
 * @param {String} methodName
 * @return {Function}
 * @category top-level
 * @for EG
 */
EG.required = function(methodName) {
	return function() {
		throw new Error('You failed to implement the abstract `' + methodName + '` method.');
	};
};

/**
 * Generates a version 4 (random) UUID.
 *
 * @method generateUUID
 * @return {String}
 * @category top-level
 * @for EG
 */
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