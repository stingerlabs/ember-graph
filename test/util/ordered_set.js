(function() {
	'use strict';

	module('Ordered Set Test');

	test('An empty set is constructed correctly', function() {
		expect(1);

		var set = new Eg.OrderedStringSet();

		ok(set.get('length') === 0);
	});

	test('An single item set is constructed correctly', function() {
		expect(2);

		var set = new Eg.OrderedStringSet(['hello']);

		ok(set.get('length') === 1);
		ok(set.contains('hello'));
	});

	test('An multiple item set is constructed correctly', function() {
		expect(4);

		var set = new Eg.OrderedStringSet(['1', '2', '3']);

		ok(set.get('length') === 3);
		ok(set.contains('1'));
		ok(set.contains('2'));
		ok(set.contains('3'));
	});

	test('The constructor throw when given a non-enumerable object', function() {
		expect(1);

		throws(function() {
			var foo = new Eg.OrderedStringSet('hello');
		});
	});

	test('Adding an object works correctly', function() {
		expect(4);

		var set = new Eg.OrderedStringSet();

		ok(set.get('length') === 0);
		ok(!set.contains('foo'));

		set.addObject('foo');

		ok(set.get('length') === 1);
		ok(set.contains('foo'));
	});

	test('Adding multiple objects works correctly', function() {
		expect(5);

		var set = new Eg.OrderedStringSet();

		ok(set.get('length') === 0);
		ok(!set.contains('foo'));

		set.addObjects(['1', '2']);

		ok(set.get('length') === 2);
		ok(set.contains('1'));
		ok(set.contains('2'));
	});

	test('Adding a non-string throws', function() {
		expect(1);

		throws(function() {
			var foo = new Eg.OrderedStringSet([1]);
		});
	});

	test('Removing an object works', function() {
		expect(6);

		var set = new Eg.OrderedStringSet(['1', '2', '3']);

		ok(set.get('length') === 3);
		ok(set.contains('1'));
		ok(set.contains('2'));

		set.removeObject('2');

		ok(set.get('length') === 2);
		ok(set.contains('1'));
		ok(!set.contains('2'));
	});

	test('Equality detects another equal ordered set', function() {
		expect(2);

		var one = new Eg.OrderedStringSet(['1', '2', '3']);
		var two = new Eg.OrderedStringSet(['1', '2', '3']);

		ok(one.isEqual(two));
		ok(two.isEqual(one));
	});

	test('Equality detects a non-equal ordered set', function() {
		expect(2);

		var one = new Eg.OrderedStringSet(['1', '2', '3']);
		var two = new Eg.OrderedStringSet(['1', '4']);

		ok(!one.isEqual(two));
		ok(!two.isEqual(one));
	});

	test('Equality works on a different type of enumerable', function() {
		expect(2);

		var set = new Eg.OrderedStringSet(['1', '2', '3']);

		ok(set.isEqual(['1', '2', '3']));
		ok(!set.isEqual(['1']));
	});

	test('Equality works with a null value', function() {
		expect(1);

		var set = new Eg.OrderedStringSet(['1', '2', '3']);

		ok(!set.isEqual(null));
	});

	test('A set copies correctly', function() {
		expect(2);

		var set = new Eg.OrderedStringSet(['foo', 'bar']);
		var copy = set.copy();

		ok(set !== copy);
		ok(set.isEqual(copy));
	});

	test('The iteration order is correct', function() {
		expect(10);

		var current = 1;
		var set = new Eg.OrderedStringSet(['1', '2', '3', '4', '5']);

		set.forEach(function(string, index) {
			ok(current.toString() === string);
			ok(string === (index + 1).toString());
			current = current + 1;
		});
	});

	test('Getting an object at an index is consistent', function() {
		expect(5);

		var set = new Eg.OrderedStringSet(['1', '2', '3']);

		ok(set.objectAt(1) === '2');
		set.removeObject('3');
		ok(set.objectAt(1) === '2');
		set.removeObject('1');
		ok(set.objectAt(0) === '2');
		set.addObject('3');
		ok(set.objectAt(0) === '2');
		set.addObjectAt('1', 0);
		ok(set.objectAt(1) === '2');
	});

	test('Inserting into the middle of the set works correctly', function() {
		expect(2);

		var set = new Eg.OrderedStringSet(['1', '2', '3']);

		ok(set.objectAt(1) === '2');
		set.addObjectAt('0', 1);
		ok(set.objectAt(1) === '0');
	});

	test('indexOf works correctly', function() {
		expect(3);

		var set = new Eg.OrderedStringSet(['1', '2', '3']);

		ok(set.indexOf('1') === 0);
		ok(set.indexOf('2') === 1);
		ok(set.indexOf('3') === 2);
	});

	test('Adding an existing object doesn\'t do anything', function() {
		expect(2);

		var set = new Eg.OrderedStringSet(['1', '2', '3']);

		ok(set.get('length') === 3);
		set.addObject('2');
		ok(set.get('length') === 3);
	});

	test('Adding an object at Infinity index adds to the end', function() {
		expect(1);

		var set = new Eg.OrderedStringSet(['1', '2', '3']);

		set.addObjectAt('4', Infinity);
		ok(set.objectAt(3) === '4');
	});
})();

