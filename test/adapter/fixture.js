(function() {
	'use strict';

	var store, adapter;

	module('Fixture Adapter', {
		setup: function() {
			var User = EG.Model.extend({
				name: EG.attr({ type: 'string' }),
				missing: EG.attr({ type: 'string', defaultValue: 'foobar' }),
				spam: EG.hasOne({ relatedType: 'spam', inverse: null }),
				eggs: EG.hasMany({ relatedType: 'egg', inverse: null }),
				none: EG.hasOne({ relatedType: 'egg', inverse: null, defaultValue: '5' })
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
			}, {}, EG.Store.extend({ defaultAdapter: 'fixture' }));

			adapter = store.get('adapter');
		}
	});

	test('The store is setup properly', function() {
		expect(1);

		strictEqual(adapter.get('store'), store);
	});

	asyncTest('A single record can be found', function() {
		expect(1);

		adapter.findRecord('user', '1').then(function(json) {
			start();

			deepEqual(json, {
				meta: {},
				user: [{ id: '1', missing: 'foobar', name: 'Alice', spam: '1', eggs: ['2', '4'], none: '5' }]
			});
		});
	});

	asyncTest('Fixture data has default values correctly loaded', function() {
		expect(2);

		adapter.findRecord('user', '1').then(function(json) {
			start();

			deepEqual(json.user[0].missing, 'foobar');
			deepEqual(json.user[0].none, '5');
		});
	});

	asyncTest('Multiple records can be found', function() {
		expect(1);

		adapter.findMany('user', ['1', '3']).then(function(json) {
			start();

			json.user = json.user.sortBy('id');

			deepEqual(json, {
				meta: {},
				user: [
					{ id: '1', missing: 'foobar', name: 'Alice', spam: '1', eggs: ['2', '4'], none: '5' },
					{ id: '3', missing: 'foobar', name: 'Carol', spam: '9', eggs: ['1', '2', '3', '4'], none: '5' }
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
				meta: {},
				user: [
					{ id: '1', missing: 'foobar', name: 'Alice', spam: '1', eggs: ['2', '4'], none: '5' },
					{ id: '2', missing: 'foobar', name: 'Bob', spam: '8', eggs: ['1', '3'], none: '5' },
					{ id: '3', missing: 'foobar', name: 'Carol', spam: '9', eggs: ['1', '2', '3', '4'], none: '5' }
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
				meta: {},
				user: [{ id: record.get('id'), missing: 'foobar', name: 'Dave', spam: '100', eggs: [], none: '5' }]
			});
		});
	});

	asyncTest('Updating a record works properly', function() {
		expect(1);

		store.find('user', '1').then(function(record) {
			record.clearHasOneRelationship('spam');
			record.removeFromRelationship('eggs', '2');
			record.removeFromRelationship('eggs', '4');

			return adapter.updateRecord(record);
		}).then(function() {
			return adapter.findRecord('user', '1');
		}).then(function(json) {
			start();

			deepEqual(json, {
				meta: {},
				user: [{ id: '1', missing: 'foobar', name: 'Alice', spam: null, eggs: [], none: '5' }]
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

			deepEqual(json, {  meta: {}, user: [] });
		});
	});

	test('Calling findQuery throws an exception', function() {
		expect(1);

		throws(function() {
			adapter.findQuery();
		});
	});
})();