(function() {
	'use strict';

	var store = setupStore({ test: EG.Model.extend() });

	module('Model Type Property Test');

	test('typeKey exists on instances', function() {
		expect(1);

		var model = store.createRecord('test', {});

		ok(model.typeKey === 'test');
	});

	test('typeKey exists on the class', function() {
		expect(1);

		var TestModel = store.modelFor('test');

		ok(TestModel.typeKey === 'test');
	});

	test('Looking up a type from the store works', function() {
		expect(1);

		ok(EG.Model.detect(store.modelFor('test')));
	});
})();
