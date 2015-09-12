(function() {
	'use strict';

	var store;
	var serializer;

	var jsonSort = function(a, b) {
		// Order doesn't matter, as long as it's consistent
		return (JSON.stringify(a) < JSON.stringify(b) ? -1 : 1);
	};

	module('JSON Serializer Test (Non-Polymorphic)', {
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

			store.pushPayload({
				user: [{
					id: '1',
					email: 'test@test.com',
					posts: [{ type: 'post', id: '1' }, { type: 'post', id: '2' }]
				}],
				post: [{
					id: '1',
					title: 'Title Post 1',
					body: 'Body1',
					author: { type: 'user', id: '1' },
					tags: [{ type: 'tag', id: '1' }, { type: 'tag', id: '2' }]
				}, {
					id: '2',
					title: 'Title Post 2',
					body: 'Body2',
					author: { type: 'user', id: '1' },
					tags: [{ type: 'tag', id: '3' }, { type: 'tag', id: '4' }]
				}],
				tag: [
					{ id: '1', name: 'foo' },
					{ id: '2', name: 'bar' },
					{ id: '3', name: 'spam' },
					{ id: '4', name: 'eggs' }
				]
			});
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
				{
					id: '3',
					title: 'Test Post 3',
					body: '',
					author: { type: 'user', id: '1' },
					tags: [{ type: 'tag', id: '1' }, { type: 'tag', id: '3' }]
				},
				{
					id: '4',
					title: 'Test Post 4',
					body: 'Body4',
					author: { type: 'user', id: '1' },
					tags: [{ type: 'tag', id: '2' }, { type: 'tag', id: '4' }]
				}
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
				createdRecord: { type: 'post', id: '200' }
			},
			post: [{
				id: '200',
				title: '',
				body: '',
				author: { type: 'user', id: '1' },
				tags: []
			}]
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
				matchedRecords: [
					{ type: 'post', id: '158' },
					{ type: 'post', id: '98' },
					{ type: 'post', id: '262' },
					{ type: 'post', id: '0' }
				]
			},

			post: [
				{ id: '158', title: '', body: '', author: { type: 'user', id: '1' }, tags: [] },
				{ id: '98', title: '', body: '', author: { type: 'user', id: '1' }, tags: [] },
				{ id: '262', title: '', body: '', author: { type: 'user', id: '1' }, tags: [] },
				{ id: '0', title: '', body: '', author: { type: 'user', id: '1' }, tags: [] }
			]
		};

		var serializerOptions = { requestType: 'findQuery', recordType: 'post', query: query };
		var normalized = serializer.deserialize(payload, serializerOptions);

		deepEqual(normalized, expected);
	});

	test('Invalid/missing values during deserialization throw errors', function() {
		expect(4);

		var options = { requestType: 'findRecord', recordType: 'post' };

		throws(function() {
			serializer.deserialize({ posts: [{ title: '', links: { author: 1, tags: [] } }] }, options);
		}, /invalid id/i,  'Missing ID');

		throws(function() {
			serializer.deserialize({ posts: [{ id: {}, title: '', links: { author: 1, tags: [] } }] }, options);
		}, /invalid id/i, 'Invalid ID');

		throws(function() {
			serializer.deserialize({ posts: [{ id: 0, links: { author: 1, tags: [] } }] }, options);
		}, /attribute was missing/i, 'Missing attribute');

		throws(function() {
			serializer.deserialize({ posts: [{ id: 0, title: '', links: { author: 1 } }] }, options);
		}, /missing \`.*\` relationship/i, 'Missing relationship');

// TODO: PhantomJS bug?
//		throws(function() {
//			serializer.deserialize({ posts: [{ id: 0, title: '', links: { author: 1, tags: null } }] }, options);
//		});
	});

	test('Serialize a create record request', function() {
		expect(1);

		var post = store.createRecord('post', {
			title: 'title',
			body: 'body',
			author: '1',
			tags: []
		});

		var expected = {
			posts: [{
				title: 'title',
				body: 'body',
				links: {
					author: '1',
					tags: []
				}
			}]
		};

		var serialized = serializer.serialize(post, { requestType: 'createRecord' });

		deepEqual(serialized, expected);
	});

	test('Serialize a create record request (2)', function() {
		expect(1);

		var post = store.createRecord('post', {
			title: 'title',
			body: 'body',
			author: null,
			tags: []
		});

		var expected = {
			posts: [{
				title: 'title',
				body: 'body',
				links: {
					author: null,
					tags: []
				}
			}]
		};

		var serialized = serializer.serialize(post, { requestType: 'createRecord' });

		deepEqual(serialized, expected);
	});

	test('Serialize an update request properly', function() {
		expect(1);

		var post = store.getRecord('post', '1');

		post.removeFromRelationship('tags', '2');
		post.addToRelationship('tags', '7');
		post.clearHasOneRelationship('author');
		post.set('body', null);

		var expected = [
			{ op: 'remove', path: '/links/tags/2', value: '2' },
			{ op: 'add', path: '/links/tags', value: '7' },
			{ op: 'replace', path: '/links/author', value: null },
			{ op: 'replace', path: '/body', value: null }
		];

		var operations = serializer.serialize(post, { requestType: 'updateRecord' });

		deepEqual(operations.sort(jsonSort), expected.sort(jsonSort));
	});

	test('Deserialize payload with no options', function() {
		expect(1);

		var payload = {
			posts: [
				{ id: 158, title: '', links: { author: 1, tags: [] } },
				{ id: 98, title: '', links: { author: 1, tags: [10] } },
				{ id: 26, title: '', links: { author: 1, tags: [11] } },
				{ id: 0, title: '', links: { author: 1, tags: [] } }
			],
			tags: [
				{ id: 10, name: '10' },
				{ id: 11, name: '11' }
			]
		};

		var expected = {
			meta: {
				serverMeta: {}
			},

			post: [
				{ id: '158', title: '', body: '', author: { type: 'user', id: '1' }, tags: [] },
				{ id: '98', title: '', body: '', author: { type: 'user', id: '1' }, tags: [{ type: 'tag', id: '10' }] },
				{ id: '26', title: '', body: '', author: { type: 'user', id: '1' }, tags: [{ type: 'tag', id: '11' }] },
				{ id: '0', title: '', body: '', author: { type: 'user', id: '1' }, tags: [] }
			],

			tag: [
				{ id: '10', name: '10' },
				{ id: '11', name: '11' }
			]
		};

		deepEqual(serializer.deserialize(payload), expected);
	});

	test('Temporary IDs aren\'t serialized in deltas', function() {
		expect(1);

		var user = store.getRecord('user', '1');
		store.createRecord('post', { title: '', author: '1', tags: [] });
		store.createRecord('post', { title: '', author: '1', tags: [] });
		store.createRecord('post', { title: '', author: '1', tags: [] });

		deepEqual(serializer.serializeDelta(user), []);
	});

	test('Top-level and linked objects are all deserialized', function() {
		expect(1);

		var payload = {
			tags: [{ id: '1', name: 'One' }],
			linked: {
				tags: [{ id: '2', name: 'Two' }]
			}
		};

		var expected = {
			meta: {
				serverMeta: {}
			},
			tag: [
				{ id: '1', name: 'One' },
				{ id: '2', name: 'Two' }
			]
		};

		deepEqual(serializer.deserialize(payload, {}), expected);
	});
})();