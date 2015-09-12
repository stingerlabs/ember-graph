'use strict';

var fs = require('fs');
var path = require('path');
var babel = require('babel');
var readdir = require('fs-readdir-recursive');

var SOURCE_DIRECTORY = path.resolve(process.cwd() + '/src');
var DESTINATION_DIRECTORY = path.resolve(process.cwd() + '/dist');
var OUTPUT_FILE_PATH = path.resolve(process.cwd() + '/dist/ember-graph.js');
var BEFORE_LOAD_SCRIPT = path.resolve(process.cwd() + '/src/before_load.js');
var AFTER_LOAD_SCRIPT = path.resolve(process.cwd() + '/src/after_load.js');

var FILE_CACHE = {};
var LAST_TRANSPILE = 0;

module.exports = function(grunt) {
	grunt.registerTask('transpile', transpile);
};

function transpile() {
	console.log('Transpiling...');
	var startTime = Date.now();
	buildOutput();
	LAST_TRANSPILE = Date.now();
	var timeElapsed = LAST_TRANSPILE - startTime;
	console.log('...done. Finished in ' + Math.ceil(timeElapsed / 1000) + ' seconds');
}

function buildOutput() {
	try {
		fs.mkdirSync(DESTINATION_DIRECTORY);
	} catch (e) {
		if (e.code !== 'EEXIST') {
			throw e;
		}
	}

	transpileSources();
	cleanCache();
	concatenateFiles();
}

function transpileSources() {
	var filePaths = scanForFiles();
	var changedFiles = filterUnchangedFiles(filePaths);
	changedFiles.forEach(function(filePath) {
		console.log('Transpiling file: ' + path.relative(SOURCE_DIRECTORY, filePath));
		FILE_CACHE[filePath] = transpileFile(filePath);
	});
}

function cleanCache() {
	Object.keys(FILE_CACHE).forEach(function(filePath) {
		if (!fs.existsSync(filePath)) {
			delete FILE_CACHE[filePath];
		}
	});
}

function concatenateFiles() {
	fs.writeFileSync(OUTPUT_FILE_PATH, '(function() {\n\'use strict\';\n\n');

	var beforeLoadScriptContents = fs.readFileSync(BEFORE_LOAD_SCRIPT, 'utf8');
	fs.appendFileSync(OUTPUT_FILE_PATH, beforeLoadScriptContents);

	Object.keys(FILE_CACHE).forEach(function(filePath) {
		fs.appendFileSync(OUTPUT_FILE_PATH, '\n\n');
		fs.appendFileSync(OUTPUT_FILE_PATH, FILE_CACHE[filePath]);
	});

	fs.appendFileSync(OUTPUT_FILE_PATH, '\n\n');
	var afterLoadScriptContents = fs.readFileSync(AFTER_LOAD_SCRIPT, 'utf8');
	fs.appendFileSync(OUTPUT_FILE_PATH, afterLoadScriptContents);

	fs.appendFileSync(OUTPUT_FILE_PATH, '\n\n}).call(window || this);');
}

function scanForFiles() {
	return readdir(SOURCE_DIRECTORY).map(function(name) {
		return path.resolve(SOURCE_DIRECTORY + '/' + name);
	}).filter(function(name) {
		if (!endsWith(name, '.js')) {
			return false;
		}

		if (name === BEFORE_LOAD_SCRIPT) {
			return false;
		}

		if (name === AFTER_LOAD_SCRIPT) {
			return false;
		}

		return true;
	});
}

function filterUnchangedFiles(filePaths) {
	return filePaths.filter(function(filePath) {
		var stat = fs.statSync(filePath);
		return (stat.mtime.getTime() > LAST_TRANSPILE);
	});
}

function transpileFile(filePath) {
	var fileContents = fs.readFileSync(filePath, 'utf8');
	var options = {
		filename: path.relative(SOURCE_DIRECTORY, filePath),
		nonStandard: false,
		sourceRoot: SOURCE_DIRECTORY,
		moduleRoot: 'ember-graph',
		modules: 'amdStrict',
		moduleIds: true,
		whitelist: [
			'es6.arrowFunctions',
			'es6.blockScoping',
			'es6.constants',
			'es6.destructuring',
			'es6.modules',
			'es6.parameters',
			'es6.properties.computed',
			'es6.properties.shorthand',
			'es6.spread',
			'es6.templateLiterals'
		]
	};

	return babel.transform(fileContents, options).code;
}

function endsWith(string, suffix) {
	return string.indexOf(suffix, string.length - suffix.length) >= 0;
}