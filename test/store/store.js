(function() {
	'use strict';

	var typeKey = 'storeTest';

	var store;
	var records;

	var Adapter = Eg.Adapter.extend({

		createRecord: function(record) {
			record.set('id', Eg.util.generateGUID());
			return Em.RSVP.Promise.resolve(record);
		},

		findRecord: function(type, id) {
			return Em.RSVP.Promise.resolve(records[id]);
		},

		findMany: function(type, ids) {
			return Em.RSVP.Promise.resolve(ids.map(function(id) {
				return records[id];
			}));
		},

		findAll: function(type, ids) {
			return this.findMany(type, ['1', '2', '3', '4']);
		},

		updateRecord: function(record) {
			return Em.RSVP.Promise.resolve(record);
		},

		deleteRecord: function(record) {
			return Em.RSVP.Promise.resolve();
		}
	});

	module('Store Test', {
		setup: function() {
			store = Eg.Store.create({
				adapter: Adapter,
				cacheTimeout: 60*1000
			});

			store.createModel('storeTest', {});

			records = {
				'1': store.createRecord(typeKey, { id: '1' }),
				'2': store.createRecord(typeKey, { id: '2' }),
				'3': store.createRecord(typeKey, { id: '3' }),
				'4': store.createRecord(typeKey, { id: '4' })
			};
		}
	});

	test('The store initializes the adapter properly', function() {
		expect(1);

		ok(store.get('adapter') instanceof Adapter);
	});

	test('The store can load records properly', function() {
		expect(6);

		ok(records[1].get('store') === store);
		ok(records[2].get('store') === store);
		ok(records[4].get('store') === store);

		ok(store.hasRecord(typeKey, '1') === true);
		ok(store.hasRecord(typeKey, '2') === true);
		ok(store.hasRecord(typeKey, '4') === true);
	});

	asyncTest('The store can find a single record properly', function() {
		expect(1);

		store.find(typeKey, '1').then(function(record) {
			start();
			ok(record === records[1]);
		});
	});

	asyncTest('The store can load and find multiple records properly', function() {
		expect(4);

		store.find(typeKey, ['1', '2', '4']).then(function(resolvedRecords) {
			start();

			var set = new Em.Set(resolvedRecords);
			ok(Em.get(set, 'length') === 3);
			ok(set.contains(records[1]));
			ok(set.contains(records[2]));
			ok(set.contains(records[4]));
		});
	});

	asyncTest('The store can find all records of a type properly', function() {
		expect(5);

		store.find(typeKey).then(function(resolvedRecords) {
			start();

			var set = new Em.Set(resolvedRecords);
			ok(Em.get(set, 'length') === 4);
			ok(set.contains(records[1]));
			ok(set.contains(records[2]));
			ok(set.contains(records[3]));
			ok(set.contains(records[4]));
		});
	});

	asyncTest('The store saves new records properly', function() {
		expect(5);

		var record = store.createRecord(typeKey, {});
		var tempId = record.get('id');

		ok(store.hasRecord(typeKey, tempId));

		var promise = store.saveRecord(record);

		ok(record.get('isSaving') === true);

		promise.then(function() {
			start();

			ok(!store.hasRecord(typeKey, tempId));
			ok(tempId !== record.get('id'));
			ok(store.hasRecord(typeKey, record.get('id')));
		});
	});

	asyncTest('The store deletes a record properly', function() {
		expect(5);

		var promise = store.deleteRecord(records[1]);

		ok(records[1].get('isDirty') === true);
		ok(records[1].get('isDeleted') === true);

		promise.then(function() {
			start();

			ok(!store.hasRecord(typeKey, '1'));
			ok(records[1].get('isDirty') === false);
			ok(records[1].get('isDeleted') === true);
		});
	});

	asyncTest('The store uses the cache properly', function() {
		expect(1);

		var deleted = records[1];
		delete records[1];

		store.find(typeKey, '1').then(function(record) {
			start();

			ok(deleted === record);
		});
	});

	test('The store detects the overridden cacheTimeout properly', function() {
		expect(1);

		ok(store.cacheTimeout === 60*1000);
	});

	test('The store invalidates records in the cache after the timeout period', function() {
		expect(1);

		Date.setTime(5*60*1000, true);

		ok(store.hasRecord(typeKey, '1') === false);

		Date.resetTime();
	});
})();
