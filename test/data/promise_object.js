(function() {
	'use strict';

	var store;

	module('Promise Object Tests', {
		setup: function() {
			store = setupStore({
				tag: EG.Model.extend({
					name: EG.attr({
						type: 'string'
					})
				})
			});

			store._loadRecord('tag', { id: '1', name: 'tag1' });
			store._loadRecord('tag', { id: '2', name: 'tag2' });
			store._loadRecord('tag', { id: '3', name: 'tag3' });
			store._loadRecord('tag', { id: '4', name: 'tag4' });
		}
	});

	asyncTest('Model promise object correctly reports the ID', function() {
		expect(4);

		var resolve = null;
		var modelPromise = EG.ModelPromiseObject.create({
			id: '1',
			promise: new Em.RSVP.Promise(function(r) {
				resolve = r;
			})
		});

		start();
		strictEqual(modelPromise.get('id'), '1');
		strictEqual(modelPromise.get('name'), undefined);
		stop();

		resolve(store.getRecord('tag', '1'));

		modelPromise.then(function() {
			start();
			strictEqual(modelPromise.get('id'), '1');
			strictEqual(modelPromise.get('name'), 'tag1');
		});
	});

	asyncTest('Model promise array correctly reports the IDs', function() {
		expect(4);

		var ids = ['1', '2', '3', '4'];

		var resolve = null;
		var modelPromise = EG.ModelPromiseArray.create({
			ids: ids,
			promise: new Em.RSVP.Promise(function(r) {
				resolve = r;
			})
		});

		start();
		deepEqual(modelPromise.mapBy('id'), ['1', '2', '3', '4']);
		deepEqual(modelPromise.mapBy('name'), [undefined, undefined, undefined, undefined]);
		stop();

		resolve(ids.map(function(id) {
			return store.getRecord('tag', id);
		}));

		modelPromise.then(function() {
			start();
			deepEqual(modelPromise.mapBy('id'), ['1', '2', '3', '4']);
			deepEqual(modelPromise.mapBy('name'), ['tag1', 'tag2', 'tag3', 'tag4']);
		});
	});
})();

