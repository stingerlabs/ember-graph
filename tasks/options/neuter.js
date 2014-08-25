'use strict';

var fs = require('fs');
var grunt = require('grunt');

String.prototype.endsWith = String.prototype.endsWith || function(suffix) {
	return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

module.exports = {
	main: {
		options: {
			basePath: 'src/'
		},

		src: 'src/main.js',
		dest: 'dist/ember-graph.js'
	}
};