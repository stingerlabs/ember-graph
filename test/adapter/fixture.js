(function() {
	'use strict';

	var store, adapter;

	module('Fixture Adapter', {
		setup: function() {
			store = setupStore({ adapter: EG.FixtureAdapter }, {
				user: EG.Model.extend({
					name: EG.attr({ type: 'string' }),
					spam: EG.belongsTo({ relatedType: 'spam', inverse: null }),
					eggs: EG.hasMany({ relatedType: 'egg', inverse: null })
				}),

				spam: EG.Model.extend(),
				egg: EG.Model.extend()
			});

			adapter = store.get('_adapter');

			adapter.registerFixtures('user', [
				{ id: '1', name: 'Alice', spam: '1', eggs: ['2', '4'] },
				{ id: '2', name: 'Bob', spam: '8', eggs: ['1', '3'] },
				{ id: '3', name: 'Carol', spam: '9', eggs: ['1', '2', '3', '4'] }
			]);
		}
	});

	asyncTest('A single record can be found', function() {
		expect(1);

		adapter.findRecord('user', '1').then(function(json) {
			start();

			deepEqual(json, {
				user: [{ id: '1', name: 'Alice', spam: '1', eggs: ['2', '4'] }]
			});
		});
	});

	asyncTest('Multiple records can be found', function() {
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

	asyncTest('All records of a type can be found', function() {
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

	asyncTest('Creating a new record works properly', function() {
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