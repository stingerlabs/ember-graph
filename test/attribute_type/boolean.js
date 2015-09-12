(function() {
	'use strict';

	var type = EG.BooleanType.create();

	module('Boolean Attribute Type Test');

	test('Serialization works correctly', function() {
		expect(12);

		strictEqual(type.serialize(true), true);
		strictEqual(type.serialize('true'), true);
		strictEqual(type.serialize(new Boolean(true)), true); // eslint-disable-line no-new-wrappers
		strictEqual(type.serialize(Boolean(true)), true);

		strictEqual(type.serialize(false), false);
		strictEqual(type.serialize('false'), false);
		strictEqual(type.serialize(new Boolean(false)), false); // eslint-disable-line no-new-wrappers
		strictEqual(type.serialize(Boolean(false)), false);

		strictEqual(type.serialize(''), false);
		strictEqual(type.serialize(), false);
		strictEqual(type.serialize(null), false);
		strictEqual(type.serialize(5), false);
	});

	test('Deserialization works correctly', function() {
		expect(9);

		strictEqual(type.deserialize(undefined), false);
		strictEqual(type.deserialize(null), false);
		strictEqual(type.deserialize(42), false);
		strictEqual(type.deserialize(false), false);
		strictEqual(type.deserialize(true), true);
		strictEqual(type.deserialize('true'), true);
		strictEqual(type.deserialize('true_'), false);
		strictEqual(type.deserialize({}), false);
		strictEqual(type.deserialize([]), false);
	});
})();