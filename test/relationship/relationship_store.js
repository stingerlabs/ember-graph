(function() {
	'use strict';

	var CLIENT_STATE = EG.Relationship.CLIENT_STATE;
	var SERVER_STATE = EG.Relationship.SERVER_STATE;
	var DELETED_STATE = EG.Relationship.DELETED_STATE;

	var Relationship = EG.Relationship;

	var store;

	module('Relationship Store Test', {
		setup: function() {
			store = EG.RelationshipStore.create();
		}
	});

	test('Add and fetch relationships', function() {
		expect(14);

		deepEqual(store.getCurrentRelationships('posts'), []);
		deepEqual(store.getServerRelationships('posts'), []);
		deepEqual(store.getCurrentRelationships('author'), []);
		deepEqual(store.getServerRelationships('author'), []);

		strictEqual(store.get('server.length'), 0);
		strictEqual(store.get('client.length'), 0);
		strictEqual(store.get('deleted.length'), 0);

		var r1 = Relationship.create('user', '1', 'posts', 'post', '1', 'author', SERVER_STATE);
		var r2 = Relationship.create('user', '1', 'posts', 'post', '2', 'author', SERVER_STATE);
		var r3 = Relationship.create('user', '1', 'posts', 'post', '3', 'author', DELETED_STATE);
		var r4 = Relationship.create('user', '1', 'posts', 'post', '4', 'author', CLIENT_STATE);
		var r5 = Relationship.create('user', '1', 'posts', 'post', '5', 'author', CLIENT_STATE);

		store.addRelationship('posts', r1);
		store.addRelationship('posts', r2);
		store.addRelationship('posts', r3);
		store.addRelationship('posts', r4);
		store.addRelationship('posts', r5);

		deepEqual(store.getCurrentRelationships('posts').mapBy('id').sort(), [r1, r2, r4, r5].mapBy('id').sort());
		deepEqual(store.getServerRelationships('posts').mapBy('id').sort(), [r1, r2, r3].mapBy('id').sort());
		deepEqual(store.getCurrentRelationships('author'), []);
		deepEqual(store.getServerRelationships('author'), []);

		strictEqual(store.get('server.length'), 2);
		strictEqual(store.get('client.length'), 2);
		strictEqual(store.get('deleted.length'), 1);
	});

	test('Remove relationships', function() {
		expect(13);

		var r1 = Relationship.create('user', '1', 'posts', 'post', '1', 'author', SERVER_STATE);
		var r2 = Relationship.create('user', '1', 'posts', 'post', '2', 'author', SERVER_STATE);
		var r3 = Relationship.create('user', '1', 'posts', 'post', '3', 'author', DELETED_STATE);
		var r4 = Relationship.create('user', '1', 'posts', 'post', '4', 'author', CLIENT_STATE);
		var r5 = Relationship.create('user', '1', 'posts', 'post', '5', 'author', CLIENT_STATE);

		store.addRelationship('posts', r1);
		store.addRelationship('posts', r2);
		store.addRelationship('posts', r3);
		store.addRelationship('posts', r4);
		store.addRelationship('posts', r5);

		strictEqual(store.get('server.length'), 2);
		strictEqual(store.get('client.length'), 2);
		strictEqual(store.get('deleted.length'), 1);

		store.removeRelationship(r1);
		store.removeRelationship(r4);

		strictEqual(store.get('server.length'), 1);
		strictEqual(store.get('client.length'), 1);
		strictEqual(store.get('deleted.length'), 1);

		deepEqual(store.getCurrentRelationships('posts').mapBy('id').sort(), [r2, r5].mapBy('id').sort());
		deepEqual(store.getServerRelationships('posts').mapBy('id').sort(), [r2, r3].mapBy('id').sort());

		store.clearRelationships('posts');

		deepEqual(store.getCurrentRelationships('posts'), []);
		deepEqual(store.getServerRelationships('posts'), []);

		strictEqual(store.get('server.length'), 0);
		strictEqual(store.get('client.length'), 0);
		strictEqual(store.get('deleted.length'), 0);
	});
})();