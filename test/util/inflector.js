(function() {
	'use strict';

	module('Inflector Test');

	test('Can override singular rules', 2, function() {
		strictEqual(EmberGraph.Inflector.pluralize('word'), 'words');
		EmberGraph.Inflector.overridePluralRule('word', 'foobar');
		strictEqual(EmberGraph.Inflector.pluralize('word'), 'foobar');
	});

	test('Can override plural rules', 2, function() {
		strictEqual(EmberGraph.Inflector.singularize('words'), 'word');
		EmberGraph.Inflector.overrideSingularRule('word', 'foobar');
		strictEqual(EmberGraph.Inflector.singularize('word'), 'foobar');
	});
})();
