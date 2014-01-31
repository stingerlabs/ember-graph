(function() {
	'use strict';

	var HAS_MANY_KEY = Eg.Model.HAS_MANY_KEY;

	var TestModel = Eg.Model.extend({
		typeKey: 'test',

		widgets: Eg.hasMany({
			relatedType: 'widget'
		}),

		squirrels: Eg.hasMany({
			relatedType: 'squirrel',
			isRequired: false,
			readOnly: true
		}),

		people: Eg.hasMany({
			relatedType: 'person',
			isRequired: false,
			defaultValue: ['admin', 'root']
		})
	});

	module('Model hasMany Relationship Test');

	test('Creating a record loads the relationships correctly', function() {
		expect(3);

		var record = TestModel.createRecord({
			widgets: [],
			squirrels: ['cheeky'],
			people: ['alice', 'bob', 'carol']
		});

		ok(record.get('widgets').isEqual([]));
		ok(record.get('squirrels').isEqual(['cheeky']));
		ok(record.get('people').isEqual(['alice', 'bob', 'carol']));
	});

	test('Creating a record loads the correct defaults', function() {
		expect(2);

		var record = TestModel.createRecord({
			widgets: []
		});

		ok(record.get('squirrels').isEqual([]));
		ok(record.get('people').isEqual(['admin', 'root']));
	});

	test('Leaving out a required relationship on creation throws', function() {
		expect(1);

		throws(function() {
			var record = TestModel.createRecord({});
		});
	});

	test('Creating with a non-enumerable value throws', function() {
		expect(1);

		throws(function() {
			var record = TestModel.createRecord({
				widgets: 'hello'
			});
		});
	});

	test('Changing a value works correctly', function() {
		expect(1);

		var record = TestModel.createRecord({
			widgets: ['floob']
		});

		record.set('widgets', ['garb']);
		ok(record.get('widgets').isEqual(['garb']));
	});

	test('Adding a value works correctly', function() {
		expect(1);

		var record = TestModel.createRecord({
			widgets: ['floob']
		});

		record.get('widgets').addObject('garb');
		ok(record.get('widgets').isEqual(['floob', 'garb']));
	});

	test('Removing a value works correctly', function() {
		expect(1);

		var record = TestModel.createRecord({
			widgets: ['floob']
		});

		record.get('widgets').removeObject('floob');
		ok(record.get('widgets').isEqual([]));
	});

	test('Changing a read-only value throws', function() {
		expect(1);

		var record = TestModel.createRecord({
			widgets: []
		});

		throws(function() {
			record.set('squirrels', []);
		});
	});

	test('Changing a value to an incorrect type throws', function() {
		expect(2);

		var record = TestModel.createRecord({
			widgets: []
		});

		throws(function() {
			record.set('widgets', 4);
		});

		throws(function() {
			record.set('widgets', undefined);
		});
	});

	test('Changing a value shows in changedRelationships', function() {
		expect(5);

		var record = TestModel.createRecord({
			widgets: []
		});

		record.set('widgets', ['rube']);
		record.set('people', ['alice', 'bob', 'carol']);

		var changed = record.changedRelationships();

		ok(Em.keys(changed).length === 2);
		ok(changed.widgets[0].isEqual([]));
		ok(changed.widgets[1].isEqual(['rube']));
		ok(changed.people[0].isEqual(['admin', 'root']));
		ok(changed.people[1].isEqual(['alice', 'bob', 'carol']));
	});

	test('Rolling back resets changes', function() {
		expect(2);

		var record = TestModel.createRecord({
			widgets: [],
			people: []
		});

		record.set('widgets', ['floob', 'garb', 'rube']);
		record.set('people', ['bob']);

		record.rollbackRelationships();
		var changed = record.changedRelationships();
		ok(Em.keys(changed).length === 0);

		record.get('widgets').addObject('zipp');
		record.rollbackRelationships();

		changed = record.changedRelationships();
		ok(Em.keys(changed).length === 0);
	});
})();
