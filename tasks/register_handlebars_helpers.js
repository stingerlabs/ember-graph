'use strict';

var Handlebars = require('handlebars');

String.prototype.startsWith = String.prototype.startsWith || function(prefix) {
	return this.indexOf(prefix) === 0;
};

String.prototype.endsWith = String.prototype.endsWith || function(suffix) {
	return this.indexOf(suffix, this.length - suffix.length) >= 0;
};

module.exports = function(grunt) {
	grunt.registerTask('register_handlebars_helpers', function() {
		Handlebars.registerHelper('link-to', linkTo);
		Handlebars.registerHelper('link-to-class', linkToClass);
		Handlebars.registerHelper('link-to-method', linkToMethod);
		Handlebars.registerHelper('link-to-property', linkToProperty);
		Handlebars.registerHelper('strip-outer-paragraph', stripOuterParagraph);
	});
};

function linkTo(content, href) {
	return new Handlebars.SafeString('<a href="' + href + '">' + content + '</a>');
}

function linkToClass(content, name, options) {
	if (!options) {
		options = name;
		name = content;
	}

	return new Handlebars.SafeString('<a href="/api/' + name + '.html">' + content + '</a>');
}

function linkToMethod(content, name, method, options) {
	if (!options) {
		options = method;
		method = name;
		name = content;
		content = method;
	}

	return new Handlebars.SafeString('<a href="/api/' + name + '.html#method_' + method + '">' + content + '</a>');
}

function linkToProperty(content, name, property, options) {
	if (!options) {
		options = property;
		property = name;
		name = content;
		content = property;
	}

	return new Handlebars.SafeString('<a href="/api/' + name + '.html#property_' + property + '">' + content + '</a>');
}

function stripOuterParagraph(text) {
	text = text.trim();

	if (text.startsWith('<p>') && text.endsWith('</p>')) {
	 text = text.substring(3, text.length - 4);
	}

	return new Handlebars.SafeString(text);
}