(function() {
	'use strict';

	var store;
	var adapter;
	var LOCAL_STORAGE_KEY = 'ember-graph.local_storage_test';

	module('LocalStorageAdapter Test', {
		setup: function() {
			delete localStorage[LOCAL_STORAGE_KEY];

			var DEMO_DATA = {
				user: [{
					id: '1',
					name: 'Ben Derisgreat',
					posts: [{ type: 'post', id: 1 }, 2]
				}, {
					id: '2',
					name: 'Rusty Shackleford',
					posts: [{ type: 'post', id: 3 }, { type: 'post', id: '4' }]
				}, {
					id: '4',
					name: 'Rando',
					favoritePost: 4
				}],

				post: [{
					id: 1,
					title: 'Post 1',
					author: { type: 'user', id: '1' }
				}, {
					id: 2,
					title: 'Post 2',
					author: { type: 'user', id: 1 }
				}, {
					id: 3,
					title: 'Post 3',
					author: { type: 'user', id: '2' }
				}, {
					id: 4,
					title: 'Post 4',
					author: 2
				}]
			};

			store = setupStore({
				user: EG.Model.extend({
					name: EG.attr({
						type: 'string'
					}),

					posts: EG.hasMany({
						relatedType: 'post',
						inverse: 'author',
						defaultValue: []
					}),

					favoritePost: EG.hasOne({
						relatedType: 'post',
						inverse: null,
						defaultValue: null
					})
				}),

				post: EG.Model.extend({
					title: EG.attr({
						type: 'string'
					}),

					author: EG.hasOne({
						relatedType: 'user',
						inverse: 'posts'
					})
				})
			}, {
				adapter: EG.LocalStorageAdapter.extend({
					localStorageKey: LOCAL_STORAGE_KEY,

					shouldInitializeDatabase: function() {
						return true;
					},

					getInitialPayload: function() {
						return DEMO_DATA;
					}
				})
			});

			adapter = store.adapterFor('application');
		}
	});

	test('Initializing a valid test payload works', function() {
		expect(1);

		var relationshipToString = function(r) {
			var one = r.t1 + ':' + r.i1 + ':' + r.n1;
			var two = r.t2 + ':' + r.i2 + ':' + r.n2;
			return (one < two ? one + '::' + two : two  + '::' + one);
		};

		var db = JSON.parse(localStorage[LOCAL_STORAGE_KEY]);
		db.relationships = db.relationships.map(relationshipToString);

		var expected = {
			records: {
				user: {
					'1': { name: 'Ben Derisgreat' },
					'2': { name: 'Rusty Shackleford' },
					'4': { name: 'Rando' }
				},
				post: {
					'1': { title: 'Post 1' },
					'2': { title: 'Post 2' },
					'3': { title: 'Post 3' },
					'4': { title: 'Post 4' }
				}
			},

			relationships: [
				{ t1: 'post', i1: '1', n1: 'author', t2: 'user', i2: '1', n2: 'posts' },
				{ t1: 'post', i1: '2', n1: 'author', t2: 'user', i2: '1', n2: 'posts' },
				{ t1: 'post', i1: '3', n1: 'author', t2: 'user', i2: '2', n2: 'posts' },
				{ t1: 'post', i1: '4', n1: 'author', t2: 'user', i2: '2', n2: 'posts' },
				{ t1: 'post', i1: '4', n1: null, t2: 'user', i2: '4', n2: 'favoritePost' }
			].map(relationshipToString)
		};

		deepEqual(db, expected);
	});

	test('Initializing an invalid test payload fails (missing record)', function() {
		expect(1);

		throws(function() {
			adapter.convertAndVerifyPayload({
				user: [{
					id: '1',
					name: '',
					posts: [
						{ type: 'post', id: 'wontexist' }
					]
				}]
			});
		});
	});

	test('Initializing an invalid test payload fails (missing required attribute)', function() {
		expect(1);

		throws(function() {
			adapter.convertAndVerifyPayload({
				user: [{
					id: '1',
					posts: [
						{ type: 'post', id: 'wontexist' }
					]
				}]
			});
		});
	});

	test('Initializing an invalid test payload fails (missing required attribute)', function() {
		expect(1);

		throws(function() {
			adapter.convertAndVerifyPayload({
				user: [{
					id: '1',
					posts: [
						{ type: 'post', id: 'wontexist' }
					]
				}]
			});
		});
	});


	test('Initializing an invalid test payload fails (too many hasOne relationships)', function() {
		expect(1);

		throws(function() {
			adapter.convertAndVerifyPayload({
				user: [{
					id: '1',
					name: '',
					posts: [
						{ type: 'post', id: '1' }
					]
				}, {
					id: '2',
					name: '',
					posts: [
						{ type: 'post', id: '1' }
					]
				}],
				post: [{
					id: '1',
					title: 'foo',
					author: { type: 'user', id: '1' }
				}]
			});
		});
	});

	asyncTest('Get an existing record', function() {
		expect(1);

		adapter.findRecord('user', '1').then(function(payload) {
			start();

			delete payload.meta;
			deepEqual(payload, {
				user: [{
					id: '1',
					name: 'Ben Derisgreat',
					favoritePost: null,
					posts: [
						{ type: 'post', id: '1' },
						{ type: 'post', id: '2' }
					]
				}]
			});
		}, function() {
			start();
		});
	});

	asyncTest('Get several existing records', function() {
		expect(1);

		adapter.findMany('post', ['1', '2', '4']).then(function(payload) {
			start();

			delete payload.meta;
			deepEqual(payload, {
				post: [{
					id: '1',
					title: 'Post 1',
					author: { type: 'user', id: '1' }
				}, {
					id: '2',
					title: 'Post 2',
					author: { type: 'user', id: '1' }
				}, {
					id: '4',
					title: 'Post 4',
					author: { type: 'user', id: '2' }
				}]
			});
		});
	});

	asyncTest('Get all records of a type', function() {
		expect(1);

		adapter.findAll('post').then(function(payload) {
			start();

			delete payload.meta;
			deepEqual(payload, {
				post: [{
					id: '1',
					title: 'Post 1',
					author: { type: 'user', id: '1' }
				}, {
					id: '2',
					title: 'Post 2',
					author: { type: 'user', id: '1' }
				}, {
					id: '3',
					title: 'Post 3',
					author: { type: 'user', id: '2' }
				}, {
					id: '4',
					title: 'Post 4',
					author: { type: 'user', id: '2' }
				}]
			});
		});
	});

	asyncTest('Get a non-existing record', function() {
		expect(1);

		adapter.findRecord('user', 'wontexist').catch(function(error) {
			start();
			strictEqual(error.status, 404);
		});
	});

	asyncTest('Get many records including a non-existing one', function() {
		expect(1);

		adapter.findMany('user', ['1', '2', '3', '4']).catch(function(error) {
			start();
			strictEqual(error.status, 404);
		});
	});

	asyncTest('Query records without query implemented', function() {
		expect(1);

		adapter.findQuery('user', {}).catch(function(error) {
			start();
			ok(error.toString().match(/findQuery/g));
		});
	});

	asyncTest('Create and save a new record 1', function() {
		expect(1);

		var id;
		var user = store.createRecord('user', {
			name: 'Professor Bald',
			posts: []
		});

		user.save().then(function(record) {
			id = record.get('id');
			return adapter.findRecord('user', id);
		}).then(function(payload) {
			start();

			delete payload.meta;
			deepEqual(payload, {
				user: [{
					id: id,
					name: 'Professor Bald',
					favoritePost: null,
					posts: []
				}]
			});
		});
	});

	asyncTest('Create and save a new record 2', function() {
		expect(1);

		var id;
		var post = store.createRecord('post', {
			author: '1',
			title: 'Test'
		});

		post.save().then(function(record) {
			id = record.get('id');
			return adapter.findRecord('post', id);
		}).then(function(payload) {
			start();

			delete payload.meta;
			deepEqual(payload, {
				post: [{
					id: id,
					title: 'Test',
					author: { type: 'user', id: '1' }
				}]
			});
		});
	});

	asyncTest('Create and save a new record 3', function() {
		expect(3);

		var id;
		var user = store.createRecord('user', {
			name: 'Sterling Archer',
			posts: ['2']
		});

		user.save().then(function(record) {
			id = record.get('id');
			return adapter.findRecord('user', id);
		}).then(function(payload) {
			start();

			delete payload.meta;
			deepEqual(payload, {
				user: [{
					id: id,
					name: 'Sterling Archer',
					favoritePost: null,
					posts: [{ type: 'post', id: '2' }]
				}]
			});

			stop();

			return adapter.findRecord('post', '2');
		}).then(function(payload) {
			start();
			strictEqual(payload.post[0].author.id, id);
			stop();

			return adapter.findRecord('user', '1');
		}).then(function(payload) {
			start();
			ok(payload.user[0].posts.mapBy('id').indexOf('2') < 0);
		});
	});

	asyncTest('Update an existing record', function() {
		expect(2);

		store.find('post', '4').then(function(post) {
			post.set('title', '4444');
			post.setHasOneRelationship('author', '4');
			return post.save();
		}).then(function() {
			return adapter.findRecord('post', '4');
		}).then(function(payload) {
			start();

			delete payload.meta;
			deepEqual(payload, {
				post: [{
					id: '4',
					title: '4444',
					author: { type: 'user', id: '4' }
				}]
			});

			stop();

			return adapter.findRecord('user', '4');
		}).then(function(payload) {
			start();

			delete payload.meta;
			deepEqual(payload, {
				user: [{
					id: '4',
					name: 'Rando',
					favoritePost: { type: 'post', id: '4' },
					posts: [
						{ type: 'post', id: '4' }
					]
				}]
			});
		});
	});

	asyncTest('Delete existing record', function() {
		expect(1);

		store.find('post', '4').then(function(post) {
			return post.destroy();
		}).then(function() {
			start();

			adapter.findRecord('post', '4').catch(function(error) {
				strictEqual(error.status, 404);
			});
		});
	});
})();