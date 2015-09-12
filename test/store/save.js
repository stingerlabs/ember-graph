(function() {
	'use strict';

	var store;
	var Promise = Em.RSVP.Promise;

	module('Store Test', {
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
						isRequired: true
					})
				}),

				tag: EG.Model.extend({
					name: EG.attr({
						type: 'string',
						isRequired: true,
						readOnly: true
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

	asyncTest('Can create record without `createdRecord` meta attribute', function() {
		expect(5);

		var tag = store.createRecord('tag', { name: 'tag1' });

		start();
		strictEqual(tag.get('name'), 'tag1');
		strictEqual(tag.get('isNew'), true);
		stop();

		store.adapterFor('application').createRecord = function() {
			return Promise.resolve({ tag: [{ id: '100', name: 'tag1' }] });
		};

		tag.save().then(function() {
			start();
			strictEqual(tag.get('id'), '100');
			strictEqual(tag.get('name'), 'tag1');
			strictEqual(tag.get('isNew'), false);
		});
	});

	asyncTest('Excluding `createdRecord` throws when more than one record of a type is included', function() {
		expect(1);

		store.adapterFor('application').createRecord = function() {
			return Promise.resolve({ tag: [{}, {}, {}] });
		};

		store.createRecord('tag', { name: '' }).save().catch(function(error) {
			start();
			ok(error.message.indexOf('`createdRecord`') >= 0);
		});
	});

	asyncTest('Saving without returning a payload updates the record', function() {
		expect(10);

		store.pushPayload({
			user: [{
				id: '1',
				email: 'test@test',
				posts: []
			}],
			post: [{
				id: '1',
				title: '',
				body: '',
				author: null,
				tags: []
			}],
			tag: [{
				id: '1',
				name: 'tag1'
			}]
		});

		var post = store.getRecord('post', '1');
		post.set('body', 'Test Body');
		post.setHasOneRelationship('author', '1');
		post.addToRelationship('tags', '1');

		start();
		strictEqual(post.get('title'), '');
		strictEqual(post.get('body'), 'Test Body');
		deepEqual(post.get('_author'), { type: 'user', id: '1' });
		deepEqual(post.get('_tags'), [{ type: 'tag', id: '1' }]);
		strictEqual(post.get('isDirty'), true);
		stop();

		post.save().then(function() {
			start();

			strictEqual(post.get('title'), '');
			strictEqual(post.get('body'), 'Test Body');
			deepEqual(post.get('_author'), { type: 'user', id: '1' });
			deepEqual(post.get('_tags'), [{ type: 'tag', id: '1' }]);
			strictEqual(post.get('isDirty'), false);
		});
	});
})();
