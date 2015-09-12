(function() {
	'use strict';

	var type = EG.ObjectType.create();

	module('Object Attribute Type Test');

	test('Empty objects are equal', function() {
		expect(1);

		ok(type.isEqual({}, {}));
	});

	test('Object constructors work too', function() {
		expect(1);

		ok(type.isEqual(Object(), Object()));
	});

	test('Simple objects are equal', function() {
		expect(1);

		var a = { foo: 1, bar: 2 };
		var b = { bar: 2, foo: 1 };

		ok(type.isEqual(a, b));
	});

	test('Type coercions aren\'t performed', function() {
		expect(1);

		var a = { foo: '1' };
		var b = { foo: 1 };

		ok(!type.isEqual(a, b));
	});

	test('Arrays compare equally', function() {
		expect(1);

		var a = { arr: [1, 2, 3, 4, 5] };
		var b = { arr: [1, 2, 3, 4, 5] };

		ok(type.isEqual(a, b));
	});

	test('Nested objects compare equally', function() {
		expect(1);

		var a = {
			a: null,
			o: {
				2: 2,
				3: 4,
				1: 1
			}
		};
		var b = {
			a: null,
			o: {
				1: 1,
				2: 2,
				3: 4
			}
		};

		ok(type.isEqual(a, b));
	});

	test('Non-objects always fail', function() {
		expect(8);

		ok(!type.isEqual());
		ok(!type.isEqual(null, null));
		ok(!type.isEqual(true, true));
		ok(!type.isEqual(0, 0));
		ok(!type.isEqual('', ''));
		ok(!type.isEqual(NaN, NaN));
		ok(!type.isEqual([], []));
		ok(!type.isEqual(new Date(), new Date()));
	});
})();