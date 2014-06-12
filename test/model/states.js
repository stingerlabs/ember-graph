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
						return Em.RSVP.Promise.resolve({
							meta: {
								newId: EG.generateUUID()
							}
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

			store._loadRecord('tag', { id: '1', name: 'c++' });
			store._loadRecord('tag', { id: '2', name: 'pizza' });
			store._loadRecord('tag', { id: '3', name: 'ember' });
			store._loadRecord('tag', { id: '4', name: 'rubik\'s cube' });
		}
	});

	asyncTest('Creating a record', function() {
		expect(27);

		var tag = store.createRecord('tag');

		start();
		ok(!tag.get('isDeleting'));
		ok(!tag.get('isDeleted'));
		ok(!tag.get('isSaving'));
		ok(!tag.get('isReloading'));
		ok(tag.get('isLoaded'));
		ok(!tag.get('isDirty'));
		ok(!tag.get('isCreating'));
		ok(tag.get('isNew'));
		ok(!tag.get('isInTransit'));

		tag.save().then(function() {
			start();
			ok(!tag.get('isDeleting'));
			ok(!tag.get('isDeleted'));
			ok(!tag.get('isSaving'));
			ok(!tag.get('isReloading'));
			ok(tag.get('isLoaded'));
			ok(!tag.get('isDirty'));
			ok(!tag.get('isCreating'));
			ok(!tag.get('isNew'));
			ok(!tag.get('isInTransit'));

		});

		ok(!tag.get('isDeleting'));
		ok(!tag.get('isDeleted'));
		ok(!tag.get('isSaving'));
		ok(!tag.get('isReloading'));
		ok(tag.get('isLoaded'));
		ok(!tag.get('isDirty'));
		ok(tag.get('isCreating'));
		ok(tag.get('isNew'));
		ok(tag.get('isInTransit'));
		stop();
	});

	asyncTest('Saving a record', function() {
		expect(28);

		var tag = store.getRecord('tag', '1');

		start();
		ok(!tag.get('isDeleting'));
		ok(!tag.get('isDeleted'));
		ok(!tag.get('isSaving'));
		ok(!tag.get('isReloading'));
		ok(tag.get('isLoaded'));
		ok(!tag.get('isDirty'));
		ok(!tag.get('isCreating'));
		ok(!tag.get('isNew'));
		ok(!tag.get('isInTransit'));

		tag.set('name', 'foobar');

		ok(tag.get('isDirty'));

		tag.save().then(function() {
			start();
			ok(!tag.get('isDeleting'));
			ok(!tag.get('isDeleted'));
			ok(!tag.get('isSaving'));
			ok(!tag.get('isReloading'));
			ok(tag.get('isLoaded'));
			ok(!tag.get('isDirty'));
			ok(!tag.get('isCreating'));
			ok(!tag.get('isNew'));
			ok(!tag.get('isInTransit'));

		});

		ok(!tag.get('isDeleting'));
		ok(!tag.get('isDeleted'));
		ok(tag.get('isSaving'));
		ok(!tag.get('isReloading'));
		ok(tag.get('isLoaded'));
		ok(tag.get('isDirty'));
		ok(!tag.get('isCreating'));
		ok(!tag.get('isNew'));
		ok(tag.get('isInTransit'));
		stop();
	});

	asyncTest('Reloading a record', function() {
		expect(27);

		var tag = store.getRecord('tag', '1');

		start();
		ok(!tag.get('isDeleting'));
		ok(!tag.get('isDeleted'));
		ok(!tag.get('isSaving'));
		ok(!tag.get('isReloading'));
		ok(tag.get('isLoaded'));
		ok(!tag.get('isDirty'));
		ok(!tag.get('isCreating'));
		ok(!tag.get('isNew'));
		ok(!tag.get('isInTransit'));

		tag.reload().then(function() {
			start();
			ok(!tag.get('isDeleting'));
			ok(!tag.get('isDeleted'));
			ok(!tag.get('isSaving'));
			ok(!tag.get('isReloading'));
			ok(tag.get('isLoaded'));
			ok(!tag.get('isDirty'));
			ok(!tag.get('isCreating'));
			ok(!tag.get('isNew'));
			ok(!tag.get('isInTransit'));

		});

		ok(!tag.get('isDeleting'));
		ok(!tag.get('isDeleted'));
		ok(!tag.get('isSaving'));
		ok(tag.get('isReloading'));
		ok(tag.get('isLoaded'));
		ok(!tag.get('isDirty'));
		ok(!tag.get('isCreating'));
		ok(!tag.get('isNew'));
		ok(tag.get('isInTransit'));
		stop();
	});

	asyncTest('Deleting a record', function() {
		expect(27);

		var tag = store.getRecord('tag', '1');

		start();
		ok(!tag.get('isDeleting'));
		ok(!tag.get('isDeleted'));
		ok(!tag.get('isSaving'));
		ok(!tag.get('isReloading'));
		ok(tag.get('isLoaded'));
		ok(!tag.get('isDirty'));
		ok(!tag.get('isCreating'));
		ok(!tag.get('isNew'));
		ok(!tag.get('isInTransit'));

		tag.destroy().then(function() {
			start();
			ok(!tag.get('isDeleting'));
			ok(tag.get('isDeleted'));
			ok(!tag.get('isSaving'));
			ok(!tag.get('isReloading'));
			ok(!tag.get('isLoaded'));
			ok(!tag.get('isDirty'));
			ok(!tag.get('isCreating'));
			ok(!tag.get('isNew'));
			ok(!tag.get('isInTransit'));

		});

		ok(tag.get('isDeleting'));
		ok(!tag.get('isDeleted'));
		ok(!tag.get('isSaving'));
		ok(!tag.get('isReloading'));
		ok(tag.get('isLoaded'));
		ok(!tag.get('isDirty'));
		ok(!tag.get('isCreating'));
		ok(!tag.get('isNew'));
		ok(tag.get('isInTransit'));
		stop();
	});

	test('Resetting changes', function() {
		expect(3);

		var tag = store.getRecord('tag', '1');

		ok(!tag.get('isDirty'));
		tag.set('name', 'foobar');
		ok(tag.get('isDirty'));
		tag.rollbackAttributes();
		ok(!tag.get('isDirty'));
	});
})();

