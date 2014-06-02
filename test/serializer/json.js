(function() {
	'use strict';

	var store;
	var serializer;

	module('JSON Serializer Test', {
		setup: function() {
			store = setupStore({
				user: EG.Model.extend({
					email: EG.attr({
						type: 'string',
						isRequired: true,
						readOnly: true
					}),

					posts: EG.hasMany({
						relatedType: 'post',
						inverse: 'author',
						isRequired: true
					})
				}),

				post: EG.Model.extend({
					title: EG.attr({
						type: 'string',
						isRequired: true,
						readOnly: true
					}),

					body: EG.attr({
						type: 'string',
						isRequired: false,
						defaultValue: ''
					}),

					author: EG.hasOne({
						relatedType: 'user',
						inverse: 'posts',
						isRequired: true
					}),

					tags: EG.hasMany({
						relatedType: 'tag',
						inverse: null,
						isRequired: true
					})
				}),

				tag: EG.Model.extend({
					name: EG.attr({
						type: 'string',
						isRequired: true,
						readOnly: true
					})
				})
			});

			serializer = EG.JSONSerializer.create({ store: store });

			store._loadRecord('user', { id: '1', email: 'test@test.com', posts: ['1', '2'] });

			store._loadRecord('post', { id: '1', title: 'Test Post 1', body: 'Body1', author: '1', tags: ['1', '2'] });
			store._loadRecord('post', { id: '2', title: 'Test Post 2', body: 'Body2', author: '1', tags: ['3', '4'] });

			store._loadRecord('tag', { id: '1', name: 'foo' });
			store._loadRecord('tag', { id: '2', name: 'bar' });
			store._loadRecord('tag', { id: '3', name: 'spam' });
			store._loadRecord('tag', { id: '4', name: 'eggs' });
		}
	});

	test('Deserialize a normal payload', function() {
		expect(1);

		var payload = {
			posts: [
				{ id: 3, title: 'Test Post 3', author: 1, tags: [1, 3] },
				{ id: 4, title: 'Test Post 4', body: 'Body4', author: '1', tags: ['2', '4'] }
			],
			linked: {
				tags: [
					{ id: 10, name: '10' },
					{ id: 11, name: '11' }
				]
			}
		};

		var expected = {
			meta: {
				serverMeta: {}
			},
			post: [
				{ id: '3', title: 'Test Post 3', body: '', author: '1', tags: ['1', '3'] },
				{ id: '4', title: 'Test Post 4', body: 'Body4', author: '1', tags: ['2', '4'] }
			],
			tag: [
				{ id: '10', name: '10' },
				{ id: '11', name: '11' }
			]
		};

		var normalized = serializer.deserialize(payload);

		deepEqual(normalized, expected);
	});
})();