'use strict';

var fs = require('fs');
var Handlebars = require('handlebars');

var templates = {};

module.exports = function(grunt) {
	grunt.registerTask('build_api_pages', function() {
		compileTemplates();

		var data = JSON.parse(fs.readFileSync('./doc/ember-graph.json', { encoding: 'utf8' }));
		buildNamespacePages(data);
		buildClassPages(data);
	});
};

function compileTemplates() {
	function getTemplate(name) {
		return fs.readFileSync('./site/templates/' + name + '.hbs', { encoding: 'utf8' });
	}

	var names = ['api/content_index', 'api/content_methods', 'api/content_properties',
		'api/content_tabs', 'api/shell', 'api/sidebar', 'api/base'];

	names.forEach(function(name) {
		var template = Handlebars.compile(getTemplate(name));

		templates[name] = function(data) {
			return template(data).trim();
		};
	});
}

function buildNamespacePages(data) {
	var namespaces = data.namespaces;
	var classNames = data.classes.map(function(c) {
		return c.name;
	});
	var namespaceNames = data.namespaces.map(function(n) {
		return n.name;
	});

	namespaces.forEach(function(namespace) {
		var index = templates['api/content_index']({ methods: namespace.methods, properties: namespace.properties });
		var methodList = templates['api/content_methods']({ methods: namespace.methods });
		var propertyList = templates['api/content_properties']({ properties: namespace.properties });

		var tabs = templates['api/content_tabs']({ index: index, properties: propertyList, methods: methodList });
		var sidebar = buildSidebar(classNames, namespaceNames, null, namespace.name);

		var page = templates['api/shell']({
			sidebar: sidebar,
			content: tabs,
			namespace: {
				name: namespace.name,
				description: namespace.description
			}
		});
		var file = templates['api/base']({ body: page });

		fs.writeFileSync('site_build/api/' + namespace.name + '.html', file);
	});
}

function buildClassPages(data) {
	var classes = data.classes;
	var classNames = data.classes.map(function(c) {
		return c.name;
	});
	var namespaceNames = data.namespaces.map(function(n) {
		return n.name;
	});

	classes.forEach(function(c) {
		var index = templates['api/content_index']({ methods: c.methods, properties: c.properties });
		var methodList = templates['api/content_methods']({ methods: c.methods });
		var propertyList = templates['api/content_properties']({ properties: c.properties });

		var tabs = templates['api/content_tabs']({ index: index, properties: propertyList, methods: methodList });
		var sidebar = buildSidebar(classNames, namespaceNames, c.name, null);

		var page = templates['api/shell']({ sidebar: sidebar, content: tabs, 'class': c });
		var file = templates['api/base']({ body: page });

		fs.writeFileSync('site_build/api/' + c.name + '.html', file);
	});
}

function buildSidebar(classNames, namespaceNames, currentClass, currentNamespace) {
	var classes = classNames.map(function(className) {
		return {
			name: className,
			active: className === currentClass
		};
	});

	var namespaces = namespaceNames.map(function(namespace) {
		return {
			name: namespace,
			active: currentNamespace === namespace
		};
	});

	return templates['api/sidebar']({
		classes: classes,
		namespaces: namespaces
	});
}