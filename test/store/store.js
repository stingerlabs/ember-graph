(function() {
	'use strict';

	var typeKey = 'storeTest';

	var store, records;

	var Adapter = EG.Adapter.extend({

		createRecord: function(record) {
			var id = EG.generateUUID();
			return Em.RSVP.Promise.resolve({ meta: { newId: id }, storeTest: [{ id: id }] });
		},

		findRecord: function(type, id) {
			return Em.RSVP.Promise.resolve({ storeTest: [records[id]] });
		},

		findMany: function(type, ids) {
			return Em.RSVP.Promise.resolve({
				storeTest: ids.map(function(id) {
					return records[id];
				})
			});
		},

		findAll: function(type) {
			return this.findMany(type, ['1', '2', '3', '4']);
		},

		updateRecord: function(record) {
			return Em.RSVP.Promise.resolve({ storeTest: [records[record.get('id')]] });
		},

		deleteRecord: function(record) {
			return Em.RSVP.Promise.resolve({});
		}
	});

	module('Store Test', {
		setup: function() {
			store = setupStore({ storeTest: EG.Model.extend() }, { adapter: Adapter });

			records = {
				'1': { id: '1' },
				'2': { id: '2' },
				'3': { id: '3' },
				'4': { id: '4' }
			};
		}
	});

	test('The store can load records properly', function() {
		expect(6);

		strictEqual(store.getRecord(typeKey, '1'), null);
		strictEqual(store.getRecord(typeKey, '2'), null);
		strictEqual(store.getRecord(typeKey, '4'), null);

		var payload = {};
		payload[typeKey] = [records[1], records[2], records[4]];
		store.extractPayload(payload);

		ok(store.getRecord(typeKey, '1'));
		ok(store.getRecord(typeKey, '2'));
		ok(store.getRecord(typeKey, '4'));
	});

	asyncTest('The store can find a single record properly', function() {
		expect(3);

		strictEqual(store.getRecord(typeKey, '1'), null);
		store.find(typeKey, '1').then(function(record) {
			start();
			ok(store.getRecord(typeKey, '1'));
			strictEqual(record.get('id'), '1');
		});
	});

	asyncTest('The store can load and find multiple records properly', function() {
		expect(4);

		store.find(typeKey, ['1', '2', '4']).then(function(resolvedRecords) {
			start();

			var set = new Em.Set(resolvedRecords);
			ok(Em.get(set, 'length') === 3);
			ok(store.getRecord(typeKey, '1'));
			ok(store.getRecord(typeKey, '2'));
			ok(store.getRecord(typeKey, '4'));
		});
	});

	asyncTest('The store can find all records of a type properly', function() {
		expect(5);

		store.find(typeKey).then(function(resolvedRecords) {
			start();

			var set = new Em.Set(resolvedRecords);

			ok(Em.get(set, 'length') === 4);
			ok(store.getRecord(typeKey, '1'));
			ok(store.getRecord(typeKey, '2'));
			ok(store.getRecord(typeKey, '3'));
			ok(store.getRecord(typeKey, '4'));
		});
	});

	asyncTest('The store saves new records properly', function() {
		expect(4);

		var record = store.createRecord(typeKey, {});
		var tempId = record.get('id');

		ok(store.getRecord(typeKey, tempId));

		var promise = store.saveRecord(record);

		promise.then(function() {
			start();

			ok(!store.getRecord(typeKey, tempId));
			ok(tempId !== record.get('id'));
			ok(store.getRecord(typeKey, record.get('id')));
		});
	});

	asyncTest('The store deletes a record properly', function() {
		expect(3);

		var record;

		store.find(typeKey, '1').then(function(r) {
			record = r;
			var promise = record.destroy();

			start();
			strictEqual(record.get('isDeleting'), true);
			stop();

			return promise;
		}).then(function() {
			start();

			strictEqual(store.getRecord(typeKey, '1'), null);
			strictEqual(record.get('isDeleted'), true);
		});
	});

	test('The `cacheFor` method functions properly', function() {
		expect(4);

		var payload = {};

		payload[typeKey] = [records[1]];
		store.extractPayload(payload);
		deepEqual(store.cachedRecordsFor(typeKey).mapBy('id').sort(), ['1'].sort());

		payload[typeKey] = [records[2]];
		store.extractPayload(payload);
		deepEqual(store.cachedRecordsFor(typeKey).mapBy('id').sort(), ['1', '2'].sort());

		payload[typeKey] = [records[3]];
		store.extractPayload(payload);
		deepEqual(store.cachedRecordsFor(typeKey).mapBy('id').sort(), ['1', '2', '3'].sort());

		payload[typeKey] = [records[4]];
		store.extractPayload(payload);
		deepEqual(store.cachedRecordsFor(typeKey).mapBy('id').sort(), ['1', '2', '3', '4'].sort());
	});

	test('Look up per-type adapters', function() {
		expect(3);

		var container = store.get('container');

		var UserAdapter = EG.Adapter.extend({});
		var ForumAdminAdapter = EG.Adapter.extend({});
		container.register('adapter:user', UserAdapter);
		container.register('adapter:forum_admin', ForumAdminAdapter);

		ok(UserAdapter.detectInstance(store.adapterFor('user')));
		ok(ForumAdminAdapter.detectInstance(store.adapterFor('forum_admin')));
		ok(Adapter.detectInstance(store.adapterFor('foobar')));
	});
})();
