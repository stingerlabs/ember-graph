'use strict';

var fs = require('fs');
var marked = require('marked');
var renderer = new marked.Renderer();
var Handlebars = require('handlebars');

marked.setOptions({
	renderer: renderer,
	highlight: function (code) {
		return require('highlight.js').highlightAuto(code).value;
	}
});

module.exports = function(grunt) {
	grunt.registerTask('convert_documentation_data', function() {
		var json = JSON.parse(fs.readFileSync('doc/data.json', { encoding: 'utf8' }));

		var data = {
			namespaces: extractNamespaces(json),
			classes: extractClasses(json).map(function(klass) {
				klass.methods = extractClassMethods(json, getInheritanceChain(json, klass.name));
				klass.properties = extractClassProperties(json, getInheritanceChain(json, klass.name));
				return klass;
			}).filter(function(klass) {
				return klass.name !== 'EG';
			})
		};

		fs.writeFileSync('doc/ember-graph.json', JSON.stringify(data));
	});
};

function extractNamespaces(data) {
	var namespaces = [];

	data.classitems.forEach(function(item) {
		if (!item.namespace) {
			return;
		}

		if (namespaces.indexOf(item.namespace) < 0) {
			namespaces.push(item.namespace);
		}
	});

	return namespaces.sort().map(function(namespace) {
		return extractNamespace(data, namespace);
	});
}

function extractNamespace(data, namespace) {
	return {
		name: namespace,
		description: '',
		methods: extractNamespaceMethods(data, namespace),
		properties: extractNamespaceProperties(data, namespace)
	};
}

function extractNamespaceMethods(data, namespace) {
	return extractNamespaceItems(data, namespace, 'method');
}

function extractNamespaceProperties(data, namespace) {
	return extractNamespaceItems(data, namespace, 'property');
}

function extractNamespaceItems(data, namespace, type) {
	return data.classitems.filter(function(item) {
		return (item.itemtype === type && item.namespace === namespace);
	}).map(function(item) {
		item.class = null;
		return (type === 'method' ? convertMethodItem : convertPropertyItem)(item);
	}).sort(function(a, b) {
		return (a.name < b.name ? -1 : 1);
	});
}

function extractClasses(data) {
	return Object.keys(data.classes).sort().filter(function(className) {
		return !data.classes[className].namespace;
	}).map(function(className) {
		return convertClassItem(data.classes[className]);
	});
}

function getInheritanceChain(data, className) {
	var superClass = data.classes[className].extends;

	if (data.classes[superClass]) {
		var chain = getInheritanceChain(data, superClass);
		chain.push(className);
		return chain;
	} else {
		return [className];
	}
}

function extractClassMethods(data, classChain, methods) {
	return extractClassItems(data, classChain, 'method', {});
}

function extractClassProperties(data, classChain) {
	return extractClassItems(data, classChain, 'property', {});
}

function extractClassItems(data, classChain, type, items) {
	if (classChain.length <= 0) {
		return Object.keys(items).sort().map(function(key) {
			return items[key];
		});
	}

	var classItems = data.classitems.filter(function(item) {
		return (item.itemtype === type && item.class === classChain[0]);
	});

	classItems.forEach(function(item) {
		items[item.name] = (type === 'method' ? convertMethodItem : convertPropertyItem)(item);
	});

	var chainItems = extractClassItems(data, classChain.slice(1), type, items);
	return chainItems.filter(function(item) {
		return (item.private === false || item.defined_in === classChain[classChain.length - 1]);
	});
}

function convertClassItem(item) {
	return {
		name: item.name,
		'extends': item.extends || null,
		uses: item.uses || [],
		description: templateAndParseText(item.description || ''),
		deprecated: item.deprecated === true,
		file: {
			path: item.file,
			line: item.line
		}
	};
}

function convertMethodItem(item) {
	return {
		name: item.name,
		description: templateAndParseText(item.description || ''),
		'static': item.static === 1,
		deprecated: item.deprecated === true,
		parameters: (item.params || []).map(function(param) {
			param.description = templateAndParseText(param.description || '');
			return param;
		}),
		'return': item.return,
		defined_in: item.class,
		'public': (item.access !== 'protected' && item.access !== 'private'),
		'protected': item.access === 'protected',
		'private': item.access === 'private',
		abstract: (item.category || []).indexOf('abstract') >= 0,
		file: {
			path: item.file,
			line: item.line
		}
	};
}

function convertPropertyItem(item) {
	return {
		name: item.name,
		description: templateAndParseText(item.description || ''),
		type: item.type,
		'static': item.static === 1,
		deprecated: item.deprecated === true,
		readOnly: item.final === 1,
		'default': item.default,
		defined_in: item.class,
		'public': (item.access !== 'protected' && item.access !== 'private'),
		'protected': item.access === 'protected',
		'private': item.access === 'private',
		file: {
			path: item.file,
			line: item.line
		}
	};
}

function templateAndParseText(text) {
	text = text || '';
	return marked(Handlebars.compile(text)());
}