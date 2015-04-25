'use strict';

var config = function(moduleName) {
	return require('./tasks/options/' + moduleName);
};

module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		build_test_runner: {
			all: ['test/**/*.js']
		},

		build_release_test_runner: {
			all: ['test/**/*.js']
		},

		clean: config('clean'),
		connect: config('connect'),
		groundskeeper: config('groundskeeper'),
		jshint: config('jshint'),
		qunit: config('qunit'),
		sass: config('sass'),
		uglify: config('uglify'),
		watch: config('watch'),
		yuidoc: config('yuidoc')
	});

	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-yuidoc');
	grunt.loadNpmTasks('grunt-groundskeeper');
	grunt.loadNpmTasks('grunt-qunit-istanbul');
	grunt.loadNpmTasks('grunt-sass');

	grunt.task.loadTasks('./tasks');

	grunt.registerTask('develop', ['transpile', 'build_test_runner', 'connect:test', 'watch']);
	grunt.registerTask('test', ['transpile', 'build_test_runner', 'qunit:all', 'clean:test']);
	grunt.registerTask('release', ['jshint:source', 'transpile', 'groundskeeper:compile',
		'uglify:release', 'build_release_test_runner', 'qunit:all']);

	grunt.registerTask('build_site', ['yuidoc', 'register_handlebars_helpers', 'convert_documentation_data',
		'setup_site_structure', 'sass', 'build_api_pages']);
};
