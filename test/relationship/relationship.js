(function() {
	'use strict';

	var store;

	var CLIENT_STATE = EG.Relationship.CLIENT_STATE;

	module('Relationship Object Test', {
		setup: function() {
			store = setupStore({
				user: EG.Model.extend({
					posts: EG.hasMany({
						relatedType: 'post',
						inverse: 'author'
					})
				}),
				post: EG.Model.extend({
					author: EG.hasOne({
						relatedType: 'user',
						inverse: 'posts'
					})
				})
			});

			store.pushPayload({
				user: [{ id: '1', posts: [] }],
				post: [{ id: '1', author: null }, { id: '2', author: null }]
			});
		}
	});

	test('Relation testing', function() {
		expect(15);

		var user = store.getRecord('user', '1');
		var post = store.getRecord('post', '2');
		var other = store.getRecord('post', '1');

		var relationship = EG.Relationship.create('user', '1', 'posts', 'post', '2', 'author', CLIENT_STATE);

		strictEqual(relationship.otherType(user), 'post');
		strictEqual(relationship.otherType(post), 'user');
		strictEqual(relationship.otherId(user), '2');
		strictEqual(relationship.otherId(post), '1');
		strictEqual(relationship.otherName(user), 'author');
		strictEqual(relationship.otherName(post), 'posts');
		strictEqual(relationship.thisName(user), 'posts');
		strictEqual(relationship.thisName(post), 'author');
		strictEqual(relationship.isConnectedTo(user), true);
		strictEqual(relationship.isConnectedTo(post), true);
		strictEqual(relationship.isConnectedTo(other), false);
		strictEqual(relationship.matchesOneSide('user', '1', 'posts'), true);
		strictEqual(relationship.matchesOneSide('post', '2', 'author'), true);
		strictEqual(relationship.matchesOneSide('user', '1', 'author'), false);
		strictEqual(relationship.matchesOneSide('test', 'foo', 'bar'), false);
	});
})();
