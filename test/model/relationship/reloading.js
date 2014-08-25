(function() {

	var store;

	module('Relationship Reload Test', {
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
				user: [
					{
						id: '1',
						posts: [
							{ type: 'post', id: '1' },
							{ type: 'post', id: '2' },
							{ type: 'post', id: '3' }
						]
					}
				],
				post: [
					{ id: '1', author: { type: 'user', id: '1' } },
					{ id: '2', author: { type: 'user', id: '1' } },
					{ id: '3', author: { type: 'user', id: '1' } }
				]
			});
		}
	});

	asyncTest('Underscore observer fires when new relationships are added', function() {
		expect(1);

		var model = store.getRecord('user', '1');
		model.get('_posts');

		model.addObserver('_posts', model, function() {
			start();
			ok(true);
		});

		store.pushPayload({
			user: [{
				id: '1',
				posts: [
					{ type: 'post', id: '1' },
					{ type: 'post', id: '2' },
					{ type: 'post', id: '3' },
					{ type: 'post', id: '4' }
				]
			}],
			post: [
				{ id: '4', author: { type: 'user', id: '1' } }
			]
		});
	});

	asyncTest('Relationship observer fires when new relationships are added', function() {
		expect(1);

		var model = store.getRecord('user', '1');
		model.get('posts');

		model.addObserver('posts', model, function() {
			start();
			ok(true);
		});

		store.pushPayload({
			user: [{
				id: '1',
				posts: [
					{ type: 'post', id: '1' },
					{ type: 'post', id: '2' },
					{ type: 'post', id: '3' },
					{ type: 'post', id: '4' }
				]
			}],
			post: [
				{ id: '4', author: { type: 'user', id: '1' } }
			]
		});
	});
})();