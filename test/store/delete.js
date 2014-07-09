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
						defaultValue: ['0']
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

			store._loadRecord('user', { id: '1', posts: ['1', '2', '3'] });

			store._loadRecord('post', { id: '1', author: '1', tags: [] });
			store._loadRecord('post', { id: '2', author: '1', tags: [] });
			store._loadRecord('post', { id: '3', author: '1', tags: [] });
		}
	});

	asyncTest('Relationships are properly disconnected on delete', function() {
		expect(6);

		var post1 = store.getRecord('post', '1');
		var post2 = store.getRecord('post', '2');
		var post3 = store.getRecord('post', '3');

		start();
		strictEqual(post1.get('_author'), '1');
		strictEqual(post2.get('_author'), '1');
		strictEqual(post3.get('_author'), '1');
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
		ok(user.get('_posts').toArray().indexOf(id) >= 0);
		stop();

		post.destroy().then(function() {
			start();

			strictEqual(post.get('store'), null);
			ok(user.get('_posts').toArray().indexOf(id) < 0);
		});
	});
})();