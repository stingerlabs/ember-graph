'use strict';

module.exports = function(grunt) {
	function buildRunner(release) {
		var template = grunt.file.read('test/template.html.tmpl');
		var renderingContext = {
			data: {
				sourceFile: (release ? 'ember-graph.min.js' : 'ember-graph.js'),
				files: this.filesSrc // jshint ignore:line
			}
		};

		grunt.file.write('test/index.html', grunt.template.process(template, renderingContext));
	}

	grunt.registerMultiTask('build_test_runner', function() {
		buildRunner.call(this, false);
	});

	grunt.registerMultiTask('build_release_test_runner', function() {
		buildRunner.call(this, true);
	});
};