'use strict';

var fs = require('fs');
var marked = require('marked');

marked.setOptions({
	highlight: function (code) {
		return require('highlight.js').highlightAuto(code).value;
	}
});

module.exports = function(grunt) {
	grunt.registerTask('convert_documentation_data', function() {
		var json = JSON.parse(fs.readFileSync('doc/data.json', { encoding: 'utf8' }));

		var data = {
			methods: extractTopLevelMethods(json),
			properties: extractTopLevelProperties(json),
			classes: extractClasses(json).map(function(klass) {
				klass.methods = extractMethods(klass.name, json);
				klass.properties = extractProperties(klass.name, json);
				return klass;
			})
		};

		fs.writeFileSync('doc/ember-graph.json', JSON.stringify(data));
	});
};

function extractTopLevelMethods(json) {
	return json.classitems.filter(function(item) {
		return (item.itemtype === 'method' && (item.category || []).indexOf('top-level') >= 0);
	}).map(function(item) {
		// Make sure this method isn't detected later in the conversion
		item.class = null;

		return {
			name: item.name,
			description: marked(item.description || ''),
			parameters: item.params,
			return: item.return,
			static: item.static === 1,
			deprecated: item.deprecated === true,
			file: {
				path: item.file,
				line: item.line
			}
		};
	}).sort(function(a, b) {
		return (a.name < b.name ? -1 : 1);
	});
}

function extractTopLevelProperties(json) {
	return json.classitems.filter(function(item) {
		return (item.itemtype === 'property' && (item.category || []).indexOf('top-level') >= 0);
	}).map(function(item) {
		// Make sure this property isn't detected later in the conversion
		item.class = null;

		return {
			name: item.name,
			description: marked(item.description || ''),
			type: item.type,
			static: item.static === 1,
			deprecated: item.deprecated === true,
			file: {
				path: item.file,
				line: item.line
			}
		};
	}).sort(function(a, b) {
		return (a.name < b.name ? -1 : 1);
	});
}

function extractClasses(json) {
	var classes = json.classes;

	return Object.keys(classes).sort().map(function(className) {
		return {
			name: className,
			extends: classes[className].extends || '',
			description: marked(classes[className].description || ''),
			deprecated: classes[className].deprecated === true,
			file: {
				path: classes[className].file,
				line: classes[className].line
			}
		};
	});
}

function extractMethods(className, json) {
	return json.classitems.filter(function(item) {
		return (item.itemtype === 'method' && item.class === className);
	}).map(function(item) {
		return {
			name: item.name,
			description: marked(item.description || ''),
			parameters: item.params,
			return: item.return,
			static: item.static === 1,
			deprecated: item.deprecated === true,
			file: {
				path: item.file,
				line: item.line
			}
		};
	}).sort(function(a, b) {
		return (a.name < b.name ? -1 : 1);
	});
}

function extractProperties(className, json) {
	return json.classitems.filter(function(item) {
		return (item.itemtype === 'property' && item.class === className);
	}).map(function(item) {
		return {
			name: item.name,
			description: marked(item.description || ''),
			type: item.type,
			static: item.static === 1,
			deprecated: item.deprecated === true,
			readOnly: item.final === 1,
			default: item.default,
			file: {
				path: item.file,
				line: item.line
			}
		};
	}).sort(function(a, b) {
		return (a.name < b.name ? -1 : 1);
	});
}