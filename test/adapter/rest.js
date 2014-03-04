(function() {
	'use strict';

	var prefix = 'http://foo.com/api';
	var store, adapter;

	module('REST Adapter', {
		setup: function() {
			store = setupStore({
				foo: EG.Model.extend(),
				test: EG.Model.extend({
					string: EG.attr({ type: 'string' }),
					number: EG.attr({ type: 'number', defaultValue: 0 }),

					hasONe1: EG.hasOne({ relatedType: 'foo', inverse: null }),
					hasONe2: EG.hasOne({
						relatedType: 'foo', inverse: null, isRequired: false, defaultValue: '123' }),
					hasMany: EG.hasMany({ relatedType: 'foo', inverse: null, isRequired: false })
				})
			});

			adapter = store.get('adapter');

			adapter._prefix = function() {
				return prefix;
			};

			store._loadRecord('test', {
				id: '1',
				string: 'foo',
				number: 42,

				hasONe1: '1',
				hasONe2: '2',
				hasMany: ['1', '2', '4', '8']
			});
		}
	});

	test('The serializer is initialized properly', function() {
		expect(1);

		ok(EG.JSONSerializer.detectInstance(adapter.get('serializer')));
	});

	asyncTest('Find requests are properly formed', function() {
		expect(3);

		adapter._ajax = function(url, verb, headers, body) {
			start();

			strictEqual(url, prefix + '/test/1');
			strictEqual(verb, 'GET');
			ok(body === undefined || body === '');

			return Em.RSVP.resolve();
		};

		adapter.findRecord('test', '1');
	});

	asyncTest('Find many requests are properly formed', function() {
		expect(3);

		adapter._ajax = function(url, verb, headers, body) {
			start();

			strictEqual(url, prefix + '/test/1,2,3');
			strictEqual(verb, 'GET');
			ok(body === undefined || body === '');

			return Em.RSVP.resolve();
		};

		adapter.findMany('test', ['1', '2', '3']);
	});

	asyncTest('Find all requests are properly formed', function() {
		expect(3);

		adapter._ajax = function(url, verb, headers, body) {
			start();

			strictEqual(url, prefix + '/tests');
			strictEqual(verb, 'GET');
			ok(body === undefined || body === '');

			return Em.RSVP.resolve();
		};

		adapter.findAll('test');
	});

	asyncTest('Find query requests are properly formed', function() {
		expect(3);

		adapter._ajax = function(url, verb, headers, body) {
			start();

			strictEqual(url, prefix + '/tests?' + 'search=' + encodeURIComponent('this should be escaped'));
			strictEqual(verb, 'GET');
			ok(body === undefined || body === '');

			return Em.RSVP.resolve();
		};

		adapter.findQuery('test', { search: 'this should be escaped' });
	});

	asyncTest('Create requests are properly formed', function() {
		expect(3);

		adapter._ajax = function(url, verb, headers, body) {
			start();

			strictEqual(url, prefix + '/tests');
			strictEqual(verb, 'POST');

			deepEqual(typeof body === 'string' ? JSON.parse(body) : body, {
				string: '',
				number: 0,
				links: {
					hasONe1: null,
					hasONe2: '123',
					hasMany: []
				}
			});


			return Em.RSVP.resolve();
		};

		adapter.createRecord(store.createRecord('test', { string: '', hasONe1: null }));
	});

	asyncTest('Update requests are properly formed', function() {
		expect(3);

		adapter._ajax = function(url, verb, headers, body) {
			start();

			strictEqual(url, prefix + '/test/1');
			strictEqual(verb, 'PUT');

			if (typeof body === 'string') {
				body = JSON.parse(body);
			}

			body.links.hasMany.sort();

			deepEqual(body, {
				id: '1',
				string: 'foo',
				number: 42,
				links: {
					hasONe1: '1',
					hasONe2: '2',
					hasMany: ['1', '2', '4', '8']
				}
			});


			return Em.RSVP.resolve();
		};

		adapter.updateRecord(store.getRecord('test', '1'));
	});

	asyncTest('Delete requests are properly formed', function() {
		expect(3);

		adapter._ajax = function(url, verb, headers, body) {
			start();

			strictEqual(url, prefix + '/test/1');
			strictEqual(verb, 'DELETE');
			ok(body === undefined || body === '');

			return Em.RSVP.Promise.resolve();
		};

		adapter.deleteRecord(store.getRecord('test', '1'));
	});
})();