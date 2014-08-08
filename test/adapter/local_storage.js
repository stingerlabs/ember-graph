(function() {
	'use strict';

	var store, adapter;

	module('LocalStorageAdapter Test', {
		setup: function() {
			store = setupStore({
				user: EG.Model.extend({
					name: EG.attr({
						type: 'string'
					}),

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
				adapter: EG.LocalStorageAdapter
			});

			adapter = store.adapterFor('application');
		}
	});

	asyncTest('Create and save a new record', function() {
		expect(1);

		var id;
		var user = store.createRecord('user', {
			name: 'Ben Derisgreat',
			posts: []
		});

		user.save().then(function(record) {
			id = record.get('id');
			return adapter.findRecord('user', record.get('id'));
		}).then(function(payload) {
			start();

			deepEqual(payload, {
				users: [{
					id: id,
					name: 'Ben Derisgreat',
					links: {
						posts: []
					}
				}]
			});
		});
	});
})();