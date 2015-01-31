(function() {
	'use strict';

	var Promise = Em.RSVP.Promise;

	var typeKey = 'test';
	var cache;

	module('Record Retrieval Cache Test', {
		setup: function() {
			cache = EG.RecordRequestCache.create();
		}
	});

	test('Returns null for empty cache', function() {
		expect(5);

		strictEqual(cache.getPendingRequest(typeKey), null);
		strictEqual(cache.getPendingRequest(typeKey, '10'), null);
		strictEqual(cache.getPendingRequest(typeKey, 10), null);
		strictEqual(cache.getPendingRequest(typeKey, ['1', '2', 3]), null);
		strictEqual(cache.getPendingRequest(typeKey, { foo: 'bar' }), null);
	});

	test('Single ID retrieval', function() {
		expect(1);

		var promise = new Promise(function() {});
		cache.savePendingRequest(typeKey, 10, promise);
		strictEqual(cache.getPendingRequest(typeKey, '10'), promise);
	});

	test('Multiple ID retrieval', function() {
		expect(1);

		var promise = new Promise(function() {});
		cache.savePendingRequest(typeKey, ['1', '2', 3], promise);
		strictEqual(cache.getPendingRequest(typeKey, [1, 2, '3']), promise);
	});

	test('All type retrieval', function() {
		expect(1);

		var promise = new Promise(function() {});
		cache.savePendingRequest(typeKey, promise);
		strictEqual(cache.getPendingRequest(typeKey), promise);
	});

	test('Query retrieval is unimplemented', function() {
		expect(1);

		var promise = new Promise(function() {});
		cache.savePendingRequest(typeKey, {}, promise);
		strictEqual(cache.getPendingRequest(typeKey), null);
	});

	test('Single ID chains all type request', function() {
		expect(2);

		var promise = new Promise(function() {});
		cache.savePendingRequest(typeKey, promise);
		strictEqual(cache.getPendingRequest(typeKey, '1'), promise);
		strictEqual(cache.getPendingRequest(typeKey, 100), promise);
	});

	test('Multiple IDs chains all type request', function() {
		expect(1);

		var promise = new Promise(function() {});
		cache.savePendingRequest(typeKey, promise);
		strictEqual(cache.getPendingRequest(typeKey, [1, 2, 3]), promise);
	});

	test('Single ID chains multiple ID request', function() {
		expect(2);

		var promise = new Promise(function() {});
		cache.savePendingRequest(typeKey, [1, 2, 3], promise);
		strictEqual(cache.getPendingRequest(typeKey, '1'), promise);
		strictEqual(cache.getPendingRequest(typeKey, 3), promise);
	});

	test('Multiple ID chains request with same IDs', function() {
		expect(2);

		var promise = new Promise(function() {});
		cache.savePendingRequest(typeKey, [1, 2, 3], promise);
		strictEqual(cache.getPendingRequest(typeKey, [1, 2, 3]), promise);
		strictEqual(cache.getPendingRequest(typeKey, [3, 1, 2]), promise);
	});

	asyncTest('Single ID promise gets removed', function() {
		expect(2);

		var promise = Promise.resolve();
		cache.savePendingRequest(typeKey, '1', promise);

		start();
		strictEqual(cache.getPendingRequest(typeKey, '1'), promise);
		stop();

		Em.run.next(function() {
			start();
			strictEqual(cache.getPendingRequest(typeKey, '1'), null);
		});
	});

	asyncTest('Multiple IDs promise gets removed', function() {
		expect(4);

		var promise = Promise.resolve();
		cache.savePendingRequest(typeKey, [1, 2, 3], promise);

		start();
		strictEqual(cache.getPendingRequest(typeKey, '1'), promise);
		strictEqual(cache.getPendingRequest(typeKey, [1, 2, 3]), promise);
		stop();

		Em.run.next(function() {
			start();
			strictEqual(cache.getPendingRequest(typeKey, '1'), null);
			strictEqual(cache.getPendingRequest(typeKey, [1, 2, 3]), null);
		});
	});

	asyncTest('All type promise gets removed', function() {
		expect(6);

		var promise = Promise.resolve();
		cache.savePendingRequest(typeKey, promise);

		start();
		strictEqual(cache.getPendingRequest(typeKey), promise);
		strictEqual(cache.getPendingRequest(typeKey, '1'), promise);
		strictEqual(cache.getPendingRequest(typeKey, [1, 2, 3]), promise);
		stop();

		Em.run.next(function() {
			start();
			strictEqual(cache.getPendingRequest(typeKey), null);
			strictEqual(cache.getPendingRequest(typeKey, '1'), null);
			strictEqual(cache.getPendingRequest(typeKey, [1, 2, 3]), null);
		});
	});
})();