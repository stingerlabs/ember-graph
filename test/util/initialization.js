(function() {
	'use strict';

	module('Initializer Test');

	asyncTest('Store is on application instance', 1, function() {
		Ember.onLoad('Ember.Application', function(Application) {
			var App = Application.create({
				ready: function() {
					start();
					ok(App.store instanceof EmberGraph.Store);
				}
			});
		});
	});
})();
