(function() {
	'use strict';

	var store;

	module('Relationship Object Test', {
		setup: function() {
			store = Eg.Store.create();

			store.createModel('test1', {
				children: Eg.hasMany({
					relatedType: 'test2',
					inverse: 'parent',
					isRequired: false
				}),

				link: Eg.belongsTo({
					relatedType: 'test2',
					inverse: null,
					isRequired: false
				})
			});

			store.createModel('test2', {
				parent: Eg.belongsTo({
					relatedType: 'test1',
					inverse: 'children',
					isRequired: false
				}),

				links: Eg.hasMany({
					relatedType: 'test1',
					inverse: null,
					isRequired: false
				})
			});
		}
	});

	test('A relationship object is created properly', function() {
		expect(6);

		var temp1 = store.createRecord('test1');
		var temp2 = store.createRecord('test2');

		var relationship = Eg.Relationship.create({
			object1: temp1,
			relationship1: 'children',
			object2: temp2,
			relationship2: 'parent',
			state: 'new'
		});

		ok(relationship.otherId(temp1) === temp2.get('id'));
		ok(relationship.otherId(temp2) === temp1.get('id'));

		ok(relationship.get('oneWay') === false);

		ok(relationship.isNew());
		ok(!relationship.isSaved());
		ok(!relationship.isDeleted());
	});

	test('An ID works for object 2', function() {
		expect(1);

		var temp = store.createRecord('test1');

		var relationship = Eg.Relationship.create({
			object1: temp,
			relationship1: 'children',
			object2: 'permanent-id',
			relationship2: 'parent',
			state: 'new'
		});

		ok(relationship.otherId(temp) === 'permanent-id');
	});

	test('An ID for object 1 throws', function() {
		expect(1);

		throws(function() {
			Eg.Relationship.create({
				object1: 'foo',
				relationship1: 'children',
				object2: 'bar',
				relationship2: 'parent',
				state: 'new'
			});
		});
	});

	if (window.DEBUG_MODE === true) {
		test('A temporary ID for object 2 throws', function() {
			expect(1);

			var temp = store.createRecord('test1');

			throws(function() {
				Eg.Relationship.create({
					object1: temp,
					relationship1: 'children',
					object2: Eg.Model.temporaryIdPrefix + 'foo',
					relationship2: 'parent',
					state: 'new'
				});
			});
		});
	}

	test('relationship2 can be null', function() {
		expect(1);

		var temp = store.createRecord('test1');

		var relationship = Eg.Relationship.create({
			object1: temp,
			relationship1: 'children',
			object2: 'permanent-id',
			relationship2: null,
			state: 'new'
		});

		ok(relationship.get('oneWay') === true);
	});

	test('The other record is found if it\'s an ID that has been loaded', function() {
		expect(2);

		var temp1 = store._loadRecord('test1', { id: 'temp1_id' });
		var temp2 = store._loadRecord('test2', { id: 'temp2_id' });

		var relationship = Eg.Relationship.create({
			object1: temp1,
			relationship1: 'children',
			object2: temp2.get('id'),
			relationship2: 'parent',
			state: 'new'
		});

		ok(relationship.otherId(temp1) === temp2.get('id'));
		ok(relationship.otherRecord(temp1) === temp2);
	});

	test('The other record is null if it hasn\'t been loaded', function() {
		expect(2);

		var temp1 = store.createRecord('test1', { id: 'temp1_id' });

		var relationship = Eg.Relationship.create({
			object1: temp1,
			relationship1: 'children',
			object2: 'foo_id',
			relationship2: 'parent',
			state: 'new'
		});

		ok(relationship.otherId(temp1) === 'foo_id');
		ok(relationship.otherRecord(temp1) === null);
	});

	test('The other record is still found if the relationship is oneWay', function() {
		expect(2);

		var temp1 = store.createRecord('test1', { id: 'temp1_id' });

		var relationship = Eg.Relationship.create({
			object1: temp1,
			relationship1: 'link',
			object2: 'foo_id',
			relationship2: null,
			state: 'new'
		});

		ok(relationship.otherId(temp1) === 'foo_id');
		ok(relationship.otherRecord(temp1) === null);
	});
})();
