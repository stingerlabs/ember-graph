(function() {
	'use strict';

	var store;

	module('Model Persistence Test', {
		setup: function() {
			store = Eg.Store.create();

			store.createModel('user', {
				email: Eg.attr({
					type: 'string',
					isRequired: true,
					readOnly: true
				}),

				posts: Eg.hasMany({
					relatedType: 'post',
					inverse: 'author',
					isRequired: true
				})
			});

			store.createModel('post', {
				title: Eg.attr({
					type: 'string',
					isRequired: true,
					readOnly: true
				}),

				body: Eg.attr({
					type: 'string',
					isRequired: false,
					defaultValue: ''
				}),

				author: Eg.belongsTo({
					relatedType: 'user',
					inverse: 'posts',
					isRequired: true
				}),

				tags: Eg.hasMany({
					relatedType: 'tag',
					inverse: null,
					isRequired: true
				})
			});

			store.createModel('tag', {
				name: Eg.attr({
					type: 'string',
					isRequired: true,
					readOnly: true
				})
			});

			store._loadRecord('user', { id: '1', email: 'test@test.com', posts: ['1', '2'] });

			store._loadRecord('post', { id: '1', title: 'Test Post 1', body: 'Body1', author: '1', tags: ['1', '2'] });
			store._loadRecord('post', { id: '2', title: 'Test Post 2', body: 'Body2', author: '1', tags: ['3', '4'] });

			store._loadRecord('tag', { id: '1', name: 'foo' });
			store._loadRecord('tag', { id: '2', name: 'bar' });
			store._loadRecord('tag', { id: '3', name: 'spam' });
			store._loadRecord('tag', { id: '4', name: 'eggs' });
		}
	});

	test('Adding a new link then saving the original record works correctly', function() {
		expect(0);
	});

	test('Adding a new link then saving the new record works correctly', function() {
		expect(0);
	});
})();