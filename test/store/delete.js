(function() {
	'use strict';

	var HAS_ONE_KEY = EG.Model.HAS_ONE_KEY;
	var HAS_MANY_KEY = EG.Model.HAS_MANY_KEY;

	var store;

	module('Store Delete Test', {
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
						defaultValue: function() {
							return ['0'];
						}
					})
				}),

				tag: EG.Model.extend()
			}, {
				adapter: EG.Adapter.extend({
					deleteRecord: function(record) {
						return Em.RSVP.Promise.resolve({});
					}
				})
			});

			store.pushPayload({
				user: [{
					id: '1',
					posts: [
						{ type: 'post', id: '1' },
						{ type: 'post', id: '2' },
						{ type: 'post', id: '3' }
					]
				}],
				post: [
					{ id: '1', author: { type: 'user', id: '1' }, tags: [] },
					{ id: '2', author: { type: 'user', id: '1' }, tags: [] },
					{ id: '3', author: { type: 'user', id: '1' }, tags: [] }
				]
			});
		}
	});

	asyncTest('Relationships are properly disconnected on delete', function() {
		expect(6);

		var post1 = store.getRecord('post', '1');
		var post2 = store.getRecord('post', '2');
		var post3 = store.getRecord('post', '3');

		start();
		deepEqual(post1.get('_author'), { type: 'user', id: '1' });
		deepEqual(post2.get('_author'), { type: 'user', id: '1' });
		deepEqual(post3.get('_author'), { type: 'user', id: '1' });
		stop();

		store.getRecord('user', '1').destroy().then(function() {
			start();

			strictEqual(post1.get('_author'), null);
			strictEqual(post2.get('_author'), null);
			strictEqual(post3.get('_author'), null);
		});
	});

	asyncTest('Delete new record', function() {
		expect(3);

		var user = store.getRecord('user', '1');
		var post = store.createRecord('post', {
			author: '1'
		});
		var id = post.get('id');

		start();
		ok(user.get('_posts').toArray().mapBy('id').indexOf(id) >= 0);
		stop();

		post.destroy().then(function() {
			start();

			strictEqual(post.get('store'), null);
			ok(user.get('_posts').toArray().indexOf(id) < 0);
		});
	});

	test('Delete records with `deletedRecords` meta attribute', function() {
		expect(2);

		var user = store.getRecord('user', '1');
		deepEqual(user.get('_posts').mapBy('id').sort(), ['1', '2', '3'].sort());

		store.pushPayload({
			meta: {
				deletedRecords: [
					{ type: 'post', id: '1' },
					{ type: 'post', id: '2' },
					{ type: 'post', id: '3' }
				]
			}
		});

		deepEqual(user.get('_posts'), []);
	});
})();