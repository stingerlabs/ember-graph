'use strict';

module.exports = {
	options: {
		filepathTransform: function(filepath) {
			return 'src/' + filepath;
		}
	},

	'ember-graph.js': 'src/main.js'
};