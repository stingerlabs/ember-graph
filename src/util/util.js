EG.util = {
	generateGUID: function() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random()*16|0; // jshint ignore:line
			var v = (c == 'x' ? r : (r&0x3|0x8)); // jshint ignore:line
			return v.toString(16);
		});
	},

	/**
	 * @deprecated
	 */
	values: function(obj) {
		return Em.keys(obj).map(function(key) {
			return obj[key];
		});
	}
};