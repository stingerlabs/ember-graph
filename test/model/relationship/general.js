(function() {
	'use strict';

	var store;

	module('General Relationship Functionality', {
		setup: function() {
			store = setupStore({
				user: EG.Model.extend({
					vertices: EG.hasMany({
						relatedType: 'vertex',
						isRequired: false,
						inverse: 'owner',
						defaultValue: [{ type: 'vertex', id: '0' }]
					})
				}),

				vertex: EG.Model.extend({
					owner: EG.hasOne({
						relatedType: 'user',
						isRequired: true,
						inverse: 'vertices',
						readOnly: true
					}),

					tags: EG.hasMany({
						relatedType: 'tag',
						isRequired: false,
						inverse: null
					})
				}),

				tag: EG.Model.extend()
			});

			store.pushPayload({
				user: [
					{
						id: '1',
						vertices: [
							{ type: 'vertex', id: '1' },
							{ type: 'vertex', id: '2' },
							{ type: 'vertex', id: '3' },
							{ type: 'vertex', id: '4' }
						]
					},
					{
						id: '2'
					}
				],
				vertex: [
					{
						id: '1',
						owner: { type: 'user', id: '1' },
						tags: [
							{ type: 'tag', id: '1' },
							{ type: 'tag', id: '3' },
							{ type: 'tag', id: '5' }
						]
					},
					{
						id: '2',
						owner: { type: 'user', id: '1' },
						tags: [
							{ type: 'tag', id: '2' },
							{ type: 'tag', id: '4' },
							{ type: 'tag', id: '6' }
						]
					},
					{
						id: '4',
						owner: { type: 'user', id: '3' }
					}
				]
			});
		}
	});

	test('Loading a record with relationships works properly', function() {
		expect(3);

		var user = store.getRecord('user', '1');
		deepEqual(user.get('_vertices').mapBy('id').sort(), ['1', '2', '3'].sort());

		var vertex = store.getRecord('vertex', '2');
		deepEqual(vertex.get('_tags').mapBy('id').sort(), ['2', '4', '6'].sort());
		deepEqual(vertex.get('_owner'), { type: 'user', id: '1' });
	});

	test('Default relationship values are populated properly', function() {
		expect(2);

		var user = store.getRecord('user', '2');
		deepEqual(user.get('_vertices'), [{ type: 'vertex', id: '0' }]);

		var vertex = store.getRecord('vertex', '4');
		deepEqual(vertex.get('_tags'), []);
	});

	test('Leaving out a required relationship causes an exception', function() {
		expect(1);

		throws(function() {
			store.pushPayload({
				vertex: [{ id: '-1' }]
			});
		});
	});

	test('Changing a read-only relationship causes an exception', function() {
		expect(1);

		var vertex = store.getRecord('vertex', '4');

		throws(function() {
			vertex.clearHasOneRelationship('owner');
		});
	});

	test('Changing a read-only relationship on a new record succeeds', function() {
		expect(1);

		var vertex = store.createRecord('vertex');
		vertex.setHasOneRelationship('owner', '2');
		deepEqual(vertex.get('_owner'), { type: 'user', id: '2' });
	});
})();