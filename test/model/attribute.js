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

					birthday: EG.attr('date')
				})
			});
		}
	});

	test('The class properly detects every attribute (and only those attributes)', function() {
		expect(1);

		var TestModel = store.modelFor('test');
		var expectedAttributes = EG.Set.create();
		expectedAttributes.addObjects(['name', 'posts', 'birthday']);

		ok(Em.get(TestModel, 'attributes').isEqual(expectedAttributes));
	});

	test('The class knows which properties are attributes', function() {
		expect(3);

		var TestModel = store.modelFor('test');

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

	test('Creating an object leaves attributes uninitialized', function() {
		expect(3);

		var model = store.createRecord('test');
		ok(!model.isAttributeInitialized('name'));
		ok(!model.isAttributeInitialized('posts'));
		ok(!model.isAttributeInitialized('birthday'));
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

	test('Setting a read-only property on a saved record throws', function() {
		expect(1);

		store.pushPayload({
			test: [{
				id: '50',
				name: 'Bob',
				birthday: new Date(),
				posts: 10
			}]
		});

		var model = store.getRecord('test', '50');

		throws(function() {
			model.set('name', '');
		});
	});

	test('Setting a read-only property on a new record doesn\'t throw', function() {
		expect(1);

		var model = store.createRecord('test', {
			name: 'Bob',
			birthday: new Date()
		});

		model.set('name', 'Robert');
		strictEqual(model.get('name'), 'Robert');
	});

	test('Setting value to undefined fails', function() {
		expect(1);

		var model = store.createRecord('test', {
			name: 'Bob',
			birthday: null,
			posts: 0
		});

		model.set('posts', undefined);
		ok(model.get('posts') === 0);
	});

	test('Getting changed attributes returns the correct values', function() {
		expect(4);

		var birthday = new Date();
		store.pushPayload({
			test: [{
				id: '500',
				name: 'Bob',
				birthday: birthday
			}]
		});
		var model = store.getRecord('test', '500');

		model.set('posts', 25);
		model.set('birthday', null);

		var changed = model.changedAttributes();

		strictEqual(changed.posts[0], 0);
		strictEqual(changed.posts[1], 25);
		strictEqual(changed.birthday[0].getTime(), birthday.getTime());
		strictEqual(changed.birthday[1], null);
	});

	test('Getting changed attributes doesn\'t include extra values', function() {
		expect(3);

		var birthday = new Date();
		store.pushPayload({
			test: [{
				id: '500',
				name: 'Bob',
				birthday: birthday
			}]
		});
		var model = store.getRecord('test', '500');

		model.set('posts', 25);

		var changed = model.changedAttributes();

		deepEqual(Object.keys(changed), ['posts']);
		strictEqual(changed.posts[0], 0);
		strictEqual(changed.posts[1], 25);
	});

	test('Rolling back attributes works correctly', function() {
		expect(3);

		store.pushPayload({
			test: [{
				id: '500',
				name: 'Bob',
				birthday: null
			}]
		});
		var model = store.getRecord('test', '500');

		model.set('posts', 25);
		model.set('birthday', new Date());
		model.rollbackAttributes();

		var changed = model.changedAttributes();

		deepEqual(Object.keys(changed), []);
		strictEqual(model.get('posts'), 0);
		strictEqual(model.get('birthday'), null);
	});

	test('metaForAttribute returns the correct metadata', function() {
		expect(2);

		var TestModel = store.modelFor('test');
		var meta = TestModel.metaForRelationship('name');

		strictEqual(meta.isAttribute, true);
		strictEqual(meta.isRequired, true);
	});

	test('Setting attributes dirties the record (old record)', function() {
		expect(2);

		store.pushPayload({
			test: [{
				id: '500',
				name: 'Bob',
				birthday: null
			}]
		});
		var model = store.getRecord('test', '500');

		strictEqual(model.get('isDirty'), false);

		model.set('posts', 42);
		model.set('birthday', null);

		strictEqual(model.get('isDirty'), true);
	});

	test('Rolling back attributes cleans the record', function() {
		expect(3);

		store.pushPayload({
			test: [{
				id: '500',
				name: 'Bob',
				birthday: new Date()
			}]
		});
		var model = store.getRecord('test', '500');

		strictEqual(model.get('isDirty'), false);

		model.set('posts', 42);
		model.set('birthday', null);

		strictEqual(model.get('isDirty'), true);

		model.rollbackAttributes();

		strictEqual(model.get('isDirty'), false);
	});
})();

