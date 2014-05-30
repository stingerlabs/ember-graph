'use strict';

var fs = require('fs');
var Handlebars = require('handlebars');

var templates = {};

module.exports = function(grunt) {
	grunt.registerTask('build_api_pages', function() {
		compileTemplates();

		var data = JSON.parse(fs.readFileSync('./doc/ember-graph.json', { encoding: 'utf8' }));
		buildPages(data);
		buildEmberGraphNamespacePage(data);
	});
};

function compileTemplates() {
	function getTemplate(name) {
		return fs.readFileSync('./site_assets/templates/' + name + '.hbs', { encoding: 'utf8' });
	}

	var names = ['api/content_index', 'api/content_methods', 'api/content_properties',
		'api/content_tabs', 'api/shell', 'api/sidebar', 'api/base'];

	names.forEach(function(name) {
		templates[name] = Handlebars.compile(getTemplate(name));
	});
}

function buildPages(data) {
	var classes = data.classes;
	var classNames = data.classes.map(function(c) {
		return c.name;
	});

	classes.map(function(c) {
		var index = templates['api/content_index']({ methods: c.methods, properties: c.properties });
		var methodList = templates['api/content_methods']({ methods: c.methods });
		var propertyList = templates['api/content_properties']({ properties: c.properties });

		var tabs = templates['api/content_tabs']({ index: index, properties: propertyList, methods: methodList });
		var sidebar = buildSidebar(classNames, c.name);

		var page = templates['api/shell']({ sidebar: sidebar, content: tabs, 'class': c });
		var file = templates['api/base']({ body: page });

		fs.writeFileSync('site/api/' + c.name + '.html', file);
	});
}

function buildEmberGraphNamespacePage(data) {
	var classNames = data.classes.map(function(c) {
		return c.name;
	});

	var index = templates['api/content_index']({ methods: data.methods, properties: data.properties });
	var methodList = templates['api/content_methods']({ methods: data.methods });
	var propertyList = templates['api/content_properties']({ properties: data.properties });

	var tabs = templates['api/content_tabs']({ index: index, properties: propertyList, methods: methodList });
	var sidebar = buildSidebar(classNames, null, true);

	var page = templates['api/shell']({
		sidebar: sidebar,
		content: tabs,
		namespace: {
			name: 'EmberGraph',
			description: ''
		}
	});
	var file = templates['api/base']({ body: page });

	fs.writeFileSync('site/api/EG.html', file);
}

function buildStringNamespacePage(data) {

}

function buildSidebar(classNames, currentClass, emberGraphNamespace, stringNamespace) {
	var classes = classNames.map(function(className) {
		return {
			name: className,
			active: className === currentClass
		};
	});

	return templates['api/sidebar']({
		classes: classes,
		emberGraphNamespace: emberGraphNamespace,
		stringNamespace: stringNamespace
	});
}