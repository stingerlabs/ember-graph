(function() {
	'use strict';

	var store, records;
	var Promise = Em.RSVP.Promise;

	module('Store Unload Test', {
		setup: function() {
			store = setupStore({
				user: EG.Model.extend({
					email: EG.attr({
						type: 'string',
						isRequired: true,
						readOnly: true
					}),

					posts: EG.hasMany({
						relatedType: 'post',
						inverse: 'author',
						isRequired: true
					})
				}),

				post: EG.Model.extend({
					title: EG.attr({
						type: 'string',
						isRequired: true,
						readOnly: true
					}),

					body: EG.attr({
						type: 'string',
						isRequired: false,
						defaultValue: ''
					}),

					author: EG.hasOne({
						relatedType: 'user',
						inverse: 'posts',
						isRequired: true
					}),

					tags: EG.hasMany({
						relatedType: 'tag',
						inverse: null,
						isRequired: false
					})
				}),

				tag: EG.Model.extend({
					name: EG.attr({
						type: 'string',
						isRequired: true,
						readOnly: true
					})
				}),

				item: EG.Model.extend({
					name: EG.attr({
						type: 'string'
					})
				})
			}, {
				adapter: EG.Adapter.extend({
					updateRecord: function(record) {
						return Em.RSVP.Promise.resolve();
					}
				})
			});
		}
	});

	test('Unload record with no relationships', function() {
		expect(3);

		store.pushPayload({
			item: [{ id: '1', name: 'First' }]
		});

		var record = store.getRecord('item', '1');

		strictEqual(record.get('id'), '1');
		strictEqual(record.get('name'), 'First');

		store.unloadRecord(record);

		strictEqual(store.getRecord('item', '1'), null);
	});

	test('Unload record with relationships', function() {
		expect(6);

		store.pushPayload({
			user: [{
				id: '1',
				email: 'test@test.com',
				posts: [
					{ type: 'post', id: '1' },
					{ type: 'post', id: '2' }
				]
			}],
			post: [
				{ id: '1', title: 'One', author: { type: 'user', id: '1' } },
				{ id: '2', title: 'Two', author: { type: 'user', id: '1' } }
			]
		});

		var user = store.getRecord('user', '1');
		var post1 = store.getRecord('post', '1');
		var post2 = store.getRecord('post', '2');

		deepEqual(user.get('_posts').mapBy('id').sort(), ['1', '2'].sort());
		deepEqual(post1.get('_author'), { type: 'user', id: '1' });
		deepEqual(post2.get('_author'), { type: 'user', id: '1' });

		store.unloadRecord(user);
		strictEqual(store.getRecord('user', '1'), null);
		deepEqual(post1.get('_author'), { type: 'user', id: '1' });
		deepEqual(post2.get('_author'), { type: 'user', id: '1' });
	});

	test('Unloading dirty record throws error', function() {
		expect(1);

		store.pushPayload({
			item: [{ id: '1', name: 'First' }]
		});

		var item = store.getRecord('item', '1');
		item.set('name', '');

		throws(function() {
			store.unloadRecord(item);
		});
	});

	test('Unload dirty record by telling store to clear changes', function() {
		expect(1);

		store.pushPayload({
			item: [{ id: '1', name: 'First' }]
		});

		var item = store.getRecord('item', '1');
		item.set('name', '');
		store.unloadRecord(item, true);

		strictEqual(store.getRecord('item', '1'), null);
	});
})();
