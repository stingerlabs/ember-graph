'use strict';

var fs = require('fs');
var sh = require('execSync');
var AWS = require('aws-sdk');
var AdmZip = require('adm-zip');

module.exports = function(grunt) {
	grunt.registerTask('upload_builds_to_s3', function() {
		var done = this.async();
		var hash = sh.exec('git rev-parse HEAD').stdout.trim();
		var debugBuild = fs.readFileSync('./dist/ember-graph.js', { encoding: 'utf8' });
		var productionBuild = fs.readFileSync('./dist/ember-graph.prod.js', { encoding: 'utf8' });
		var minifiedBuild = fs.readFileSync('./dist/ember-graph.min.js', { encoding: 'utf8' });

		var zip = new AdmZip();
		zip.addFile('ember-graph.js', new Buffer(debugBuild));
		zip.addFile('ember-graph.prod.js', new Buffer(productionBuild));
		zip.addFile('ember-graph.min.js', new Buffer(minifiedBuild));
		var archive = zip.toBuffer();

		var count = 0;
		var counter = function(success, fileName) {
			count = count + 1;

			if (!success) {
				console.log('Error uploading file to S3: ' + fileName);
			}

			if (count >= 8) {
				done();
			}
		};

		var s3 = new AWS.S3();
		uploadFile(s3, 'latest/ember-graph.js', debugBuild, counter);
		uploadFile(s3, 'latest/ember-graph.prod.js', productionBuild, counter);
		uploadFile(s3, 'latest/ember-graph.min.js', minifiedBuild, counter);
		uploadFile(s3, 'latest/ember-graph.zip', archive, counter);

		uploadFile(s3, hash + '/ember-graph.min.js', minifiedBuild, counter);
		uploadFile(s3, hash + '/ember-graph.js', debugBuild, counter);
		uploadFile(s3, hash + '/ember-graph.prod.js', productionBuild, counter);
		uploadFile(s3, hash + '/ember-graph.zip', archive, counter);
	});
};

function uploadFile(s3, fileName, contents, callback) {
	s3.putObject({
		ACL: 'public-read',
		Body: contents,
		Bucket: 'ember-graph-builds',
		ContentType: 'application/javascript',
		Key: fileName
	}, function(err, data) {
		callback(!err, fileName);
	});
}