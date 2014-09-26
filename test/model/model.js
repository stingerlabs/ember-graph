(function() {
	'use strict';

	var store;

	module('Model Test', {
		setup: function() {
			store = setupStore({
				user: EG.Model.extend({
					username: EG.attr({
						type: 'string',
						readOnly: true,
						defaultValue: function() {
							return 'admin';
						}
					}),

					posts: EG.hasMany({
						relatedType: 'post',
						inverse: 'author',
						defaultValue: []
					})
				}),

				post: EG.Model.extend({
					author: EG.hasOne({
						relatedType: 'user',
						inverse: 'posts',
						readOnly: true,
						defaultValue: null
					}),

					sharedWith: EG.hasMany({
						relatedType: 'user',
						inverse: null,
						readOnly: true,
						defaultValue: []
					})
				})
			});
		}
	});

	test('Can create a model with read-only attributes', function() {
		expect(1);

		var user = store.createRecord('user', {
			username: 'gjk'
		});

		strictEqual(user.get('username'), 'gjk');
	});

	test('Can create a model with read-only hasOne relationship', function() {
		expect(2);

		var post1 = store.createRecord('post', {
			author: '1'
		});

		deepEqual(post1.get('_author'), { type: 'user', id: '1' });

		var post2 = store.createRecord('post', {
			author: null
		});

		strictEqual(post2.get('_author'), null);
	});

	test('Can create a model with read-only hasMany relationship', function() {
		expect(1);

		var post = store.createRecord('post', {
			sharedWith: ['1', '2', '3']
		});

		deepEqual(post.get('_sharedWith').mapBy('id').sort(), ['1', '2', '3'].sort());
	});
})();