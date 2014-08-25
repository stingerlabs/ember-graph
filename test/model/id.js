(function() {
	'use strict';

	var store = setupStore({ test: EG.Model.extend() });

	module('Model ID Test');

	test('Existing ID loads correctly', function() {
		expect(1);

		store.pushPayload({
			test: [{ id: 'TEST_ID' }]
		});

		strictEqual(store.getRecord('test', 'TEST_ID').get('id'), 'TEST_ID');
	});

	test('New ID is created', function() {
		expect(1);

		var model = store.createRecord('test', {});

		ok(EG.String.startsWith(model.get('id'), EG.Model.temporaryIdPrefix));
	});

	test('A permanent ID cannot be changed', function() {
		expect(1);

		store.pushPayload({
			test: [{ id: '1' }]
		});

		var model = store.getRecord('test', '1');

		throws(function() {
			model.set('id', '');
		});
	});

	test('A temporary ID can be changed to a permanent one', function() {
		expect(1);

		var model = store.createRecord('test', {});
		model.set('id', '');

		ok(model.get('id') === '');
	});
})();

