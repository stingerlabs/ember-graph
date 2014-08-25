(function() {
	'use strict';

	var store;

	module('Model State Test', {
		setup: function() {
			store = setupStore({
				tag: EG.Model.extend({
					name: EG.attr({
						type: 'string',
						defaultValue: '(none)'
					})
				})
			}, {
				adapter: EG.Adapter.extend({
					findRecord: function() {
						return Em.RSVP.Promise.resolve({});
					},

					createRecord: function(record) {
						var id = EG.generateUUID();

						return Em.RSVP.Promise.resolve({
							meta: {
								createdRecord: {
									type: record.get('typeKey'),
									id: id
								}
							},
							tag: [{
								id: id, name: record.get('name')
							}]
						});
					},

					updateRecord: function(record) {
						return Em.RSVP.Promise.resolve({
							tag: [{
								id: record.get('id'),
								name: record.get('name')
							}]
						});
					},

					deleteRecord: function(record) {
						return Em.RSVP.Promise.resolve({});
					}
				})
			});

			store.pushPayload({
				tag: [
					{ id: '1', name: 'c++' },
					{ id: '2', name: 'pizza' },
					{ id: '3', name: 'ember' },
					{ id: '4', name: 'rubik\'s cube' }
				]
			});
		}
	});

	asyncTest('Creating a record', function() {
		expect(27);

		var tag = store.createRecord('tag');

		start();
		strictEqual(tag.get('isDeleting'), false);
		strictEqual(tag.get('isDeleted'), false);
		strictEqual(tag.get('isSaving'), false);
		strictEqual(tag.get('isReloading'), false);
		strictEqual(tag.get('isLoaded'), true);
		strictEqual(tag.get('isDirty'), true);
		strictEqual(tag.get('isCreating'), false);
		strictEqual(tag.get('isNew'), true);
		strictEqual(tag.get('isInTransit'), false);

		tag.save().then(function() {
			start();
			strictEqual(tag.get('isDeleting'), false);
			strictEqual(tag.get('isDeleted'), false);
			strictEqual(tag.get('isSaving'), false);
			strictEqual(tag.get('isReloading'), false);
			strictEqual(tag.get('isLoaded'), true);
			strictEqual(tag.get('isDirty'), false);
			strictEqual(tag.get('isCreating'), false);
			strictEqual(tag.get('isNew'), false);
			strictEqual(tag.get('isInTransit'), false);

		});

		strictEqual(tag.get('isDeleting'), false);
		strictEqual(tag.get('isDeleted'), false);
		strictEqual(tag.get('isSaving'), false);
		strictEqual(tag.get('isReloading'), false);
		strictEqual(tag.get('isLoaded'), true);
		strictEqual(tag.get('isDirty'), true);
		strictEqual(tag.get('isCreating'), true);
		strictEqual(tag.get('isNew'), true);
		strictEqual(tag.get('isInTransit'), true);
		stop();
	});

	asyncTest('Saving a record', function() {
		expect(28);

		var tag = store.getRecord('tag', '1');

		start();
		strictEqual(tag.get('isDeleting'), false);
		strictEqual(tag.get('isDeleted'), false);
		strictEqual(tag.get('isSaving'), false);
		strictEqual(tag.get('isReloading'), false);
		strictEqual(tag.get('isLoaded'), true);
		strictEqual(tag.get('isDirty'), false);
		strictEqual(tag.get('isCreating'), false);
		strictEqual(tag.get('isNew'), false);
		strictEqual(tag.get('isInTransit'), false);

		tag.set('name', 'foobar');

		strictEqual(tag.get('isDirty'), true);

		tag.save().then(function() {
			start();
			strictEqual(tag.get('isDeleting'), false);
			strictEqual(tag.get('isDeleted'), false);
			strictEqual(tag.get('isSaving'), false);
			strictEqual(tag.get('isReloading'), false);
			strictEqual(tag.get('isLoaded'), true);
			strictEqual(tag.get('isDirty'), false);
			strictEqual(tag.get('isCreating'), false);
			strictEqual(tag.get('isNew'), false);
			strictEqual(tag.get('isInTransit'), false);

		});

		strictEqual(tag.get('isDeleting'), false);
		strictEqual(tag.get('isDeleted'), false);
		strictEqual(tag.get('isSaving'), true);
		strictEqual(tag.get('isReloading'), false);
		strictEqual(tag.get('isLoaded'), true);
		strictEqual(tag.get('isDirty'), true);
		strictEqual(tag.get('isCreating'), false);
		strictEqual(tag.get('isNew'), false);
		strictEqual(tag.get('isInTransit'), true);
		stop();
	});

	asyncTest('Reloading a record', function() {
		expect(27);

		var tag = store.getRecord('tag', '1');

		start();
		strictEqual(tag.get('isDeleting'), false);
		strictEqual(tag.get('isDeleted'), false);
		strictEqual(tag.get('isSaving'), false);
		strictEqual(tag.get('isReloading'), false);
		strictEqual(tag.get('isLoaded'), true);
		strictEqual(tag.get('isDirty'), false);
		strictEqual(tag.get('isCreating'), false);
		strictEqual(tag.get('isNew'), false);
		strictEqual(tag.get('isInTransit'), false);

		tag.reload().then(function() {
			start();
			strictEqual(tag.get('isDeleting'), false);
			strictEqual(tag.get('isDeleted'), false);
			strictEqual(tag.get('isSaving'), false);
			strictEqual(tag.get('isReloading'), false);
			strictEqual(tag.get('isLoaded'), true);
			strictEqual(tag.get('isDirty'), false);
			strictEqual(tag.get('isCreating'), false);
			strictEqual(tag.get('isNew'), false);
			strictEqual(tag.get('isInTransit'), false);

		});

		strictEqual(tag.get('isDeleting'), false);
		strictEqual(tag.get('isDeleted'), false);
		strictEqual(tag.get('isSaving'), false);
		strictEqual(tag.get('isReloading'), true);
		strictEqual(tag.get('isLoaded'), true);
		strictEqual(tag.get('isDirty'), false);
		strictEqual(tag.get('isCreating'), false);
		strictEqual(tag.get('isNew'), false);
		strictEqual(tag.get('isInTransit'), true);
		stop();
	});

	asyncTest('Deleting a record', function() {
		expect(27);

		var tag = store.getRecord('tag', '1');

		start();
		strictEqual(tag.get('isDeleting'), false);
		strictEqual(tag.get('isDeleted'), false);
		strictEqual(tag.get('isSaving'), false);
		strictEqual(tag.get('isReloading'), false);
		strictEqual(tag.get('isLoaded'), true);
		strictEqual(tag.get('isDirty'), false);
		strictEqual(tag.get('isCreating'), false);
		strictEqual(tag.get('isNew'), false);
		strictEqual(tag.get('isInTransit'), false);

		tag.destroy().then(function() {
			start();
			strictEqual(tag.get('isDeleting'), false);
			strictEqual(tag.get('isDeleted'), true);
			strictEqual(tag.get('isSaving'), false);
			strictEqual(tag.get('isReloading'), false);
			strictEqual(tag.get('isLoaded'), false);
			strictEqual(tag.get('isDirty'), false);
			strictEqual(tag.get('isCreating'), false);
			strictEqual(tag.get('isNew'), false);
			strictEqual(tag.get('isInTransit'), false);

		});

		strictEqual(tag.get('isDeleting'), true);
		strictEqual(tag.get('isDeleted'), false);
		strictEqual(tag.get('isSaving'), false);
		strictEqual(tag.get('isReloading'), false);
		strictEqual(tag.get('isLoaded'), true);
		strictEqual(tag.get('isDirty'), false);
		strictEqual(tag.get('isCreating'), false);
		strictEqual(tag.get('isNew'), false);
		strictEqual(tag.get('isInTransit'), true);
		stop();
	});

	test('Resetting changes', function() {
		expect(3);

		var tag = store.getRecord('tag', '1');

		strictEqual(tag.get('isDirty'), false);
		tag.set('name', 'foobar');
		strictEqual(tag.get('isDirty'), true);
		tag.rollbackAttributes();
		strictEqual(tag.get('isDirty'), false);
	});
})();

