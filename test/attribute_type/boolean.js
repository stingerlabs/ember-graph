(function() {
	'use strict';

	var type = EG.BooleanType.create();

	module('Boolean Attribute Type Test');

	test('Validity checking works correctly', function() {
		expect(12);

		ok(type.isValid(true));
		ok(type.isValid(false));
		ok(type.isValid(new Boolean(true))); // jshint ignore:line
		ok(type.isValid(Boolean(false))); // jshint ignore:line

		ok(!type.isValid());
		ok(!type.isValid(null));
		ok(!type.isValid(NaN));
		ok(!type.isValid(undefined));
		ok(!type.isValid(''));
		ok(!type.isValid({}));
		ok(!type.isValid(600));
		ok(!type.isValid(Infinity));
	});

	test('Serialization works correctly', function() {
		expect(12);

		strictEqual(type.serialize(true), true);
		strictEqual(type.serialize('true'), true);
		strictEqual(type.serialize(new Boolean(true)), true); // jshint ignore:line
		strictEqual(type.serialize(Boolean(true)), true);

		strictEqual(type.serialize(false), false);
		strictEqual(type.serialize('false'), false);
		strictEqual(type.serialize(new Boolean(false)), false); // jshint ignore:line
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