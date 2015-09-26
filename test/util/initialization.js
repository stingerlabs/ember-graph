(function() {
	'use strict';

	var App;

	module('Initializer Test', {
		teardown: function() {
			App.destroy();
		}
	});

	asyncTest('Store is on application instance', 1, function() {
		Ember.onLoad('Ember.Application', function(Application) {
			App = Application.create({
				rootElement: '#test-app',
				ready: function() {
					start();
					ok(App.store instanceof EmberGraph.Store);
				}
			});
		});
	});

	asyncTest('Store is available as store:main', 1, function() {
		Ember.onLoad('Ember.Application', function(Application) {
			App = Application.create({
				rootElement: '#test-app',
				ready: function() {
					start();

					var container = this.__container__;
					ok(container.lookup('store:main') instanceof EmberGraph.Store);
				}
			});
		});
	});

	if (Ember.Service) {
		asyncTest('Store is available as service:store', 1, function() {
			Ember.onLoad('Ember.Application', function(Application) {
				App = Application.create({
					rootElement: '#test-app',
					ready: function() {
						start();

						var container = this.__container__;
						ok(container.lookup('service:store') instanceof EmberGraph.Store);
					}
				});
			});
		});
	}
})();
