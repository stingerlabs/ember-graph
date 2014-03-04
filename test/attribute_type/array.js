(function() {
	'use strict';

	var type = EG.ArrayType.create();

	module('Array Attribute Type Test');

	test('Comparison works correctly', function() {
		expect(5);

		ok(type.isEqual([], []));
		ok(type.isEqual(['hello'], ['hello']));
		ok(type.isEqual([1,2,3], [1,2,3]));
		ok(!type.isEqual([1,2], [2,1]));
		ok(!type.isEqual([''], [null]));
	});
})();