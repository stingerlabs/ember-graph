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
				{ id: 3, title: 'Test Post 3', links: { author: 1, tags: [1, 3] } },
				{ id: 4, title: 'Test Post 4', body: 'Body4', links: { author: '1', tags: ['2', '4'] } }
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

		var normalized = serializer.deserialize(payload, { requestType: 'findAll', recordType: 'post' });

		deepEqual(normalized, expected);
	});

	test('Deserialize a create record payload', function() {
		expect(1);

		var payload = {
			posts: [{ id: 200, title: '', links: { author: 1, tags: [] } }]
		};

		var expected = {
			meta: {
				serverMeta: {},
				newId: '200'
			},
			post: [{ id: '200', title: '', body: '', author: '1', tags: [] }]
		};

		var normalized = serializer.deserialize(payload, { requestType: 'createRecord', recordType: 'post' });

		deepEqual(normalized, expected);
	});

	test('Deserialize a query payload', function() {
		expect(1);

		var query = { foo: 'bar', spam: 1, eggs: [] };

		var payload = {
			posts: [
				{ id: 158, title: '', links: { author: 1, tags: [] } },
				{ id: 98, title: '', links: { author: 1, tags: [] } },
				{ id: 262, title: '', links: { author: 1, tags: [] } },
				{ id: 0, title: '', links: { author: 1, tags: [] } }
			]
		};

		var expected = {
			meta: {
				serverMeta: {},
				queryIds: ['158', '98', '262', '0']
			},

			post: [
				{ id: '158', title: '', body: '', author: '1', tags: [] },
				{ id: '98', title: '', body: '', author: '1', tags: [] },
				{ id: '262', title: '', body: '', author: '1', tags: [] },
				{ id: '0', title: '', body: '', author: '1', tags: [] }
			]
		};

		var normalized = serializer.deserialize(payload, { requestType: 'findQuery', recordType: 'post', query: query});

		deepEqual(normalized, expected);
	});

	test('Invalid/missing values during deserialization throw errors', function() {
		expect(5);

		var options = { requestType: 'findRecord', recordType: 'post' };

		throws(function() {
			serializer.deserialize({ posts: [{ title: '', links: { author: 1, tags: [] } }] }, options);
		}, /missing an id/i,  'Missing ID');

		throws(function() {
			serializer.deserialize({ posts: [{ id: {}, title: '', links: { author: 1, tags: [] } }] }, options);
		}, /invalid id/i, 'Invalid ID');

		throws(function() {
			serializer.deserialize({ posts: [{ id: 0, links: { author: 1, tags: [] } }] }, options);
		}, /attribute was missing/i ,'Missing attribute');

		throws(function() {
			serializer.deserialize({ posts: [{ id: 0, title: '', links: { author: 1 } }] }, options);
		}, /relationship was missing/i, 'Missing relationship');

		throws(function() {
			serializer.deserialize({ posts: [{ id: 0, title: '', links: { author: 1, tags: null } }] }, options);
		}, /invalid hasmany/i, 'Invalid relationship');
	});
})();