'use strict';

module.exports = {
	options: {
		filepathTransform: function(path) {
			return 'src/' + path;
		}
	},

	'ember-graph.js': 'src/main.js'
};