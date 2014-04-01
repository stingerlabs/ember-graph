(function() {
	'use strict';

	var type = EG.StringType.create();

	module('String Attribute Type Test');

	test('Validity checking works correctly', function() {
		expect(8);

		ok(type.isValid(null));
		ok(type.isValid(''));
		ok(type.isValid(new String(''))); // jshint ignore:line
		ok(type.isValid(new String(3))); // jshint ignore:line

		ok(!type.isValid());
		ok(!type.isValid(undefined));
		ok(!type.isValid(4));
		ok(!type.isValid({}));
	});

	test('Serialization works correctly', function() {
		expect(7);

		strictEqual('foo', type.serialize('foo'));
		strictEqual('bar', type.serialize(new String('bar'))); // jshint ignore:line
		strictEqual(null, type.serialize(null));
		strictEqual('undefined', type.serialize());
		strictEqual({}.toString(), type.serialize({}));
		strictEqual('4', type.serialize(4));
		strictEqual('true', type.serialize(true));
	});

	test('Deserialization works correctly', function() {
		expect(7);

		strictEqual('undefined', type.deserialize(undefined));
		strictEqual(null, type.deserialize(null));
		strictEqual('42', type.deserialize(42));
		strictEqual('false', type.deserialize(false));
		strictEqual('500', type.deserialize('500'));
		strictEqual({}.toString(), type.deserialize({}));
		strictEqual([].toString(), type.deserialize([]));
	});
})();