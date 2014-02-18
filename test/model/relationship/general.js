(function() {
	'use strict';

	var store;

	module('General Relationship Functionality', {
		setup: function() {
			store = setupStore({}, {
				user: EG.Model.extend({
					vertices: Eg.hasMany({
						relatedType: 'vertex',
						isRequired: false,
						inverse: 'owner',
						defaultValue: ['0']
					})
				}),

				vertex: EG.Model.extend({
					owner: Eg.belongsTo({
						relatedType: 'user',
						isRequired: true,
						inverse: 'vertices',
						readOnly: true
					}),

					tags: Eg.hasMany({
						relatedType: 'tag',
						isRequired: false,
						inverse: null
					})
				}),

				tag: EG.Model.extend()
			});

			store._loadRecord('user', { id: '1', vertices: ['1', '2', '3'] });
			store._loadRecord('user', { id: '2' });

			store._loadRecord('vertex', { id: '1', owner: '1', tags: ['1', '3', '5']});
			store._loadRecord('vertex', { id: '2', owner: '1', tags: ['2', '4', '6']});
			store._loadRecord('vertex', { id: '4', owner: '3' });
		}
	});

	test('Declared relationships are discovered properly', function() {
		expect(3);

		var user = store.modelForType('user');
		ok(Em.get(user, 'relationships').isEqual(['vertices']));

		var vertex = store.modelForType('vertex');
		ok(Em.get(vertex, 'relationships').isEqual(['owner', 'tags']));

		var tag = store.modelForType('tag');
		ok(Em.get(tag, 'relationships').isEqual([]));
	});

	test('Loading a record with relationships works properly', function() {
		expect(3);

		var user = store.getRecord('user', '1');
		ok(user.get('vertices').isEqual(['1', '3', '2']));

		var vertex = store.getRecord('vertex', '2');
		ok(vertex.get('tags').isEqual(['6', '4' ,'2']));
		strictEqual(vertex.get('owner'), '1');
	});

	test('Default relationship values are populated properly', function() {
		expect(2);

		var user = store.getRecord('user', '2');
		ok(user.get('vertices').isEqual(['0']));

		var vertex = store.getRecord('vertex', '4');
		ok(vertex.get('tags').isEqual([]));
	});

	test('Leaving out a required relationship causes an exception', function() {
		expect(1);

		throws(function() {
			store._loadRecord('vertex', { id: '-1' });
		});
	});

	test('Changing a read-only relationship causes an exception', function() {
		expect(1);

		var vertex = store.getRecord('vertex', '4');

		throws(function() {
			vertex.clearBelongsTo('owner');
		});
	});
})();