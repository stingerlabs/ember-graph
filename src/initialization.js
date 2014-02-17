Ember.onLoad('Ember.Application', function(Application) {
	Application.initializer({
		name: 'store',

		initialize: function(container, App) {
			App.register('store:main', App.Store || Eg.Store);
			container.lookup('store:main');
		}
	});

	Application.initializer({
		name: 'injectStore',
		before: 'store',

		initialize: function(container, App) {
			App.inject('controller', 'store', 'store:main');
			App.inject('route', 'store', 'store:main');
			// TODO: Use this to inject store into other items (adapters, serializers, models)
		}
	});
});