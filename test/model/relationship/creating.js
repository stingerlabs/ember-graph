(function() {
	'use strict';

	var store;

	module('Model Creation Relationship Test', {
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
			}, {
				adapter: EG.Adapter.extend({
					createRecord: function(record) {
						return Em.RSVP.resolve({
							meta: {
								createdRecord: {
									type: record.get('typeKey'),
									id: 'NEW_POST_ID'
								}
							},
							post: [{
								id: 'NEW_POST_ID',
								author: { type: 'user', id: '1' }
							}]
						});
					}
				})
			});

			store.pushPayload({
				user: [{
					id: '1',
					posts: []
				}]
			});
		}
	});

	test('Saving a new record updates the relationships with the new ID', function() {
		expect(1);

		var post = store.createRecord('post', { author: '1' });
		var tempId = post.get('id');

		var all = store.get('allRelationships');
		Em.keys(all).forEach(function(id) {
			if (all[id].get('id1') === tempId || all[id].get('id2') === tempId) {
				ok(true);
			}
		});

		post.save().then(function() {
			var all = store.get('allRelationships');

			Em.keys(all).forEach(function(id) {
				if (all[id].get('id1') === tempId || all[id].get('id2') === tempId) {
					ok(false);
				}
			});
		});
	});
})();