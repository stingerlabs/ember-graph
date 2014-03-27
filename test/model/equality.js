(function() {
	'use strict';

	var HAS_ONE_KEY = EG.Model.HAS_ONE_KEY;
	var HAS_MANY_KEY = EG.Model.HAS_MANY_KEY;

	var store;

	module('Model Equality Test', {
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

	test('The same model compares correctly', function() {
		expect(2);

		var user = store.getRecord('user', '1');

		ok(user.isEqual(user, user));
		ok(Em.isEqual(user, user));
	});

	test('A model compares to non-model object correctly', function() {
		expect(3);

		var user = store.getRecord('user', '1');

		ok(!user.isEqual());
		ok(!user.isEqual(null));
		ok(!user.isEqual(''));
	});

	test('The same record loaded twice compares equally', function() {
		expect(1);

		var user1 = store._loadRecord('user', { id: '555' });
		var user2 = store._loadRecord('user', { id: '555' });

		ok(user1.isEqual(user2));
	});

	asyncTest('A proxy is equal to the real record', function() {
		expect(3);

		var realUser = store.getRecord('user', '1');
		var proxyUser = EG.PromiseObject.create({ promise: Em.RSVP.resolve(realUser) });

		proxyUser.then(function() {
			start();

			ok(realUser.isEqual(proxyUser));
			ok(EG.Model.isEqual(realUser, proxyUser));
			ok(EG.Model.isEqual(proxyUser, realUser));
		});
	});

	test('Objects of different types with the same ID aren\'t equal', function() {
		expect(2);

		var user = store.getRecord('user', '1');
		var post = store.getRecord('post', '1');

		ok(!user.isEqual(post));
		ok(!post.isEqual(user));
	});
})();