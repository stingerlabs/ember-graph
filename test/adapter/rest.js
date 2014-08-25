(function() {
	'use strict';

	var store, adapter;

	module('REST Adapter', {
		setup: function() {
			store = setupStore({
				person: EG.Model.extend({
					name: EG.attr({ type: 'string', defaultValue: '' })
				})
			}, {
				adapter: EG.RESTAdapter.extend({
					prefix: Em.computed(function() {
						return '/api';
					}).property()
				})
			});

			adapter = store.get('container').lookup('adapter:application');

			store.pushPayload({
				person: [{ id: '1' }]
			});
		}
	});

	test('The serializer is initialized properly', function() {
		expect(2);

		ok(EG.JSONSerializer.detectInstance(adapter.serializerFor('person')));
		ok(EG.JSONSerializer.detectInstance(adapter.serializerFor('foobar')));
	});

	asyncTest('findRecord request', function() {
		expect(3);

		adapter.ajax = function(url, verb, body) {
			start();

			strictEqual(url, '/api/people/10');
			strictEqual(verb, 'GET');
			strictEqual(body, undefined);

			return Em.RSVP.resolve();
		};

		adapter.findRecord('person', '10');
	});

	asyncTest('findMany request', function() {
		expect(3);

		adapter.ajax = function(url, verb, body) {
			start();

			strictEqual(url, '/api/people/5,6,7');
			strictEqual(verb, 'GET');
			strictEqual(body, undefined);

			return Em.RSVP.resolve();
		};

		adapter.findMany('person', ['5', '6', '7']);
	});

	asyncTest('findAll request', function() {
		expect(3);

		adapter.ajax = function(url, verb, body) {
			start();

			strictEqual(url, '/api/people');
			strictEqual(verb, 'GET');
			strictEqual(body, undefined);

			return Em.RSVP.resolve();
		};

		adapter.findAll('person');
	});

	asyncTest('findRecord request', function() {
		expect(3);

		adapter.ajax = function(url, verb, body) {
			start();

			strictEqual(url, '/api/people?searchTerm=none&sortAscending=true');
			strictEqual(verb, 'GET');
			strictEqual(body, undefined);

			return Em.RSVP.resolve();
		};

		adapter.findQuery('person', { searchTerm: 'none', sortAscending: true });
	});

	asyncTest('createRecord request', function() {
		expect(3);

		adapter.ajax = function(url, verb, body) {
			start();

			strictEqual(url, '/api/people');
			strictEqual(verb, 'POST');
			deepEqual(body, { people: [{ name: '', links: {} }] });

			return Em.RSVP.resolve({ people: [{ id: '100' }] });
		};

		var person = store.createRecord('person', { name: '' });
		adapter.createRecord(person);
	});

	asyncTest('updateRecord request', function() {
		expect(3);

		adapter.ajax = function(url, verb, body) {
			start();

			strictEqual(url, '/api/people/1');
			strictEqual(verb, 'PATCH');
			deepEqual(body, [{ op: 'replace', path: '/name', value: 'Bob' }]);

			return Em.RSVP.resolve();
		};

		var person = store.getRecord('person', '1');
		person.set('name', 'Bob');
		adapter.updateRecord(person);
	});

	asyncTest('deleteRecord request', function() {
		expect(3);

		adapter.ajax = function(url, verb, body) {
			start();

			strictEqual(url, '/api/people/1');
			strictEqual(verb, 'DELETE');
			strictEqual(body, undefined);

			return Em.RSVP.resolve();
		};

		var person = store.getRecord('person', '1');
		adapter.deleteRecord(person);
	});
})();