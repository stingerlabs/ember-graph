'use strict';

module.exports = function(grunt) {
	grunt.registerMultiTask('build_test_runner', 'Creates the test runner file.', function() {
		var template = grunt.file.read('test/template.html.tmpl');
		var renderingContext = {
			data: {
				files: this.filesSrc
			}
		};

		grunt.file.write('test/index.html', grunt.template.process(template, renderingContext));
	});
};