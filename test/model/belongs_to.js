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
		expect(2);

		var record = TestModel.createRecord({
			blueFish: ''
		});

		throws(function() {
			record.set('redFish', 4);
		});

		throws(function() {
			record.set('redFish', undefined);
		});
	});

	test('Changing a value shows in changedRelationships', function() {
		expect(5);

		var record = TestModel.createRecord({
			blueFish: ''
		});

		record.set('owner', '1');
		record.set('redFish', '2');

		var changed = record.changedRelationships();

		ok(Em.keys(changed).length === 2);
		ok(changed.owner[0] === null);
		ok(changed.owner[1] === '1');
		ok(changed.redFish[0] === 'foo');
		ok(changed.redFish[1] === '2');
	});

	test('Rolling back resets changes', function() {
		expect(1);

		var record = TestModel.createRecord({
			blueFish: ''
		});

		record.set('owner', '1');
		record.set('redFish', '2');

		record.rollbackRelationships();
		var changed = record.changedRelationships();

		ok(Em.keys(changed).length === 0);
	});
})();
