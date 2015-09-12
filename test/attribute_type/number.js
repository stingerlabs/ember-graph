(function() {
	'use strict';

	var type = EG.NumberType.create();

	module('Number Attribute Type Test');

	test('Serialization works correctly', function() {
		expect(7);

		strictEqual(500, type.serialize(500));
		strictEqual(5, type.serialize(new Number(5))); // eslint-disable-line no-new-wrappers
		strictEqual(0, type.serialize(null));
		strictEqual(0, type.serialize());
		strictEqual(0, type.serialize({}));
		strictEqual(4, type.serialize('4'));
		strictEqual(0, type.serialize(true));
	});

	test('Deserialization works correctly', function() {
		expect(8);

		strictEqual(type.deserialize(undefined), 0);
		strictEqual(type.deserialize(null), 0);
		strictEqual(type.deserialize(42), 42);
		strictEqual(type.deserialize(false), 0);
		strictEqual(type.deserialize(true), 0);
		strictEqual(type.deserialize('500'), 500);
		strictEqual(type.deserialize({}), 0);
		strictEqual(type.deserialize([]), 0);
	});
})();