(function() {
	'use strict';

	var BELONGS_TO_KEY = Eg.Model.BELONGS_TO_KEY;

	var TestModel = Eg.Model.extend({
		typeKey: 'test',

		owner: Eg.belongsTo({
			relatedType: 'user',
			isRequired: false
		}),

		redFish: Eg.belongsTo({
			relatedType: 'fish',
			isRequired: false,
			defaultValue: 'foo'
		}),

		blueFish: Eg.belongsTo({
			relatedType: 'fish',
			readOnly: true
		})
	});

	module('Model belongsTo Relationship Test');

	test('The correct relationships are detected (and only those relationships)', function() {
		expect(1);

		var expectedRelationships = new Em.Set(['owner', 'redFish', 'blueFish']);

		ok(expectedRelationships.isEqual(Em.get(TestModel, 'relationships')));
	});

	test('The relationships are iterated correctly', function() {
		expect(4);

		var count = 0;
		var relationships = { owner: false, redFish: false, blueFish: true };

		TestModel.eachRelationship(function(name, meta) {
			count = count + 1;
			relationships[name] = true;
		});

		ok(count === 3);
		ok(relationships.owner === true);
		ok(relationships.redFish === true);
		ok(relationships.blueFish === true);
	});

	test('Relationships are detected properly', function() {
		expect(3);

		ok(TestModel.isRelationship('owner'));
		ok(!TestModel.isRelationship('REDFISH'));
		ok(!TestModel.isRelationship('foobarnone'));
	});

	test('Creating a record loads the relationships correctly', function() {
		expect(3);

		var record = TestModel.createRecord({
			owner: 'OWNER_ID',
			redFish: 'RED_ID',
			blueFish: 'BLUE_ID'
		});

		ok(record.get('owner') === 'OWNER_ID');
		ok(record.get('redFish') === 'RED_ID');
		ok(record.get('blueFish') === 'BLUE_ID');
	});

	test('Creating a record loads the correct defaults', function() {
		expect(1);

		var record = TestModel.createRecord({
			owner: '',
			blueFish: ''
		});

		ok(record.get('redFish') === 'foo');
	});

	test('Leaving out a required property on creation throws', function() {
		expect(1);

		throws(function() {
			var record = TestModel.createRecord({});
		});
	});

	test('Creating with a non-string value throws', function() {
		expect(1);

		throws(function() {
			var record = TestModel.createRecord({
				owner: '',
				blueFish: 4
			});
		});
	});

	test('Changing a value works correctly', function() {
		expect(1);

		var record = TestModel.createRecord({
			owner: '',
			blueFish: ''
		});

		record.set('owner', 'foobarnone');
		ok(record.get('owner') === 'foobarnone');
	});

	test('Changing a read-only value throws', function() {
		expect(1);

		var record = TestModel.createRecord({
			owner: '',
			blueFish: ''
		});

		throws(function() {
			record.set('blueFish', '');
		});
	});

	test('Changing a value to an incorrect type throws', function() {
		expect(1);

		var record = TestModel.createRecord({
			owner: '',
			blueFish: ''
		});

		throws(function() {
			record.set('blueFish', 4);
		});
	});

	test('Changing a value show in changedRelationships', function() {
		expect(3);

		var record = TestModel.createRecord({
			owner: '',
			blueFish: ''
		});

		record.set('owner', '1');
		record.set('redFish', '2');

		var changed = record.changedRelationships();

		ok(Em.keys(changed).length === 2);
		ok(record.get('owner') === '1');
		ok(record.get('redFish') === '2');
	});

	test('Rolling back resets changes', function() {
		expect(1);

		var record = TestModel.createRecord({
			owner: '',
			blueFish: ''
		});

		record.set('owner', '1');
		record.set('redFish', '2');

		record.rollbackRelationships();
		var changed = record.changedRelationships();

		ok(Em.keys(changed).length === 0);
	});
})();
