(function() {
	'use strict';

	var store, adapter;

	module('Local Storage Adapter', {
		setup: function() {
			localStorage.clear();

			EG.LocalStorageAdapter.reopen({
				fixtures: ['user']
			});

			var User = EG.Model.extend({
				name: EG.attr({ type: 'string' }),
				spam: EG.belongsTo({ relatedType: 'spam', inverse: null }),
				eggs: EG.hasMany({ relatedType: 'egg', inverse: null })
			});

			User.FIXTURES = [
				{ id: '1', name: 'Alice', spam: '1', eggs: ['2', '4'] },
				{ id: '2', name: 'Bob', spam: '8', eggs: ['1', '3'] },
				{ id: '3', name: 'Carol', spam: '9', eggs: ['1', '2', '3', '4'] }
			];

			store = setupStore({
				user: User,

				spam: EG.Model.extend(),
				egg: EG.Model.extend()
			}, {}, EG.Store.extend({ defaultAdapter: 'localStorage' }));

			adapter = store.get('adapter');
		},

		teardown: function() {
			EG.LocalStorageAdapter.reopen({
				fixtures: []
			});
		}
	});

	test('The store is setup properly', function() {
		expect(1);

		strictEqual(adapter.get('store'), store);
	});

	asyncTest('The fixture data is loaded properly', function() {
		expect(1);

		adapter.findAll('user').then(function(users) {
			start();
			strictEqual(users.user.length, 3);
		});
	});

	asyncTest('A single fixture record can be found', function() {
		expect(1);

		adapter.findRecord('user', '1').then(function(json) {
			start();

			deepEqual(json, {
				user: [{ id: '1', name: 'Alice', spam: '1', eggs: ['2', '4'] }]
			});
		});
	});

	asyncTest('Multiple fixture records can be found', function() {
		expect(1);

		adapter.findMany('user', ['1', '3']).then(function(json) {
			start();

			json.user = json.user.sortBy('id');

			deepEqual(json, {
				user: [
					{ id: '1', name: 'Alice', spam: '1', eggs: ['2', '4'] },
					{ id: '3', name: 'Carol', spam: '9', eggs: ['1', '2', '3', '4'] }
				]
			});
		});
	});

	asyncTest('All fixture records of a type can be found', function() {
		expect(1);

		adapter.findAll('user').then(function(json) {
			start();

			json.user = json.user.sortBy('id');

			deepEqual(json, {
				user: [
					{ id: '1', name: 'Alice', spam: '1', eggs: ['2', '4'] },
					{ id: '2', name: 'Bob', spam: '8', eggs: ['1', '3'] },
					{ id: '3', name: 'Carol', spam: '9', eggs: ['1', '2', '3', '4'] }
				]
			});
		});
	});

	asyncTest('Creating a new record then finding it works properly', function() {
		expect(3);

		var record = store.createRecord('user', { name: 'Dave', spam: '100', eggs: [] });

		adapter.createRecord(record).then(function() {
			start();

			ok(!record.get('isNew'));
			ok(!EG.Model.isTemporaryId(record.get('id')));

			stop();

			return adapter.findRecord('user', record.get('id'));
		}).then(function(json) {
			start();

			deepEqual(json, {
				user: [{ id: record.get('id'), name: 'Dave', spam: '100', eggs: [] }]
			});
		});
	});

	asyncTest('Updating a record works properly', function() {
		expect(1);

		store.find('user', '1').then(function(record) {
			record.clearBelongsTo('spam');
			record.removeFromRelationship('eggs', '2');
			record.removeFromRelationship('eggs', '4');

			return adapter.updateRecord(record);
		}).then(function() {
			return adapter.findRecord('user', '1');
		}).then(function(json) {
			start();

			deepEqual(json, {
				user: [{ id: '1', name: 'Alice', spam: null, eggs: [] }]
			});
		});
	});

	asyncTest('Deleting a record works properly', function() {
		expect(1);

		store.find('user', '2').then(function(record) {
			return adapter.deleteRecord(record);
		}).then(function() {
			return adapter.findRecord('user', '2');
		}).then(function(json) {
			start();

			deepEqual(json, { user: [] });
		});
	});

	test('Calling findQuery throws an exception', function() {
		expect(1);

		throws(function() {
			adapter.findQuery();
		});
	});
})();