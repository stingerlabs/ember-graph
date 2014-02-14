(function() {
	'use strict';

	var store;
	var serializer;

	module('JSON Serializer Test', {
		setup: function() {
			store = Eg.Store.create();
			serializer = Eg.JSONSerializer.create({ store: store });

			store.createModel('user', {
				email: Eg.attr({
					type: 'string',
					isRequired: true,
					readOnly: true
				}),

				posts: Eg.hasMany({
					relatedType: 'post',
					inverse: 'author',
					isRequired: true
				})
			});

			store.createModel('post', {
				title: Eg.attr({
					type: 'string',
					isRequired: true,
					readOnly: true
				}),

				body: Eg.attr({
					type: 'string',
					isRequired: false,
					defaultValue: ''
				}),

				author: Eg.belongsTo({
					relatedType: 'user',
					inverse: 'posts',
					isRequired: true
				}),

				tags: Eg.hasMany({
					relatedType: 'tag',
					inverse: null,
					isRequired: true
				})
			});

			store.createModel('tag', {
				name: Eg.attr({
					type: 'string',
					isRequired: true,
					readOnly: true
				})
			});

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
		ok(json.links.author === post.get('author'));
		ok(new Em.Set(json.links.tags).isEqual(post.get('tags')));
	});

	test('The serializer leaves out temporary IDs in relationships', function() {
		expect(3);

		var post = store.getRecord('post', '1');
		var tag = store.createRecord('tag', { name: 'temp' });
		var user = store.createRecord('user', { email: 'temp', posts: ['1'] });
		post.addToRelationship('tags', tag.get('id'));

		ok(post.get('author') === user.get('id'));
		ok(user.get('posts').contains('1'));
		ok(post.get('tags').contains(tag.get('id')));
	});

	test('The serializer uses type serializers correctly', function() {
		expect(0);
	});

	test('Deserialization extracts a single record properly', function() {
		expect(0);
	});

	test('Deserialization extracts fetched records of different types properly', function() {
		expect(0);
	});

	test('Deserialization extracts linked records properly', function() {
		expect(0);
	});

	test('Deserialization converts IDs to strings', function() {
		expect(0);
	});

	test('Deserialization detects a missing ID', function() {
		expect(0);
	});

	test('Deserialization detects missing attributes', function() {
		expect(0);
	});

	test('Deserialization detects extra attributes', function() {
		expect(0);
	});

	test('Deserialization detects missing relationships', function() {
		expect(0);
	});

	test('Deserialization detects extra relationships', function() {
		expect(0);
	});

	test('Deserialization works with a missing `links` object (if no relationships are defined)', function() {
		expect(0);
	});
})();