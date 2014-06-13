'use strict';

var sh = require('execSync');

module.exports = function(grunt) {
	grunt.registerTask('setup_site_structure', function() {
		sh.run('rm -rf site');
		sh.run('mkdir -p site/api');

		sh.run('cp -r site_assets/fonts site/');
		sh.run('cp -r site_assets/javascripts site/');
		sh.run('cp -r site_assets/CNAME site/');
		sh.run('cp -r site_assets/index.html site/');

		sh.run('mkdir -p site/stylesheets');
		sh.run('cp -r site_assets/stylesheets/style.css site/stylesheets/');
	});
};