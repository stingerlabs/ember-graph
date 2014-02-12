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
		groundskeeper: config('groundskeeper'),
		neuter: config('neuter'),
		qunit: config('qunit'),
		uglify: config('uglify'),
		watch: config('watch')
	});

	grunt.loadNpmTasks('grunt-neuter');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-contrib-qunit');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-groundskeeper');

	grunt.task.loadTasks('./tasks');

	grunt.registerTask('develop', ['neuter', 'build_test_runner', 'connect:test', 'watch']);
	grunt.registerTask('test', ['neuter', 'build_test_runner', 'qunit:cli', 'clean:test']);
	grunt.registerTask('release', ['neuter', 'groundskeeper:compile', 'uglify:release']);
	grunt.registerTask('test_release', ['neuter', 'groundskeeper:compile',
		'uglify:release', 'build_test_runner', 'qunit:cli']);
};
