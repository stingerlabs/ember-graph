(function() {
	'use strict';

	var BELONGS_TO_KEY = Eg.Model.BELONGS_TO_KEY;
	var HAS_MANY_KEY = Eg.Model.HAS_MANY_KEY;

	var TestModel = Eg.Model.extend({
		typeKey: 'test',

		single: Eg.belongsTo({ relatedType: 'foo', inverse: null }),
		multiple: Eg.hasMany({ relatedType: 'bar', inverse: null })
	});

	module('Model State Test');

	test('New records are marked as new', function() {
		expect(1);

		var record = TestModel.createRecord({
			single: '',
			multiple: []
		});

		ok(record.get('isNew') === true);
	});

	test('Records with IDs aren\'t marked as new', function() {
		expect(1);

		var record = TestModel.createRecord({
			id: 'foobar',
			single: '',
			multiple: []
		});

		ok(record.get('isNew') === false);
	});

	test('Setting the store marks the record as loaded', function() {
		expect(2);

		var record = TestModel.createRecord({
			id: 'foobar',
			single: '',
			multiple: []
		});

		ok(record.get('isLoaded') === false);

		record.set('store', Ember.Object.create());

		ok(record.get('isLoaded') === true);
	});
})();