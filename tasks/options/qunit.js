'use strict';

module.exports = {
	options: {
		coverage: {
			src: ['dist/ember-graph.js'],
			instrumentedFiles: 'temp/',
			lcovReport: 'report/'
		}
	},

	all: ['test/*.html']
};