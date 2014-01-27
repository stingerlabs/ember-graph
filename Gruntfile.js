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

		clean: config('clean'),
		neuter: config('neuter'),
		qunit: config('qunit')
	});

	grunt.loadNpmTasks('grunt-neuter');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-qunit');

	grunt.task.loadTasks('./tasks');

	grunt.registerTask('test', ['neuter', 'build_test_runner', 'qunit:cli', 'clean:test']);
};
