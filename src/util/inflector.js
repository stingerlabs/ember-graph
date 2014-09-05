/*
 I took the rules in this code from inflection.js, whose license can be found below.
 */

/*!
 Copyright (c) 2010 Ryan Schuft (ryan.schuft@gmail.com)

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 */

var uncountableWords = [
	'equipment', 'information', 'rice', 'money', 'species', 'series', 'fish', 'sheep', 'moose', 'deer', 'news'
];

var pluralRules = [
	[/(m)an$/gi,                 '$1en'],
	[/(pe)rson$/gi,              '$1ople'],
	[/(child)$/gi,               '$1ren'],
	[/^(ox)$/gi,                 '$1en'],
	[/(ax|test)is$/gi,           '$1es'],
	[/(octop|vir)us$/gi,         '$1i'],
	[/(alias|status)$/gi,        '$1es'],
	[/(bu)s$/gi,                 '$1ses'],
	[/(buffal|tomat|potat)o$/gi, '$1oes'],
	[/([ti])um$/gi,              '$1a'],
	[/sis$/gi,                   'ses'],
	[/(?:([^f])fe|([lr])f)$/gi,  '$1$2ves'],
	[/(hive)$/gi,                '$1s'],
	[/([^aeiouy]|qu)y$/gi,       '$1ies'],
	[/(x|ch|ss|sh)$/gi,          '$1es'],
	[/(matr|vert|ind)ix|ex$/gi,  '$1ices'],
	[/([m|l])ouse$/gi,           '$1ice'],
	[/(quiz)$/gi,                '$1zes'],
	[/s$/gi,                     's'],
	[/$/gi,                      's']
];

var singularRules = [
	[/(m)en$/gi,                                                        '$1an'],
	[/(pe)ople$/gi,                                                     '$1rson'],
	[/(child)ren$/gi,                                                   '$1'],
	[/([ti])a$/gi,                                                      '$1um'],
	[/((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$/gi, '$1$2sis'],
	[/(hive)s$/gi,                                                      '$1'],
	[/(tive)s$/gi,                                                      '$1'],
	[/(curve)s$/gi,                                                     '$1'],
	[/([lr])ves$/gi,                                                    '$1f'],
	[/([^fo])ves$/gi,                                                   '$1fe'],
	[/([^aeiouy]|qu)ies$/gi,                                            '$1y'],
	[/(s)eries$/gi,                                                     '$1eries'],
	[/(m)ovies$/gi,                                                     '$1ovie'],
	[/(x|ch|ss|sh)es$/gi,                                               '$1'],
	[/([m|l])ice$/gi,                                                   '$1ouse'],
	[/(bus)es$/gi,                                                      '$1'],
	[/(o)es$/gi,                                                        '$1'],
	[/(shoe)s$/gi,                                                      '$1'],
	[/(cris|ax|test)es$/gi,                                             '$1is'],
	[/(octop|vir)i$/gi,                                                 '$1us'],
	[/(alias|status)es$/gi,                                             '$1'],
	[/^(ox)en/gi,                                                       '$1'],
	[/(vert|ind)ices$/gi,                                               '$1ex'],
	[/(matr)ices$/gi,                                                   '$1ix'],
	[/(quiz)zes$/gi,                                                    '$1'],
	[/s$/gi,                                                            '']
];

var apply = function(str, rules) {
	if (uncountableWords.indexOf(str) >= 0) {
		return str;
	}

	for (var i = 0; i < rules.length; i = i + 1) {
		if (str.match(rules[i][0])) {
			return str.replace(rules[i][0], rules[i][1]);
		}
	}

	return str;
};

var PLURALIZE_CACHE = {};
EG.String.pluralize = function(str) {
	if (!PLURALIZE_CACHE[str]) {
		PLURALIZE_CACHE[str] = apply(str, pluralRules);
	}

	return PLURALIZE_CACHE[str];
};

var SINGULARIZE_CACHE = {};
EG.String.singularize = function(str) {
	if (!SINGULARIZE_CACHE[str]) {
		SINGULARIZE_CACHE[str] = apply(str, singularRules);
	}

	return SINGULARIZE_CACHE[str];
};

if (Em.EXTEND_PROTOTYPES === true || Em.EXTEND_PROTOTYPES.String) {
	String.prototype.pluralize = String.prototype.pluralize || function() {
		return EG.String.pluralize(this);
	};

	String.prototype.singularize = String.prototype.singularize || function() {
		return EG.String.singularize(this);
	};
}