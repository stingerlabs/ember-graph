(function() {
	'use strict';

	var TestModel = Eg.Model.extend({
		typeKey: 'storeTest'
	});

	var typeKey = TestModel.typeKey;

	var records = {
		'1': TestModel.createRecord({ id: '1' }),
		'2': TestModel.createRecord({ id: '2' }),
		'3': TestModel.createRecord({ id: '3' }),
		'4': TestModel.createRecord({ id: '4' })
	};

	var Adapter = Eg.Adapter.extend({

		createRecord: function(record) {
			record.set('id', Eg.util.generateGUID());
			return record;
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

	var TestStore = Eg.Store.extend({
		adapter: Adapter,
		cacheTimeout: 60*1000
	});

	var store = TestStore.create();

	module('Store Test', {
		setup: function() {
			records = {
				'1': TestModel.createRecord({ id: '1' }),
				'2': TestModel.createRecord({ id: '2' }),
				'3': TestModel.createRecord({ id: '3' }),
				'4': TestModel.createRecord({ id: '4' })
			};

			store = TestStore.create();
		}
	});

	test('The store initializes the adapter properly', function() {
		expect(1);

		ok(store.get('adapter') instanceof Adapter);
	});

	test('The store can load records properly', function() {
		expect(6);

		store.loadRecord(records[1]);
		store.loadRecord(records[2]);
		store.loadRecord(records[4]);

		ok(records[1].get('store') === store);
		ok(records[2].get('store') === store);
		ok(records[4].get('store') === store);

		ok(store.hasRecord(typeKey, '1') === true);
		ok(store.hasRecord(typeKey, '2') === true);
		ok(store.hasRecord(typeKey, '4') === true);
	});

	asyncTest('The store can find a single record properly', function() {
		expect(1);

		store.loadRecord(records[1]);

		store.find(typeKey, '1').then(function(record) {
			start();
			ok(record === records[1]);
		});
	});

	asyncTest('The store can load and find multiple records properly', function() {
		expect(4);

		store.loadRecord(records[1]);
		store.loadRecord(records[2]);
		store.loadRecord(records[4]);

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

		store.loadRecord(records[1]);
		store.loadRecord(records[2]);
		store.loadRecord(records[3]);
		store.loadRecord(records[4]);

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

	test('The store detects the overridden cacheTimeout properly', function() {
		expect(1);

		ok(store.cacheTimeout === 60*1000);
	});

	test('The store invalidates records in the cache after the timeout period', function() {
		expect(1);

		store.loadRecord(records[1]);

		timemachine.config({
			timestamp: new Date().getTime() + 5*60*1000
		});

		ok(store.hasRecord(typeKey, '1') === false);

		timemachine.reset();
	});
})();
