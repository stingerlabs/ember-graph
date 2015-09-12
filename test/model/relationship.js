(function() {
	'use strict';

	var store;

	module('Relationship Functionality Test', {
		setup: function() {
			store = setupStore({
				user: EG.Model.extend({
					posts: EG.hasMany({
						relatedType: 'post',
						inverse: 'author',
						isRequired: false
					})
				}),

				post: EG.Model.extend({
					author: EG.hasOne({
						relatedType: 'user',
						inverse: 'posts',
						isRequired: false
					}),

					tags: EG.hasMany({
						relatedType: 'tag',
						inverse: null,
						isRequired: false,
						defaultValue: [{ type: 'tag', id: '0' }]
					})
				}),

				tag: EG.Model.extend()
			});

			store.pushPayload({
				user: [
					{ id: '1', posts: [{ type: 'post', id: '1' }, { type: 'post', id: '2' }] },
					{ id: '2', posts: [{ type: 'post', id: '3' }] },
					{ id: '3', posts: [{ type: 'post', id: '4' }, { type: 'post', id: '7' }] },
					{ id: '4', posts: [] }
				],
				post: [
					{ id: '1', author: { type: 'user', id: '1' }, tags: [{ type: 'tag', id: '1' },
						{ type: 'tag', id: '2' }, { type: 'tag', id: '3' }, { type: 'tag', id: '4' }] },
					{ id: '2', author: { type: 'user', id: '1' }, tags: [{ type: 'tag', id: '2' },
						{ type: 'tag', id: '3' }] },
					{ id: '3', author: { type: 'user', id: '2' }, tags: [] },
					{ id: '4', author: { type: 'user', id: '3' }, tags: [{ type: 'tag', id: '1' },
						{ type: 'tag', id: '4' }, { type: 'tag', id: '5' }] },
					{ id: '5', author: { type: 'user', id: '5' }, tags: [{ type: 'tag', id: '1' },
						{ type: 'tag', id: '4' }, { type: 'tag', id: '5' }] },
					{ id: '6', author: null, tags: [{ type: 'tag', id: '1' }, { type: 'tag', id: '2' },
						{ type: 'tag', id: '5' }] },
					// 7 is used as an unloaded record
					{ id: '8', author: null, tags: [{ type: 'tag', id: '4' }] }
				],

				tag: [
					{ id: '1' },
					{ id: '2' },
					{ id: '3' },
					{ id: '4' }
				]
			});
		}
	});

	test('Relationships are loaded correctly', function() {
		expect(10);

		var user1 = store.getRecord('user', '1');
		var user4 = store.getRecord('user', '4');
		var post1 = store.getRecord('post', '1');
		var post3 = store.getRecord('post', '3');
		var post5 = store.getRecord('post', '5');
		var post6 = store.getRecord('post', '6');

		deepEqual(user1.get('_posts').mapBy('id').sort(), ['1', '2'].sort());
		strictEqual(user4.get('_posts.length'), 0);

		strictEqual(post1.get('_author').id, '1');
		deepEqual(post1.get('_tags').mapBy('id').sort(), ['1', '2', '3', '4'].sort());
		strictEqual(post3.get('_author').id, '2');
		strictEqual(post3.get('_tags.length'), 0);
		strictEqual(post5.get('_author').id, '5');
		deepEqual(post5.get('_tags').mapBy('id').sort(), ['1', '4', '5'].sort());
		strictEqual(post6.get('_author'), null);
		deepEqual(post6.get('_tags').mapBy('id').sort(), ['1', '2', '5'].sort());
	});

	test('When a record is loaded, its pending relationships are attached', function() {
		expect(5);

		var user3 = store.getRecord('user', '3');
		ok(user3.get('_posts').mapBy('id').indexOf('7') >= 0);

		var rid;
		var relationship; // eslint-disable-line no-unused-vars
		var queued = store.get('queuedRelationships');

		for (var i in queued) {
			if (queued.hasOwnProperty(i)) {
				if (queued[i].get('type2') === 'post' && queued[i].get('id2') === '7') {
					rid = i;
					relationship = queued[rid];
					break;
				}
			}
		}

		store.pushPayload({
			post: [{
				id: '7',
				author: { type: 'user', id: '3' },
				tags: []
			}]
		});

		var post = store.getRecord('post', '7');

		strictEqual(typeof rid, 'string');
		strictEqual(queued[rid], undefined);
		ok(user3.get('_posts').mapBy('id').indexOf('7') >= 0);
		strictEqual(post.get('_author').id, '3');
	});

	test('A new record attaches to current records correctly', function() {
		expect(3);

		var user = store.getRecord('user', '1');
		var post = store.createRecord('post',
			{ author: { type: 'user', id: '1' }, tags: [{ type: 'tag', id: '1' }, { type: 'tag', id: '2' }] });

		strictEqual(post.get('_author').id, '1');
		deepEqual(post.get('_tags').mapBy('id').sort(), ['1', '2'].sort());
		ok(user.get('_posts').mapBy('id').indexOf(post.get('id')) >= 0);
	});

	test('Removing from a hasMany saved to the server works', function() {
		expect(2);

		var post1 = store.getRecord('post', '1');
		deepEqual(post1.get('_tags').mapBy('id').sort(), ['1', '2', '3', '4'].sort());

		post1.removeFromRelationship('tags', '2');
		deepEqual(post1.get('_tags').mapBy('id').sort(), ['1', '3', '4'].sort());
	});

	test('Removing a non existent hasMany item has no effect', function() {
		expect(1);

		var user1 = store.getRecord('user', '1');
		var current = user1.get('_posts').mapBy('id').sort();

		user1.removeFromRelationship('posts', '298133');
		deepEqual(user1.get('_posts').mapBy('id').sort(), current);
	});

	test('Disconnecting a hasOne saved to the server works', function() {
		expect(4);

		var user1 = store.getRecord('user', '1');
		var post1 = store.getRecord('post', '1');

		ok(user1.get('_posts').mapBy('id').indexOf('1') >= 0);
		strictEqual(post1.get('_author').id, '1');

		post1.clearHasOneRelationship('author');

		strictEqual(post1.get('_author'), null);
		ok(user1.get('_posts').mapBy('id').indexOf('1') < 0);
	});

	test('Disconnecting a null hasOne has no effect', function() {
		expect(2);

		var post6 = store.getRecord('post', '6');
		strictEqual(post6.get('_author'), null);
		post6.clearHasOneRelationship('author');
		strictEqual(post6.get('_author'), null);
	});

	test('Changing a hasOne from one record to another works', function() {
		expect(6);

		var user1 = store.getRecord('user', '1');
		var user2 = store.getRecord('user', '2');
		var post1 = store.getRecord('post', '1');

		ok(user1.get('_posts').mapBy('id').indexOf('1') >= 0);
		ok(user2.get('_posts').mapBy('id').indexOf('1') < 0);
		strictEqual(post1.get('_author').id, '1');

		post1.setHasOneRelationship('author', '2');

		ok(user1.get('_posts').mapBy('id').indexOf('1') < 0);
		ok(user2.get('_posts').mapBy('id').indexOf('1') >= 0);
		strictEqual(post1.get('_author').id, '2');
	});

	test('Rolling back a record with no changes has no effect', function() {
		expect(2);

		var post1 = store.getRecord('post', '1');
		var author = post1.get('_author');
		var tags = post1.get('_tags');

		post1.rollbackRelationships();

		deepEqual(post1.get('_author').id, author.id);
		deepEqual(post1.get('_tags').mapBy('id').sort(), tags.mapBy('id').sort());
	});

	test('Adding to a hasMany works properly', function() {
		expect(2);

		var post2 = store.getRecord('post', '2');
		ok(post2.get('_tags').mapBy('id').indexOf('1') < 0);
		post2.addToRelationship('tags', '1');
		ok(post2.get('_tags').mapBy('id').indexOf('1') >= 0);
	});

	test('Setting a hasOne works properly', function() {
		expect(4);

		var user1 = store.getRecord('user', '1');
		var post6 = store.getRecord('post', '6');

		ok(user1.get('_posts').mapBy('id').indexOf('6') < 0);
		strictEqual(post6.get('_author'), null);

		post6.setHasOneRelationship('author', '1');

		ok(user1.get('_posts').mapBy('id').indexOf('6') >= 0);
		strictEqual(post6.get('_author').id, '1');
	});

	test('Removing an item from a hasMany dirties both records', function() {
		expect(4);

		var user1 = store.getRecord('user', '1');
		var post1 = store.getRecord('post', '1');

		ok(!user1.get('isDirty'));
		ok(!post1.get('isDirty'));

		user1.removeFromRelationship('posts', '1');

		ok(user1.get('isDirty'));
		ok(post1.get('isDirty'));
	});

	test('Adding an item to a hasMany dirties both records', function() {
		expect(4);

		var user1 = store.getRecord('user', '1');
		var post6 = store.getRecord('post', '6');

		ok(!user1.get('isDirty'));
		ok(!post6.get('isDirty'));

		user1.addToRelationship('posts', '6');

		ok(user1.get('isDirty'));
		ok(post6.get('isDirty'));
	});

	test('Clearing a hasOne dirties both records', function() {
		expect(4);

		var user1 = store.getRecord('user', '1');
		var post1 = store.getRecord('post', '1');

		ok(!user1.get('isDirty'));
		ok(!post1.get('isDirty'));

		post1.clearHasOneRelationship('author');

		ok(user1.get('isDirty'));
		ok(post1.get('isDirty'));
	});

	test('Setting a hasOne dirties all three records (if applicable)', function() {
		expect(6);

		var user1 = store.getRecord('user', '1');
		var user2 = store.getRecord('user', '2');
		var post1 = store.getRecord('post', '1');

		ok(!user1.get('isDirty'));
		ok(!user2.get('isDirty'));
		ok(!post1.get('isDirty'));

		post1.setHasOneRelationship('author', '2');

		ok(user1.get('isDirty'));
		ok(user2.get('isDirty'));
		ok(post1.get('isDirty'));
	});

	test('Adding back a removed item to a hasMany cleans the record', function() {
		expect(3);

		var user1 = store.getRecord('user', '1');

		ok(!user1.get('isDirty'));
		user1.removeFromRelationship('posts', '1');
		ok(user1.get('isDirty'));
		user1.addToRelationship('posts', '1');
		ok(!user1.get('isDirty'));
	});

	test('Removing an added item from a hasMany cleans the record', function() {
		expect(3);

		var user1 = store.getRecord('user', '1');

		ok(!user1.get('isDirty'));
		user1.addToRelationship('posts', '6');
		ok(user1.get('isDirty'));
		user1.removeFromRelationship('posts', '6');
		ok(!user1.get('isDirty'));
	});

	test('Setting a cleared hasOne to the old value cleans the record', function() {
		expect(3);

		var post1 = store.getRecord('post', '1');

		ok(!post1.get('isDirty'));
		post1.clearHasOneRelationship('author');
		ok(post1.get('isDirty'));
		post1.setHasOneRelationship('author', '1');
		ok(!post1.get('isDirty'));
	});

	test('Clearing a set hasOne cleans the record', function() {
		expect(3);

		var post6 = store.getRecord('post', '6');

		ok(!post6.get('isDirty'));
		post6.setHasOneRelationship('author', '1');
		ok(post6.get('isDirty'));
		post6.clearHasOneRelationship('author');
		ok(!post6.get('isDirty'));
	});

	test('Rolling back relationship changes works', function() {
		expect(5);

		var post1 = store.getRecord('post', '1');
		var tags = post1.get('_tags');
		var author = post1.get('_author');

		ok(!post1.get('isDirty'));

		post1.clearHasOneRelationship('author');
		post1.removeFromRelationship('tags', '1');
		post1.addToRelationship('tags', '5');

		ok(post1.get('isDirty'));

		post1.rollbackRelationships();

		ok(!post1.get('isDirty'));
		deepEqual(post1.get('_tags').mapBy('id').sort(), tags.mapBy('id').sort());
		deepEqual(post1.get('_author'), author);
	});

	test('Changed relationships are detected correctly', function() {
		expect(4);

		var post = store.getRecord('post', '8');
		var tags = post.get('_tags');

		post.setHasOneRelationship('author', '1');
		post.addToRelationship('tags', '1');
		post.addToRelationship('tags', '2');
		post.removeFromRelationship('tags', '4');

		var changed = post.changedRelationships();

		strictEqual(changed.author[0], null);
		strictEqual(changed.author[1].id, '1');
		deepEqual(changed.tags[0].mapBy('id').sort(), tags.mapBy('id').sort());
		deepEqual(changed.tags[1].mapBy('id').sort(), ['1', '2'].sort());
	});

	test('Reloading a changed hasOne from the server works correctly (clean record)', function() {
		expect(2);

		var post = store.getRecord('post', '1');

		store.pushPayload({
			post: [
				{ id: '1', author: { type: 'user', id: '50' }, tags: post.get('_tags') }
			]
		});

		strictEqual(post.get('_author').id, '50');
		var user = store.getRecord('user', '1');
		ok(user.get('_posts').mapBy('id').indexOf('1') < 0);
	});

	test('Reloading a cleared hasOne from the server works correctly (clean record)', function() {
		expect(2);

		var post = store.getRecord('post', '1');

		store.pushPayload({
			post: [
				{ id: '1', author: null, tags: post.get('_tags') }
			]
		});

		strictEqual(post.get('_author'), null);
		var user = store.getRecord('user', '1');
		ok(user.get('_posts').mapBy('id').indexOf('1') < 0);
	});

	test('Reloading a changed hasMany from the server works correctly (clean record)', function() {
		expect(3);

		var user = store.getRecord('user', '1');

		store.pushPayload({
			user: [
				{ id: '1', posts: [{ type: 'post', id: '1' }, { type: 'post', id: '50' }, { type: 'post', id: '51' }] }
			]
		});

		var post1 = store.getRecord('post', '1');
		var post2 = store.getRecord('post', '2');

		deepEqual(user.get('_posts').mapBy('id').sort(), ['1', '50', '51'].sort());
		strictEqual(post1.get('_author').id, '1');
		strictEqual(post2.get('_author'), null);
	});

	test('Changing a record that isn\'t loaded yet will load changes on load', function() {
		expect(4);

		var user = store.getRecord('user', '3');
		ok(user.get('_posts').mapBy('id').indexOf('7') >= 0);
		user.removeFromRelationship('posts', '7');
		ok(user.get('_posts').mapBy('id').indexOf('7') < 0);

		store.pushPayload({
			post: [
				{ id: '7', author: { type: 'user', id: '3' }, tags: [] }
			]
		});

		var post = store.getRecord('post', '7');

		strictEqual(post.get('_author'), null);
		post.rollbackRelationships();
		strictEqual(post.get('_author').id, '3');
	});

	test('A new permanent record loaded creates new server relationships', function() {
		expect(3);

		store.pushPayload({
			post: [{
				id: '50',
				author: { type: 'user', id: '1' }
			}]
		});

		var post = store.getRecord('post', '50');
		deepEqual(post.get('_author'), { type: 'user', id: '1' });
		var user = store.getRecord('user', '1');
		ok(user.get('_posts').mapBy('id').indexOf('50') >= 0);
		user.rollbackRelationships();
		ok(user.get('_posts').mapBy('id').indexOf('50') >= 0);
	});

	asyncTest('Loading a hasOne relationship fully returns the correct record', function() {
		expect(2);

		var post = store.getRecord('post', '1');
		var user = store.getRecord('user', '1');
		var promise = post.get('author');

		start();
		ok(promise instanceof EG.PromiseObject);
		stop();

		promise.then(function(author) {
			start(0);
			ok(user === author);
		});
	});

	asyncTest('Loading a hasMany relationship fully returns the correct records', function() {
		expect(3);

		var user = store.getRecord('user', '1');
		var post1 = store.getRecord('post', '1');
		var post2 = store.getRecord('post', '2');

		var promise = user.get('posts');

		start();
		ok(promise instanceof EG.PromiseArray);
		stop();

		promise.then(function(posts) {
			start(0);

			var set1 = EG.Set.create();
			set1.addObjects(posts);
			var set2 = EG.Set.create();
			set2.addObjects([post1, post2]);

			ok(posts.length === 2);
			ok(set1.isEqual(set2));
		});
	});

	test('Client relationships can override server relationships', function() {
		expect(3);

		var post = store.getRecord('post', '1');
		deepEqual(post.get('_author'), { type: 'user', id: '1' });

		var user = store.createRecord('user', { posts: [{ type: 'post', id: '1' }] });
		ok(user.get('_posts').mapBy('id').indexOf('1') >= 0);
		strictEqual(post.get('_author').id, user.get('id'));
	});

	test('A hasMany can be changed by removing the record from its inverse', function() {
		expect(2);

		var user = store.getRecord('user', '1');
		var post = store.getRecord('post', '1');
		post.clearHasOneRelationship('author');

		ok(!user.get('_posts').contains('1'));
		ok(post.get('_author') === null);
	});

	test('Changing a relationship on one record propagates to the second and third records', function() {
		expect(6);

		var user1 = store.getRecord('user', '1');
		var user2 = store.getRecord('user', '2');
		var post = store.getRecord('post', '1');

		ok(user1.get('_posts').mapBy('id').indexOf('1') >= 0);
		ok(user2.get('_posts').mapBy('id').indexOf('1') < 0);
		deepEqual(post.get('_author'), { type: 'user', id: '1' });

		user2.addToRelationship('posts', '1');

		ok(user1.get('_posts').mapBy('id').indexOf('1') < 0);
		ok(user2.get('_posts').mapBy('id').indexOf('1') >= 0);
		deepEqual(post.get('_author'), { type: 'user', id: '2' });
	});

	test('A server side relationship on a non-loaded record can be overridden by a client side one', function() {
		expect(7);

		var user1 = store.getRecord('user', '1');
		var user3 = store.getRecord('user', '3');

		ok(user1.get('_posts').mapBy('id').indexOf('7') < 0);
		ok(user3.get('_posts').mapBy('id').indexOf('7') >= 0);

		user1.addToRelationship('posts', '7');

		ok(user1.get('_posts').mapBy('id').indexOf('7') >= 0);
		ok(user3.get('_posts').mapBy('id').indexOf('7') < 0);

		store.pushPayload({
			post: [{
				id: '7',
				author: { type: 'user', id: '3' },
				tags: [{ type: 'tag', id: '1' }, { type: 'tag', id: '2' }]
			}]
		});
		var post7 = store.getRecord('post', '7');

		ok(user1.get('_posts').mapBy('id').indexOf('7') >= 0);
		ok(user3.get('_posts').mapBy('id').indexOf('7') < 0);
		deepEqual(post7.get('_author'), { type: 'user', id: '1' });
	});

	test('Observers aren\'t fired until after the relationship operations are done', function() {
		// TODO: This test seems a bit unnecessary now. Transactions should be wrapped in `changeProperties`.
		expect(3);

		var post = store.getRecord('post', '1');
		deepEqual(post.get('_author'), { type: 'user', id: '1' });

		var observer = function(obj, prop) {
			if (Em.get(obj, prop).id !== '2') {
				throw new Error();
			}
		};
		post.addObserver('_author', observer);

		Em.changeProperties(function() {
			post.setHasOneRelationship('author', '2');
			deepEqual(post.get('_author'), { type: 'user', id: '2' });
			post.removeObserver('_author', observer);
		});

		observer = function(obj, prop) {
			if (Em.get(obj, prop).id !== '1') {
				throw new Error();
			}
		};

		Em.changeProperties(function() {
			post.addObserver('_author', observer);
			post.rollbackRelationships();
			deepEqual(post.get('_author'), { type: 'user', id: '1' });
			post.removeObserver('_author', observer);
		});
	});

	test('Modifying relationships works with records and not just IDs', function() {
		expect(6);

		var user = store.getRecord('user', '1');
		var post1 = store.getRecord('post', '1');
		var post6 = store.getRecord('post', '6');
		var tag1 = store.getRecord('tag', '1');

		strictEqual(post6.get('_author'), null);
		post6.setHasOneRelationship('author', user);
		deepEqual(post6.get('_author'), { type: 'user', id: '1' });

		ok(post1.get('_tags').mapBy('id').indexOf('1') >= 0);
		post1.removeFromRelationship('tags', tag1);
		ok(post1.get('_tags').mapBy('id').indexOf('1') < 0);

		ok(post6.get('_tags').mapBy('id').indexOf('3') < 0);
		post6.addToRelationship('tags', '3');
		ok(post6.get('_tags').mapBy('id').indexOf('3') >= 0);
	});

	test('Creating records with relationships works with records and not just IDs', function() {
		expect(2);

		var user = store.getRecord('user', '1');
		var tag1 = store.getRecord('tag', '1');
		var tag3 = store.getRecord('tag', '3');

		var post = store.createRecord('post', {
			author: user,
			tags: [tag1, tag3]
		});

		deepEqual(post.get('_author'), { type: 'user', id: '1' });
		deepEqual(post.get('_tags').toArray().mapBy('id').sort(), ['1', '3'].sort());
	});

	test('Creating a new record leaves the relationships undefined', function() {
		expect(2);

		var post = store.createRecord('post');
		ok(!post.isRelationshipInitialized('author'));
		ok(!post.isRelationshipInitialized('tags'));
	});
})();