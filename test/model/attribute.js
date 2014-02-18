(function() {
	'use strict';

	var store;

	module('Model Attribute Test', {
		setup: function() {
			store = setupStore({
				test: EG.Model.extend({
					name: EG.attr({
						type: 'string',
						readOnly: true
					}),

					posts: EG.attr({
						type: 'number',
						defaultValue: 0
					}),

					birthday: EG.attr({
						type: 'date'
					})
				})
			});
		}
	});

	test('The class properly detects every attribute (and only those attributes)', function() {
		expect(1);

		var TestModel = store.modelForType('test');
		var expectedAttributes = new Em.Set(['name', 'posts', 'birthday']);

		ok(Em.get(TestModel, 'attributes').isEqual(expectedAttributes));
	});

	test('The class knows which properties are attributes', function() {
		expect(3);

		var TestModel = store.modelForType('test');

		ok(TestModel.isAttribute('name'));
		ok(!TestModel.isAttribute('foofoo'));
		ok(!TestModel.isAttribute('POSTS'));
	});

	test('Creating an object loads the attributes correctly', function() {
		expect(3);

		var birthday = new Date('1970-01-01');
		var model = store.createRecord('test', {
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

		var model = store.createRecord('test', {
			name: 'Bob',
			birthday: null
		});

		ok(model.get('posts') === 0);
	});

	if (window.DEBUG_MODE === true) {
		test('Creating an object with a missing required property throws', function() {
			expect(1);

			throws(function() {
				store.createRecord('test', {
					name: 'Bob'
				});
			});
		});

		test('Creating an object with an invalid property value throws', function() {
			expect(1);

			throws(function() {
				store.createRecord('test', {
					name: 'Bob',
					birthday: 52
				});
			});
		});
	}

	test('Setting attributes sets them correctly', function() {
		expect(2);

		var model = store.createRecord('test', {
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

		var model = store.createRecord('test', {
			name: 'Bob',
			birthday: new Date()
		});

		throws(function() {
			model.set('name', '');
		});
	});

	test('Setting an invalid property value fails', function() {
		expect(1);

		var birthday = new Date();
		var model = store.createRecord('test', {
			name: 'Bob',
			birthday: birthday
		});

		model.set('birthday', 42);
		ok(model.get('birthday').getTime() === birthday.getTime());
	});

	test('Setting value to undefined fails', function() {
		expect(2);

		var model = store.createRecord('test', {
			name: 'Bob',
			birthday: null
		});

		ok(model.set('posts', undefined));
		ok(model.get('posts') === 0);
	});

	test('Getting changed attributes returns the correct values', function() {
		expect(4);

		var birthday = new Date();
		var model = store.createRecord('test', {
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

	test('Getting changed attributes doesn\'t include extra values', function() {
		expect(3);

		var birthday = new Date();
		var model = store.createRecord('test', {
			name: 'Bob',
			birthday: birthday
		});

		model.set('posts', 25);

		var changed = model.changedAttributes();

		ok(Em.keys(changed).length === 1);
		ok(changed.posts[0] === 0);
		ok(changed.posts[1] === 25);
	});

	test('Rolling back attributes works correctly', function() {
		expect(3);

		var model = store.createRecord('test', {
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

	test('metaForAttribute returns the correct metadata', function() {
		expect(2);

		var TestModel = store.modelForType('test');
		var meta = TestModel.metaForRelationship('name');

		ok(meta.isAttribute === true);
		ok(meta.isRequired === true);
	});

	test('Setting attributes dirties the record', function() {
		expect(2);

		var model = store.createRecord('test', {
			name: 'Bob',
			birthday: new Date()
		});

		ok(model.get('isDirty') === false);

		model.set('posts', 42);
		model.set('birthday', null);

		ok(model.get('isDirty') === true);
	});

	test('Rolling back attributes cleans the record', function() {
		expect(3);

		var model = store.createRecord('test', {
			name: 'Bob',
			birthday: new Date()
		});

		ok(model.get('isDirty') === false);

		model.set('posts', 42);
		model.set('birthday', null);

		ok(model.get('isDirty') === true);

		model.rollbackAttributes();

		ok(model.get('isDirty') === false);
	});
})();

