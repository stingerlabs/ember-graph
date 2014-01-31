(function() {
	'use strict';

	var TestModel = Eg.Model.extend({
		typeKey: 'test'
	});

	module('Model ID Test');

	test('Existing ID loads correctly', function() {
		expect(1);

		var id = 'TEST_ID';
		var model = TestModel.createRecord({ id: id });

		ok(model.get('id') === id);
	});

	test('New ID is created', function() {
		expect(1);

		var model = TestModel.createRecord({});

		ok(Eg.String.startsWith(model.get('id'), Eg.Model.temporaryIdPrefix));
	});

	test('A permanent ID cannot be changed', function() {
		expect(1);

		var model = TestModel.createRecord({ id: '1' });

		throws(function() {
			model.set('id', '');
		});
	});

	test('A temporary ID can be changed to a permanent one', function() {
		expect(1);

		var model = TestModel.createRecord({});
		model.set('id', '');

		ok(model.get('id') === '');
	});
})();

