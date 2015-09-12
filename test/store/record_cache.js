(function() {
	'use strict';

	var store;
	var cache;

	module('Record Cache Test', {
		setup: function() {
			cache = EG.RecordCache.create();

			store = setupStore({
				item: EG.Model.extend()
			});

			store.pushPayload({
				item: [
					{ id: '1' },
					{ id: '2' },
					{ id: '3' },
					{ id: '4' },
					{ id: '5' }
				]
			});
		}
	});

	test('Store and fetch a record', function() {
		expect(3);

		var item1 = store.getRecord('item', '1');
		var item2 = store.getRecord('item', '2');
		var item3 = store.getRecord('item', '3');

		cache.storeRecord(item1);
		cache.storeRecord(item2);
		cache.storeRecord(item3);

		strictEqual(cache.getRecord('item', '1'), item1);
		strictEqual(cache.getRecord('item', '2'), item2);
		strictEqual(cache.getRecord('item', '3'), item3);
	});

	test('Fetch all records of a type', function() {
		expect(3);

		var item1 = store.getRecord('item', '1');
		var item2 = store.getRecord('item', '2');
		var item3 = store.getRecord('item', '3');

		cache.storeRecord(item1);
		cache.storeRecord(item2);
		cache.storeRecord(item3);

		cache.getRecords('item').forEach(function(record) {
			ok(record === item1 || record === item2 || record === item3);
		});
	});

	test('Records expire after timeout', function() {
		expect(2);

		cache = EG.RecordCache.create({ cacheTimeout: 10 });
		var item1 = store.getRecord('item', '1');
		cache.storeRecord(item1);
		strictEqual(cache.getRecord('item', '1'), item1);

		var then = Date.now();
		while (Date.now() - then <= 10) {} // eslint-disable-line no-empty

		strictEqual(cache.getRecord('item', '1'), null);
	});

	test('Live record arrays are kept up to date', function() {
		expect(7);

		var item1 = store.getRecord('item', '1');
		var item2 = store.getRecord('item', '2');
		var item3 = store.getRecord('item', '3');

		var items = cache.getLiveRecordArray('item');
		strictEqual(items.length, 0);

		cache.storeRecord(item1);
		strictEqual(items.length, 1);
		ok(items.contains(item1));

		cache.storeRecord(item2);
		strictEqual(items.length, 2);
		ok(items.contains(item2));

		cache.storeRecord(item3);
		strictEqual(items.length, 3);
		ok(items.contains(item3));
	});
})();