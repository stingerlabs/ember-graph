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
		connect: config('connect'),
		neuter: config('neuter'),
		qunit: config('qunit'),
		watch: config('watch')
	});

	grunt.loadNpmTasks('grunt-neuter');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-contrib-qunit');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.task.loadTasks('./tasks');

	grunt.registerTask('develop', ['neuter', 'build_test_runner', 'connect:test', 'watch']);
	grunt.registerTask('test', ['neuter', 'build_test_runner', 'qunit:cli', 'clean:test']);
};
