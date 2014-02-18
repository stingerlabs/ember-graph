(function() {
	'use strict';

	var store;

	module('Relationship Modification', {
		setup: function() {
			store = setupStore({}, {
				test1: EG.Model.extend({
					belongsToNull: Eg.belongsTo({ relatedType: 'test3', inverse: null }),
					belongsToBelongsTo: Eg.belongsTo({ relatedType: 'test2', inverse: 'belongsTo' }),
					belongsToHasMany: Eg.belongsTo({ relatedType: 'test2', inverse: 'hasManyBelongsTo' }),
					hasMany: Eg.hasMany({ relatedType: 'test2', inverse: 'hasManyHasMany' })
				}),

				test2: EG.Model.extend({
					hasManyNull: Eg.hasMany({ relatedType: 'test3', inverse: null }),
					hasManyBelongsTo: Eg.hasMany({ relatedType: 'test1', inverse: 'belongsToHasMany' }),
					hasManyHasMany: Eg.hasMany({ relatedType: 'test1', inverse: 'hasMany' }),
					belongsTo: Eg.belongsTo({ relatedType: 'test1', inverse: 'belongsToBelongsTo' })
				}),

				test3: EG.Model.extend()
			});

			store._loadRecord('test2', { id: '1', hasManyNull: [],
				hasManyBelongsTo: [], hasManyHasMany: [], belongsTo: null });

			store._loadRecord('test1',  { id: '1', belongsToNull: null,
				belongsToBelongsTo: null, belongsToHasMany: null, hasMany: [] });
		}
	});

	test('Adding to a hasMany(->null) works properly', function() {
		expect(2);

		var test2 = store.getRecord('test2', '1');
		ok(!test2.get('hasManyNull').contains('-1'));
		test2.addToRelationship('hasManyNull', '-1');
		ok(test2.get('hasManyNull').contains('-1'));
	});

	test('Adding to a hasMany(->belongsTo) works properly', function() {
		expect(4);

		var test1 = store.getRecord('test1', '1');
		var test2 = store.getRecord('test2', '1');

		strictEqual(test1.get('belongsToHasMany'), null);
		ok(!test2.get('hasManyBelongsTo').contains('1'));

		test2.addToRelationship('hasManyBelongsTo', '1');

		strictEqual(test1.get('belongsToHasMany'), '1');
		ok(test2.get('hasManyBelongsTo').contains('1'));
	});

	test('Adding to a hasMany(->hasMany) works properly', function() {
		expect(4);

		var test1 = store.getRecord('test1', '1');
		var test2 = store.getRecord('test2', '1');

		ok(!test1.get('hasMany').contains('1'));
		ok(!test2.get('hasManyHasMany').contains('1'));

		test2.addToRelationship('hasManyHasMany', '1');

		ok(test1.get('hasMany').contains('1'));
		ok(test2.get('hasManyHasMany').contains('1'));
	});
})();