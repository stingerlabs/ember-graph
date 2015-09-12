(function() {
	'use strict';

	var type = EG.StringType.create();

	module('String Attribute Type Test');

	test('Serialization works correctly', function() {
		expect(7);

		strictEqual('foo', type.serialize('foo'));
		strictEqual('bar', type.serialize(new String('bar'))); // eslint-disable-line no-new-wrappers
		strictEqual(null, type.serialize(null));
		strictEqual(null, type.serialize());
		strictEqual({}.toString(), type.serialize({}));
		strictEqual('4', type.serialize(4));
		strictEqual('true', type.serialize(true));
	});

	test('Deserialization works correctly', function() {
		expect(7);

		strictEqual(null, type.deserialize(undefined));
		strictEqual(null, type.deserialize(null));
		strictEqual('42', type.deserialize(42));
		strictEqual('false', type.deserialize(false));
		strictEqual('500', type.deserialize('500'));
		strictEqual({}.toString(), type.deserialize({}));
		strictEqual([].toString(), type.deserialize([]));
	});
})();