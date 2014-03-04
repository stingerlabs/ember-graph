(function() {
	'use strict';

	var HAS_ONE_KEY = EG.Model.HAS_ONE_KEY;
	var HAS_MANY_KEY = EG.Model.HAS_MANY_KEY;

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
						defaultValue: ['0']
					})
				}),

				tag: EG.Model.extend()
			});

			store._loadRecord('user', { id: '1', posts: ['1', '2'] });
			store._loadRecord('user', { id: '2', posts: ['3'] });
			store._loadRecord('user', { id: '3', posts: ['4', '7'] });
			store._loadRecord('user', { id: '4', posts: [] });

			store._loadRecord('post', { id: '1', author: '1', tags: ['1', '2', '3', '4'] });
			store._loadRecord('post', { id: '2', author: '1', tags: ['2', '3'] });
			store._loadRecord('post', { id: '3', author: '2', tags: [] });
			store._loadRecord('post', { id: '4', author: '3', tags: ['1', '4', '5'] });
			store._loadRecord('post', { id: '5', author: '5', tags: ['1', '4', '5'] });
			store._loadRecord('post', { id: '6', author: null, tags: ['1', '2', '5'] });
			// 7 is used as an unloaded record
			store._loadRecord('post', { id: '8', author: null, tags: ['4'] });

			store._loadRecord('tag', { id: '1' });
			store._loadRecord('tag', { id: '2' });
			store._loadRecord('tag', { id: '3' });
			store._loadRecord('tag', { id: '4' });
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

		ok(user1.get('_posts').isEqual(['1', '2']));
		ok(user4.get('_posts.length') === 0);

		ok(post1.get('_author') === '1');
		ok(post1.get('_tags').isEqual(['1', '2', '3', '4']));
		ok(post3.get('_author') === '2');
		ok(post3.get('_tags.length') === 0);
		ok(post5.get('_author') === '5');
		ok(post5.get('_tags').isEqual(['1', '4', '5']));
		ok(post6.get('_author') === null);
		ok(post6.get('_tags').isEqual(['1', '2', '5']));
	});

	test('Relationship defaults are loaded correctly', function() {
		expect(3);

		var user = store.createRecord('user');
		ok(user.get('_posts.length') === 0);

		var post = store.createRecord('post');
		ok(post.get('_author') === null);
		ok(post.get('_tags').isEqual(['0']));
	});

	test('When a record is loaded, its pending relationships are attached', function() {
		expect(4);

		var user3 = store.getRecord('user', '3');
		ok(user3.get('_posts').contains('7'));

		var queued = store.get('_queuedRelationships');
		var rid = null;
		EG.util.values(queued).forEach(function(r) {
			if (r.get('type2') === 'post' && r.get('object2') === '7') {
				rid = r.get('id');
			}
		});

		var post = store._loadRecord('post', { id: '7', author: '3', tags: [] });

		ok(queued[rid] === undefined);
		ok(user3.get('_posts').contains('7'));
		ok(post.get('_author') === '3');
	});

	test('A new record attaches to current records correctly', function() {
		expect(3);

		var user = store.getRecord('user', '1');
		var post = store.createRecord('post', { author: '1', tags: ['1', '2'] });

		ok(post.get('_author') === '1');
		ok(post.get('_tags').isEqual(['1', '2']));
		ok(user.get('_posts').contains(post.get('id')));
	});

	test('Removing from a hasMany saved to the server works', function() {
		expect(2);

		var post1 = store.getRecord('post', '1');
		ok(post1.get('_tags').isEqual(['1', '2', '3', '4']));

		post1.removeFromRelationship('tags', '2');
		ok(post1.get('_tags').isEqual(['1', '3', '4']));
	});

	test('Removing a non existent hasMany item has no effect', function() {
		expect(1);

		var user1 = store.getRecord('user', '1');
		var current = user1.get('_posts').toArray();

		user1.removeFromRelationship('posts', '298133');
		ok(user1.get('_posts').isEqual(current));
	});

	test('Disconnecting a hasOne saved to the server works', function() {
		expect(4);

		var user1 = store.getRecord('user', '1');
		var post1 = store.getRecord('post', '1');

		ok(user1.get('_posts').contains('1'));
		ok(post1.get('_author') === '1');

		post1.clearHasOneRelationship('author');

		ok(post1.get('_author') === null);
		ok(!user1.get('_posts').contains('1'));
	});

	test('Disconnecting a null hasOne has no effect', function() {
		expect(2);

		var post6 = store.getRecord('post', '6');
		ok(post6.get('_author') === null);
		post6.clearHasOneRelationship('author');
		ok(post6.get('_author') === null);
	});

	test('Changing a hasOne from one record to another works', function() {
		expect(6);

		var user1 = store.getRecord('user', '1');
		var user2 = store.getRecord('user', '2');
		var post1 = store.getRecord('post', '1');

		ok(user1.get('_posts').contains('1'));
		ok(!user2.get('_posts').contains('1'));
		ok(post1.get('_author') === '1');

		post1.setHasOneRelationship('author', '2');

		ok(!user1.get('_posts').contains('1'));
		ok(user2.get('_posts').contains('1'));
		ok(post1.get('_author') === '2');
	});

	test('Rolling back a record with no changes has no effect', function() {
		expect(2);

		var post1 = store.getRecord('post', '1');
		var author = post1.get('_author');
		var tags = post1.get('_tags').toArray();

		post1.rollbackRelationships();

		ok(post1.get('_author') === author);
		ok(post1.get('_tags').isEqual(tags));
	});

	test('Adding to a hasMany works properly', function() {
		expect(2);

		var post2 = store.getRecord('post', '2');
		ok(!post2.get('_tags').contains('1'));
		post2.addToRelationship('tags', '1');
		ok(post2.get('_tags').contains('1'));
	});

	test('Setting a hasOne works properly', function() {
		expect(4);

		var user1 = store.getRecord('user', '1');
		var post6 = store.getRecord('post', '6');

		ok(!user1.get('_posts').contains('6'));
		ok(post6.get('_author') === null);

		post6.setHasOneRelationship('author', '1');

		ok(user1.get('_posts').contains('6'));
		ok(post6.get('_author') === '1');
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

	test('Settings a hasOne dirties all three records (if applicable)', function() {
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
		var tags = post1.get('_tags').toArray();
		var author = post1.get('_author');

		ok(!post1.get('isDirty'));

		post1.clearHasOneRelationship('author');
		post1.removeFromRelationship('tags', '1');
		post1.addToRelationship('tags', '5');

		ok(post1.get('isDirty'));

		post1.rollbackRelationships();

		ok(!post1.get('isDirty'));
		ok(post1.get('_tags').isEqual(tags));
		ok(post1.get('_author') === author);
	});

	test('Changed attributes are detected correctly', function() {
		expect(4);

		var post = store.getRecord('post', '8');
		var author = post.get('_author');
		var tags = post.get('_tags').toArray();

		post.setHasOneRelationship('author', '1');
		post.addToRelationship('tags', '1');
		post.addToRelationship('tags', '2');
		post.removeFromRelationship('tags', '4');

		var changed = post.changedRelationships();

		ok(changed.author[0] === null);
		ok(changed.author[1] === '1');
		ok(new Em.Set(changed.tags[0]).isEqual(tags));
		ok(new Em.Set(changed.tags[1]).isEqual(['1', '2']));
	});

	test('Reloading a changed hasOne from the server works correctly (clean record)', function() {
		expect(2);

		var post = store.getRecord('post', '1');
		post._loadData({
			author: '50',
			tags: post.get('_tags').toArray()
		});

		ok(post.get('_author') === '50');
		var user = store.getRecord('user', '1');
		ok(!user.get('_posts').contains('1'));
	});

	test('Reloading a cleared hasOne from the server works correctly (clean record)', function() {
		expect(2);

		var post = store.getRecord('post', '1');
		post._loadData({
			author: null,
			tags: post.get('_tags').toArray()
		});

		ok(post.get('_author') === null);
		var user = store.getRecord('user', '1');
		ok(!user.get('_posts').contains('1'));
	});

	test('Reloading a changed hasMany from the server works correctly (clean record)', function() {
		expect(3);

		var user = store.getRecord('user', '1');
		user._loadData({
			posts: ['1', '50', '51']
		});

		var post1 = store.getRecord('post', '1');
		var post2 = store.getRecord('post', '2');

		ok(user.get('_posts').isEqual(['1', '50', '51']));
		ok(post1.get('_author') === '1');
		ok(post2.get('_author') === null);
	});

	test('Reloading a record with missing relationships loads the defaults correctly', function() {
		expect(3);

		var post = store.getRecord('post', '1');
		var user = store.getRecord('user', post.get('_author'));
		post._loadData({});

		ok(post.get('_author') === null);
		ok(!user.get('_posts').contains('1'));
		ok(post.get('_tags').isEqual(['0']));
	});

	test('Changing a record that isn\'t loaded yet will load changes on load' , function() {
		expect(4);

		var user = store.getRecord('user', '3');
		ok(user.get('_posts').contains('7'));
		user.removeFromRelationship('posts', '7');
		ok(!user.get('_posts').contains('7'));

		var post = store._loadRecord('post', { id: '7', author: '3', tags: [] });

		ok(post.get('_author') === null);
		post.rollbackRelationships();
		ok(post.get('_author') === '3');
	});

	test('A new permanent record loaded creates new server relationships', function() {
		expect(3);

		var post = store._loadRecord('post', { id: '50', author: '1' });
		ok(post.get('_author') === '1');
		var user = store.getRecord('user', '1');
		ok(user.get('_posts').contains('50'));
		user.rollbackRelationships();
		ok(user.get('_posts').contains('50'));
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

			var set1 = new Em.Set(posts);
			var set2 = new Em.Set([post1, post2]);

			ok(posts.length === 2);
			ok(set1.isEqual(set2));
		});
	});

	test('Client relationships can override server relationships', function() {
		expect(3);

		var post = store.getRecord('post', '1');
		ok(post.get('_author') === '1');

		var user = store.createRecord('user', { posts: ['1'] });
		ok(user.get('_posts').contains('1'));
		ok(post.get('_author') === user.get('id'));
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

		ok(user1.get('_posts').contains('1'));
		ok(!user2.get('_posts').contains('1'));
		ok(post.get('_author') === '1');

		user2.addToRelationship('posts', '1');

		ok(!user1.get('_posts').contains('1'));
		ok(user2.get('_posts').contains('1'));
		ok(post.get('_author') === '2');
	});

	test('A server side relationship on a non-loaded record can be overridden by a client side one', function() {
		expect(7);

		var user1 = store.getRecord('user', '1');
		var user3 = store.getRecord('user', '3');
		ok(!user1.get('_posts').contains('7'));
		ok(user3.get('_posts').contains('7'));
		user1.addToRelationship('posts', '7');
		ok(user1.get('_posts').contains('7'));
		ok(!user3.get('_posts').contains('7'));
		var post7 = store._loadRecord('post', { id: '7', author: '3', tags: ['1', '2'] });
		ok(user1.get('_posts').contains('7'));
		ok(!user3.get('_posts').contains('7'));
		ok(post7.get('_author') === '1');
	});

	test('Observers aren\'t fired until after the relationship operations are done', function() {
		expect(3);

		var post = store.getRecord('post', '1');
		strictEqual(post.get('_author'), '1');

		var observer = function(obj, prop) {
			if (Em.get(obj, prop) !== '2') {
				throw null;
			}
		};
		post.addObserver('_author', observer);

		post.setHasOneRelationship('author', '2');
		strictEqual(post.get('_author'), '2');
		post.removeObserver('_author', observer);

		observer = function(obj, prop) {
			if (Em.get(obj, prop) !== '1') {
				throw null;
			}
		};
		post.addObserver('_author', observer);
		post.rollbackRelationships();
		strictEqual(post.get('_author'), '1');
		post.removeObserver('_author', observer);
	});
})();