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

					author: EG.belongsTo({
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

	test('The serializer can serializer a record properly', function() {
		expect(5);

		var post = store.getRecord('post', '1');
		var json = serializer.serialize(post, { includeId: true });

		ok(json.id === post.get('id'));
		ok(json.title === post.get('title'));
		ok(json.body === post.get('body'));
		ok(json.links.author === post.get('_author'));
		ok(new Em.Set(json.links.tags).isEqual(post.get('_tags')));
	});

	test('The serializer leaves out temporary IDs in relationships', function() {
		expect(3);

		var post = store.getRecord('post', '1');
		var tag = store.createRecord('tag', { name: 'temp' });
		var user = store.createRecord('user', { email: 'temp', posts: ['1'] });
		post.addToRelationship('tags', tag.get('id'));

		ok(post.get('_author') === user.get('id'));
		ok(user.get('_posts').contains('1'));
		ok(post.get('_tags').contains(tag.get('id')));
	});

	test('Deserialization extracts a single record properly', function() {
		expect(1);

		var payload = {
			posts: [{ id: '100', title: 52, body: 53, links: { author: '1', tags: [] } }]
		};

		var expected = {
			post: [{
				id: '100',
				title: '52',
				body: '53',
				author: '1',
				tags: []
			}]
		};

		deepEqual(serializer.deserialize(payload), expected);
	});

	test('The serializer uses type serializers correctly', function() {
		expect(1);

		var payload = {
			posts: [{ id: '100', title: 52, body: 53, links: { author: '1', tags: [] } }]
		};

		var expected = {
			post: [{
				id: '100',
				title: '52',
				body: '53',
				author: '1',
				tags: []
			}]
		};

		deepEqual(serializer.deserialize(payload), expected);
	});

	test('Deserialization extracts fetched records of different types properly', function() {
		expect(1);

		var payload = {
			users: [{ id: '100', email: '', links: { posts: ['100', '101'] } }],
			posts: [
				{ id: '100', title: '', body: '', links: { author: '100', tags: [] } },
				{ id: '101', title: '', body: '', links: { author: '100', tags: [] } }
			]
		};

		var expected = {
			user: [{ id: '100', email: '', posts: ['100', '101'] }],
			post: [
				{ id: '100', title: '', body: '', author: '100', tags: [] },
				{ id: '101', title: '', body: '', author: '100', tags: [] }
			]
		};

		deepEqual(serializer.deserialize(payload), expected);
	});

	test('Deserialization extracts linked records properly', function() {
		expect(1);

		var payload = {
			posts: [{ id: '100', title: '', body: '', links: { author: '100', tags: ['100', '101' ]} }],
			linked: {
				users: [{ id: '100', email: '', links: { posts: ['100'] }}],
				tags: [{ id: '100', name: '' }, { id: '101', name: '' }]
			}
		};

		var expected = {
			post: [{ id: '100', title: '', body: '', author: '100', tags: ['100', '101'] }],
			user: [{ id: '100', email: '', posts: ['100'] }],
			tag: [{ id: '100', name: '' }, { id: '101', name: '' }]
		};

		deepEqual(serializer.deserialize(payload), expected);
	});

	test('Deserialization converts IDs to strings', function() {
		expect(1);

		var payload = {
			users: [{ id: '100', email: '', links: { posts: [1, 2, 3, 4] } }]
		};

		var expected = {
			user: [{ id: '100', email: '', posts: ['1', '2', '3', '4'] }]
		};

		deepEqual(serializer.deserialize(payload), expected);
	});

	test('Deserialization detects a missing ID', function() {
		expect(1);

		var payload = {
			tags: [{ name: '' }]
		};

		var result = serializer.deserialize(payload);
		ok(!result.tag || result.tag.length === 0);
	});

	test('Deserialization detects missing attributes', function() {
		expect(1);

		var payload = {
			tags: [{ id: 1 }]
		};

		var result = serializer.deserialize(payload);
		ok(!result.tag || result.tag.length === 0);
	});

	test('Deserialization detects extra attributes', function() {
		expect(1);

		var payload = {
			tags: [{ id: 1, name: '', foo: null }]
		};

		var result = serializer.deserialize(payload);
		ok(!result.tag || result.tag.length === 0);
	});

	test('Deserialization detects missing relationships', function() {
		expect(1);

		var payload = {
			posts: [{ id: 1, title: '', body: '' }]
		};

		var result = serializer.deserialize(payload);
		ok(!result.post || result.post.length === 0);
	});

	test('Deserialization detects extra relationships', function() {
		expect(1);

		var payload = {
			posts: [{ id: 1, title: '', body: '' , links: { author: 100, tags: [], none: null } }]
		};

		var result = serializer.deserialize(payload);
		ok(!result.post || result.post.length === 0);
	});

	test('Deserialization works with a missing `links` object (if no relationships are defined)', function() {
		expect(1);

		var payload = {
			tags: [{ id: 100, name: '' }, { id: 101, name: '' }]
		};

		var expected = {
			tag: [{ id: '100', name: '' }, { id: '101', name: '' }]
		};

		deepEqual(serializer.deserialize(payload), expected);
	});

	test('Deserialization includes the `ids` array on a query', function() {
		expect(1);

		var payload = {
			tags: [{ id: 1, name: '' }, { id: 8, name: '' }, { id: 7, name: '' }, { id: 3, name: '' }],
			linked: {}
		};

		var ids = ['1', '3', '7', '8'];

		deepEqual(serializer.deserialize(payload, { isQuery: true }).ids.sort(), ids);
	});
})();