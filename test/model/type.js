(function() {
	'use strict';

	var store = Eg.Store.create();

	var TestModel = store.createModel('test', {});

	module('Model Type Property Test');

	test('typeKey exists on instances', function() {
		expect(1);

		var model = store.createRecord('test', {});

		ok(model.typeKey === 'test');
	});

	test('typeKey exists on the class', function() {
		expect(1);

		ok(TestModel.typeKey === 'test');
	});

	test('Looking up a type from the store works', function() {
		expect(1);

		ok(store.modelForType('test') === TestModel);
	});
})();
