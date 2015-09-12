(function() {
	'use strict';

	var type = EG.EnumType.extend({
		defaultValue: 'ORANGE',
		values: ['RED', 'ORANGE', 'YELLOW', 'GREEN', 'BLUE', 'INDIGO', 'VIOLET']
	}).create();

	module('Enum Attribute Type Test');

	test('Values are serialized correctly', function() {
		expect(7);

		strictEqual(type.serialize('BLUE'), 'BLUE');
		strictEqual(type.serialize('RED'), 'RED');
		strictEqual(type.serialize('green'), 'green');
		strictEqual(type.serialize(''), 'ORANGE');
		strictEqual(type.serialize(null), 'ORANGE');
		strictEqual(type.serialize(new String('INDIGO')), 'INDIGO'); // eslint-disable-line no-new-wrappers
		strictEqual(type.serialize(String('violet')), 'violet');
	});

	test('Values are compared correctly', function() {
		expect(7);

		ok(type.isEqual('RED', 'RED'));
		ok(type.isEqual('orange', 'orange'));
		ok(type.isEqual('yellow', 'YELLOW'));
		ok(type.isEqual(String('Green'), 'green'));
		ok(!type.isEqual('BLUE', 'RED'));
		ok(!type.isEqual(null, 'RED'));
		ok(!type.isEqual());
	});
})();