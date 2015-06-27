(function() {
	'use strict';

	var store;

	module('Relationship Reconnection Test', {
		setup: function() {
			store = setupStore({
				vertex: EG.Model.extend({
					parent: EG.hasOne({
						relatedType: 'vertex',
						inverse: 'children'
					}),
					children: EG.hasMany({
						relatedType: 'vertex',
						inverse: 'parent'
					})
				})
			}, {
				adapter: EG.MemoryAdapter.extend({
					shouldInitializeDatabase: function() {
						return true;
					},
					getInitialPayload: function() {
						return {
							vertex: [
								{
									id: '1',
									parent: null,
									children: [
										{ type: 'vertex', id: '2' },
										{ type: 'vertex', id: '3' }
									]
								},
								{
									id: '2',
									parent: { type: 'vertex', id: '1' },
									children: []
								},
								{
									id: '3',
									parent: { type: 'vertex', id: '1' },
									children: []
								}
							]
						};
					}
				})
			});
		}
	});

	asyncTest('Switch parent vertices (reloading the same relationship', 1, function() {
		store.find('vertex').then(function() {
			var vertex1 = store.getRecord('vertex', '1');
			var vertex2 = store.getRecord('vertex', '2');
			var vertex3 = store.getRecord('vertex', '3');

			vertex3.setHasOneRelationship('parent', vertex2);
			vertex3.save().then(function() {
				vertex3.setHasOneRelationship('parent', vertex1);
				return vertex3.save();
			}).then(function() {
				start();
				ok(true);
			}, function(e) {
				start();
				throw e;
			});
		});
	});
})();