'use strict';

var execSync = require('child_process').execSync;

module.exports = function(grunt) {
	grunt.registerTask('setup_site_structure', function() {
		execSync('rm -rf site_build');
		execSync('mkdir -p site_build/api');

		execSync('cp -r site/fonts site_build/');
		execSync('cp -r site/javascripts site_build/');
		execSync('cp -r site/CNAME site_build/');
		execSync('cp -r site/index.html site_build/');

		execSync('mkdir -p site_build/stylesheets');
	});
};