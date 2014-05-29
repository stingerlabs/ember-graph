(function() {
	'use strict';

	var type = EG.DateType.create();

	module('Date Attribute Type Test');

	test('Validity checking works correctly', function() {
		expect(10);

		var CustomDate = function() {};
		CustomDate.prototype = new Date();

		ok(type.isValid(null));
		ok(type.isValid(new Date()));
		ok(type.isValid(new CustomDate()));

		ok(!type.isValid());
		ok(!type.isValid(NaN));
		ok(!type.isValid(undefined));
		ok(!type.isValid(''));
		ok(!type.isValid({}));
		ok(!type.isValid(600));
		ok(!type.isValid(Infinity));
	});

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