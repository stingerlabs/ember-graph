(function() {
	'use strict';

	var type = EG.DateType.create();

	module('Date Attribute Type Test');

	test('Serialization works correctly', function() {
		expect(4);

		var now = new Date();
		strictEqual(type.serialize(now), now.getTime());
		strictEqual(type.serialize(), null);
		strictEqual(type.serialize(null), null);
		strictEqual(type.serialize(832748734), 832748734);
	});

	test('Deserialization works correctly', function() {
		expect(6);

		strictEqual(type.deserialize(undefined), null);
		strictEqual(type.deserialize(null), null);
		strictEqual(type.deserialize({}), null);
		strictEqual(type.deserialize([]), null);
		ok(type.isEqual(type.deserialize('2012-01-01'), new Date('2012-01-01')));
		ok(type.isEqual(type.deserialize(12343466000), new Date(12343466000)));
	});
})();