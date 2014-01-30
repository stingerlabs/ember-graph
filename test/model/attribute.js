(function() {
	'use strict';

	var attributes = {
		typeKey: 'test',

		name: Eg.attr({
			type: 'string',
			readOnly: true
		}),

		posts: Eg.attr({
			type: 'number',
			defaultValue: 0
		}),

		birthday: Eg.attr({
			type: 'date',
			compare: function(a, b) {
				return (new Date(a).getTime() === new Date(b).getTime());
			},
			valid: function(value) {
				return (new Date(value).getTime() <= new Date().getTime());
			}
		})
	};

	var TestModel = Eg.Model.extend(attributes);

	module('Model Attribute Test');

	test('The class properly detects every attribute (and only those attributes)', function() {
		expect(1);

		var expectedAttributes = new Em.Set(Em.keys(attributes));

		ok(Em.get(TestModel, 'attributes').isEqual(expectedAttributes));
	});

	test('The class knows which properties are attributes', function() {
		expect(3);

		ok(TestModel.isAttribute('name'));
		ok(!TestModel.isAttribute('foofoo'));
		ok(!TestModel.isAttribute('POSTS'));
	});

	test('Creating an object loads the attributes correctly', function() {
		expect(3);

		var birthday = new Date('1970-01-01');
		var model = TestModel.createRecord({
			name: 'Bob',
			posts: 16,
			birthday: birthday
		});

		ok(model.get('name') === 'Bob');
		ok(model.get('posts') === 16);
		ok(model.get('birthday').getTime() === birthday.getTime());
	});

	test('Creating an object inserts the correct defaults', function() {
		expect(1);

		var model = TestModel.createRecord({
			name: 'Bob',
			birthday: null
		});

		ok(model.get('posts') === 0);
	});

	test('Creating an object with a missing required property throws', function() {
		expect(1);

		throws(function() {
			TestModel.createRecord({
				name: 'Bob'
			});
		});
	});

	test('Creating an object with an invalid property value throws', function() {
		expect(1);

		throws(function() {
			TestModel.createRecord({
				name: 'Bob',
				birthday: new Date(new Date().getTime() + 5000)
			});
		});
	});

	test('Setting attributes sets them correctly', function() {
		expect(2);

		var model = TestModel.createRecord({
			name: 'Bob',
			posts: 18,
			birthday: new Date()
		});

		model.set('posts', 42);
		ok(model.get('posts') === 42);

		model.set('birthday', null);
		ok(model.get('birthday') === null);
	});

	test('Setting a read-only property throws', function() {
		expect(1);

		var model = TestModel.createRecord({
			name: 'Bob',
			birthday: new Date()
		});

		throws(function() {
			model.set('name', '');
		});
	});

	test('Setting an invalid property fails', function() {
		expect(1);

		var birthday = new Date();
		var model = TestModel.createRecord({
			name: 'Bob',
			birthday: birthday
		});


		model.set('birthday', new Date('2020-01-01'));
		ok(model.get('birthday').getTime() === birthday.getTime());
	});

	test('Setting value to undefined fails', function() {
		expect(2);

		var model = TestModel.createRecord({
			name: 'Bob',
			birthday: null
		});

		ok(model.set('posts', undefined));
		ok(model.get('posts') === 0);
	});

	test('Getting changed attributes returns the correct values', function() {
		expect(4);

		var birthday = new Date();
		var model = TestModel.createRecord({
			name: 'Bob',
			birthday: birthday
		});

		model.set('posts', 25);
		model.set('birthday', null);

		var changed = model.changedAttributes();

		ok(changed.posts[0] === 0);
		ok(changed.posts[1] === 25);
		ok(changed.birthday[0].getTime() === birthday.getTime());
		ok(changed.birthday[1] === null);
	});

	test('Rolling back attributes works correctly', function() {
		expect(3);

		var model = TestModel.createRecord({
			name: 'Bob',
			birthday: null
		});

		model.set('posts', 25);
		model.set('birthday', new Date());
		model.rollbackAttributes();

		var changed = model.changedAttributes();

		ok(Em.keys(changed).length === 0);
		ok(model.get('posts') === 0);
		ok(model.get('birthday') === null);
	});
})();

