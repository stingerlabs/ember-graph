(function() {
	'use strict';

	var store;

	module('Relationship Modification', {
		setup: function() {
			store = setupStore({
				test1: EG.Model.extend({
					hasOneNull: EG.hasOne({ relatedType: 'test3', inverse: null }),
					hasOneHasOne: EG.hasOne({ relatedType: 'test2', inverse: 'hasOne' }),
					hasOneHasMany: EG.hasOne({ relatedType: 'test2', inverse: 'hasManyHasOne' }),
					hasMany: EG.hasMany({ relatedType: 'test2', inverse: 'hasManyHasMany' })
				}),

				test2: EG.Model.extend({
					hasManyNull: EG.hasMany({ relatedType: 'test3', inverse: null }),
					hasManyHasOne: EG.hasMany({ relatedType: 'test1', inverse: 'hasOneHasMany' }),
					hasManyHasMany: EG.hasMany({ relatedType: 'test1', inverse: 'hasMany' }),
					hasOne: EG.hasOne({ relatedType: 'test1', inverse: 'hasOneHasOne' })
				}),

				test3: EG.Model.extend()
			});

			store._loadRecord('test2', { id: '1', hasManyNull: [],
				hasManyHasOne: [], hasManyHasMany: [], hasOne: null });

			store._loadRecord('test1',  { id: '1', hasOneNull: null,
				hasOneHasOne: null, hasOneHasMany: null, hasMany: [] });
		}
	});

	test('Adding to a hasMany(->null) works properly', function() {
		expect(2);

		var test2 = store.getRecord('test2', '1');
		ok(!test2.get('_hasManyNull').contains('-1'));
		test2.addToRelationship('hasManyNull', '-1');
		ok(test2.get('_hasManyNull').contains('-1'));
	});

	test('Adding to a hasMany(->hasOne) works properly', function() {
		expect(4);

		var test1 = store.getRecord('test1', '1');
		var test2 = store.getRecord('test2', '1');

		strictEqual(test1.get('_hasOneHasMany'), null);
		ok(!test2.get('_hasManyHasOne').contains('1'));

		test2.addToRelationship('hasManyHasOne', '1');

		strictEqual(test1.get('_hasOneHasMany'), '1');
		ok(test2.get('_hasManyHasOne').contains('1'));
	});

	test('Adding to a hasMany(->hasMany) works properly', function() {
		expect(4);

		var test1 = store.getRecord('test1', '1');
		var test2 = store.getRecord('test2', '1');

		ok(!test1.get('_hasMany').contains('1'));
		ok(!test2.get('_hasManyHasMany').contains('1'));

		test2.addToRelationship('hasManyHasMany', '1');

		ok(test1.get('_hasMany').contains('1'));
		ok(test2.get('_hasManyHasMany').contains('1'));
	});
})();