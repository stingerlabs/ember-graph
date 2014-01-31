(function() {
	'use strict';

	var BELONGS_TO_KEY = Eg.Model.BELONGS_TO_KEY;
	var HAS_MANY_KEY = Eg.Model.HAS_MANY_KEY;

	var TestModel = Eg.Model.extend({
		typeKey: 'test',

		single: Eg.belongsTo({ relatedType: 'foo' }),
		multiple: Eg.hasMany({ relatedType: 'bar' })
	});

	module('General Relationship Functionality Test');

	test('The correct relationships are detected (and only those relationships)', function() {
		expect(1);

		var expectedRelationships = new Em.Set(['single', 'multiple']);

		ok(expectedRelationships.isEqual(Em.get(TestModel, 'relationships')));
	});

	test('The relationships are iterated correctly', function() {
		expect(3);

		var count = 0;
		var relationships = { single: false, multiple: false };

		TestModel.eachRelationship(function(name, meta) {
			count = count + 1;
			relationships[name] = true;
		});

		ok(count === 2);
		ok(relationships.single === true);
		ok(relationships.multiple === true);
	});

	test('Relationships are detected properly', function() {
		expect(3);

		ok(TestModel.isRelationship('single'));
		ok(!TestModel.isRelationship('REDFISH'));
		ok(!TestModel.isRelationship('foobarnone'));
	});

	test('Using a disallowed relationship name throws', function() {
		expect(1);

		throws(function() {
			Eg.Model.extend({
				type: Eg.belongsTo({})
			});
		});
	});

	test('The relationship kind is correctly reported', function() {
		expect(2);

		ok(TestModel.relationshipKind('single') === BELONGS_TO_KEY);
		ok(TestModel.relationshipKind('multiple') === HAS_MANY_KEY);
	});

	test('metaForRelationship returns the correct metadata', function() {
		expect(2);

		var meta = TestModel.metaForRelationship('single');

		ok(meta.isRelationship === true);
		ok(meta.kind === BELONGS_TO_KEY);
	});
})();