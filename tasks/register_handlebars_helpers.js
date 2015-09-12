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

function linkToMethod(linkName, className, methodName, options) {
	return linkToClassItem(linkName, className, methodName, options, 'method');
}

function linkToProperty(linkName, className, propertyName, options) {
	return linkToClassItem(linkName, className, propertyName, options, 'property');
}

function linkToClassItem(linkName, className, itemName, options, type) {
	if (!options) {
		options = itemName;
		itemName = className;
		className = linkName;
		linkName = itemName;
	}

	var html = '<a href="/api/' + className + '.html#' + type + '_' + itemName + '">' + linkName + '</a>';

	return new Handlebars.SafeString(html);
}

function stripOuterParagraph(text) {
	text = text.trim();

	if (text.startsWith('<p>') && text.endsWith('</p>')) {
		text = text.substring(3, text.length - 4);
	}

	return new Handlebars.SafeString(text);
}