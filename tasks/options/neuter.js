'use strict';

var fs = require('fs');
var grunt = require('grunt');

String.prototype.endsWith = String.prototype.endsWith || function(suffix) {
	return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

module.exports = {
	main: {
		options: {
			basePath: 'src/',
			process: function(src, filepath) {
				if (filepath === 'src/main.js') {
					var file = fs.readFileSync('bower.json', 'utf8');
					var json = JSON.parse(file);
					return grunt.template.process(src, { data: { version: json.version } });
				}

				return src;
			}
		},

		src: 'src/main.js',
		dest: 'dist/ember-graph.js'
	}
};