'use strict';

var EMBER_VERSIONS = {
	'1.8.0': {
		development: 'ember-1.8.0/ember.js',
		production: 'ember-1.8.0/ember.prod.js'
	},
	'1.13.0': {
		development: 'ember-1.13.0/ember.debug.js',
		production: 'ember-1.13.0/ember.prod.js'
	},
	'2.0.0': {
		development: 'ember-2.0.0/ember.debug.js',
		production: 'ember-2.0.0/ember.prod.js'
	}
};

module.exports = function(grunt) {
	function buildRunners(release) {
		var template = grunt.file.read('test/template.html.tmpl');

		var renderingContext = {
			data: {
				sourceFile: (release ? 'ember-graph.min.js' : 'ember-graph.js'),
				files: this.filesSrc
			}
		};

		renderingContext.data.emberFile =
			(release ? EMBER_VERSIONS['1.8.0'].production : EMBER_VERSIONS['1.8.0'].development);
		renderingContext.data.includeHandlebars = true;
		grunt.file.write('test/ember-1.8.0.html', grunt.template.process(template, renderingContext));

		renderingContext.data.emberFile =
			(release ? EMBER_VERSIONS['1.13.0'].production : EMBER_VERSIONS['1.13.0'].development);
		renderingContext.data.includeHandlebars = false;
		grunt.file.write('test/ember-1.13.0.html', grunt.template.process(template, renderingContext));

		renderingContext.data.emberFile =
				(release ? EMBER_VERSIONS['2.0.0'].production : EMBER_VERSIONS['2.0.0'].development);
		renderingContext.data.includeHandlebars = false;
		grunt.file.write('test/ember-2.0.0.html', grunt.template.process(template, renderingContext));
	}

	grunt.registerMultiTask('build_test_runner', function() {
		buildRunners.call(this, false);
	});

	grunt.registerMultiTask('build_release_test_runner', function() {
		buildRunners.call(this, true);
	});
};