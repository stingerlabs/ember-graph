'use strict';

var sh = require('execSync');

module.exports = function(grunt) {
	grunt.registerTask('setup_site_structure', function() {
		sh.run('rm -rf site_build');
		sh.run('mkdir -p site_build/api');

		sh.run('cp -r site/fonts site_build/');
		sh.run('cp -r site/javascripts site_build/');
		sh.run('cp -r site/CNAME site_build/');
		sh.run('cp -r site/index.html site_build/');

		sh.run('mkdir -p site_build/stylesheets');
	});
};