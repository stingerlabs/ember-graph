(function() {
	'use strict';

	var TestModel = Eg.Model.extend({
		typeKey: 'test'
	});

	module('Model Type Property Test');

	test('typeKey exists on instances', function() {
		expect(1);

		var model = TestModel.createRecord({});

		ok(model.typeKey === 'test');
	});

	test('typeKey exists on the class', function() {
		expect(1);

		ok(TestModel.typeKey === 'test');
	});

	test('Looking up a type from Eg.Model works', function() {
		expect(1);

		ok(Eg.Model.modelForType('test') === TestModel);
	});

	test('Looking up a type from a subclass works', function() {
		expect(1);

		ok(TestModel.modelForType('test') === TestModel);
	});
})();
