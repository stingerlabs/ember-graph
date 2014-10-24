(function() {
	'use strict';

	var store;

	var jsonSort = function(a, b) {
		return (JSON.stringify(a) < JSON.stringify(b) ? -1 : 1);
	};

	module('Polymorphic Relationships Test', {
		setup: function() {
			var User = EG.Model.extend({
				posts: EG.hasMany({
					relatedType: 'post',
					inverse: 'author',
					polymorphic: true
				})
			});

			var Post = EG.Model.extend({
				author: EG.hasOne({
					relatedType: 'user',
					inverse: 'posts',
					polymorphic: true
				})
			});

			store = setupStore({
				user: User,
				admin: User.extend({
					isAdmin: EG.attr({ type: 'boolean', defaultValue: true })
				}),
				member: User.extend({
					isMember: EG.attr({ type: 'boolean', defaultValue: true })
				}),
				post: Post,
				thread: Post.extend({
					isThread: EG.attr({ type: 'boolean', defaultValue: true }),
					comments: EG.hasMany({
						relatedType: 'comment',
						inverse: 'thread'
					})
				}),
				comment: Post.extend({
					isComment: EG.attr({ type: 'boolean', defaultValue: true }),
					thread: EG.hasOne({
						relatedType: 'thread',
						inverse: 'comments'
					})
				})
			});

			store.pushPayload({
				admin: [{
					id: '1',
					posts: [
						{ type: 'thread', id: '1' },
						{ type: 'comment', id: '1' },
						{ type: 'comment', id: '3' }
					]
				}],
				member: [{
					id: '1',
					posts: [
						{ type: 'thread', id: '2' },
						{ type: 'comment', id: '2' }
					]
				}, {
					id: '2',
					posts: [
						{ type: 'comment', id: '4' }
					]
				}],
				thread: [{
					id: '1',
					author: { type: 'admin', id: '1' },
					comments: [
						{ type: 'comment', id: '1' },
						{ type: 'comment', id: '2' }
					]
				}, {
					id: '2',
					author: { type: 'member', id: '1' },
					comments: [
						{ type: 'comment', id: '3' },
						{ type: 'comment', id: '4' }
					]
				}],
				comment: [{
					id: '1',
					author: { type: 'admin', id: '1' },
					thread: { type: 'thread', id: '1' }
				}, {
					id: '2',
					author: { type: 'member', id: '1' },
					thread: { type: 'thread', id: '1' }
				}, {
					id: '3',
					author: { type: 'admin', id: '1' },
					thread: { type: 'thread', id: '2' }
				}, {
					id: '4',
					author: { type: 'member', id: '2' },
					thread: { type: 'thread', id: '2' }
				}]
			});
		}
	});

	test('Metadata is setup correctly', function() {
		expect(10);

		var userPostsMeta = store.modelFor('user').metaForRelationship('posts');
		var adminPostsMeta = store.modelFor('admin').metaForRelationship('posts');
		var memberPostsMeta = store.modelFor('member').metaForRelationship('posts');
		var postAuthorMeta = store.modelFor('post').metaForRelationship('author');
		var threadAuthorMeta = store.modelFor('thread').metaForRelationship('author');
		var commentAuthorMeta = store.modelFor('comment').metaForRelationship('author');

		deepEqual(adminPostsMeta, userPostsMeta);
		deepEqual(memberPostsMeta, userPostsMeta);
		deepEqual(threadAuthorMeta, postAuthorMeta);
		deepEqual(commentAuthorMeta, postAuthorMeta);

		ok(userPostsMeta.isPolymorphic);
		ok(postAuthorMeta.isPolymorphic);

		strictEqual(userPostsMeta.relatedType, 'post');
		strictEqual(postAuthorMeta.relatedType, 'user');

		strictEqual(userPostsMeta.inverse, 'author');
		strictEqual(postAuthorMeta.inverse, 'posts');
	});

	test('Admin values are correct', function() {
		expect(3);

		var admin = store.getRecord('admin', '1');
		var expectedPosts = [
			{ type: 'thread', id: '1' },
			{ type: 'comment', id: '1' },
			{ type: 'comment', id: '3' }
		].sort(jsonSort);

		deepEqual(admin.get('_posts').sort(jsonSort), expectedPosts);
		ok(admin.get('isAdmin'));
		ok(!admin.get('isMember'));
	});

	test('Member 1 values are correct', function() {
		expect(3);

		var member = store.getRecord('member', '1');
		var expectedPosts = [
			{ type: 'thread', id: '2' },
			{ type: 'comment', id: '2' }
		].sort(jsonSort);

		deepEqual(member.get('_posts').sort(jsonSort), expectedPosts);
		ok(!member.get('isAdmin'));
		ok(member.get('isMember'));
	});

	test('Member 2 values are correct', function() {
		expect(3);

		var member = store.getRecord('member', '2');
		var expectedPosts = [
			{ type: 'comment', id: '4' }
		];

		deepEqual(member.get('_posts'), expectedPosts);
		ok(!member.get('isAdmin'));
		ok(member.get('isMember'));
	});

	test('Thread 1 values are correct', function() {
		expect(4);

		var thread = store.getRecord('thread', '1');
		var expectedAuthor = { type: 'admin', id: '1' };
		var expectedComments = [
			{ type: 'comment', id: '1' },
			{ type: 'comment', id: '2' }
		].sort(jsonSort);

		deepEqual(thread.get('_author'), expectedAuthor);
		deepEqual(thread.get('_comments').sort(jsonSort), expectedComments);
		ok(thread.get('isThread'));
		ok(!thread.get('isComment'));
	});

	test('Thread 2 values are correct', function() {
		expect(4);

		var thread = store.getRecord('thread', '2');
		var expectedAuthor = { type: 'member', id: '1' };
		var expectedComments = [
			{ type: 'comment', id: '3' },
			{ type: 'comment', id: '4' }
		].sort(jsonSort);

		deepEqual(thread.get('_author'), expectedAuthor);
		deepEqual(thread.get('_comments').sort(jsonSort), expectedComments);
		ok(thread.get('isThread'));
		ok(!thread.get('isComment'));
	});

	test('Comment 1 values are correct', function() {
		expect(4);

		var comment = store.getRecord('comment', '1');
		deepEqual(comment.get('_author'), { type: 'admin', id: '1' });
		deepEqual(comment.get('_thread'), { type: 'thread', id: '1' });
		ok(!comment.get('isThread'));
		ok(comment.get('isComment'));
	});

	test('Comment 2 values are correct', function() {
		expect(4);

		var comment = store.getRecord('comment', '2');
		deepEqual(comment.get('_author'), { type: 'member', id: '1' });
		deepEqual(comment.get('_thread'), { type: 'thread', id: '1' });
		ok(!comment.get('isThread'));
		ok(comment.get('isComment'));
	});

	test('Comment 3 values are correct', function() {
		expect(4);

		var comment = store.getRecord('comment', '3');
		deepEqual(comment.get('_author'), { type: 'admin', id: '1' });
		deepEqual(comment.get('_thread'), { type: 'thread', id: '2' });
		ok(!comment.get('isThread'));
		ok(comment.get('isComment'));
	});

	test('Comment 4 values are correct', function() {
		expect(4);

		var comment = store.getRecord('comment', '4');
		deepEqual(comment.get('_author'), { type: 'member', id: '2' });
		deepEqual(comment.get('_thread'), { type: 'thread', id: '2' });
		ok(!comment.get('isThread'));
		ok(comment.get('isComment'));
	});
})();