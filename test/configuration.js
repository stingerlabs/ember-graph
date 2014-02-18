(function() {
	'use strict';

	window.setupStore = function(models, options, store) {
		options = options || {};

		var container = new Em.Container();
		container.register('adapter:rest', EG.RESTAdapter, { singleton: true });
		container.register('adapter:fixture', EG.FixtureAdapter, { singleton: true });
		container.register('serializer:json', EG.JSONSerializer, { singleton: true });

		container.register('store:main', store || EG.Store, { singleton: true });
		store = container.lookup('store:main');

		container.injection('adapter', 'store', 'store:main');
		container.injection('serializer', 'store', 'store:main');

		if (options.adapter) {
			container.register('adapter:application', options.adapter, { singleton: true });
			container.lookup('adapter:application');
		}

		Em.keys(models || {}).forEach(function(typeKey) {
			container.register('model:' + typeKey, models[typeKey]);
			// Load the model to set the 'typeKey' attributes on it
			store.modelForType(typeKey);
		});

		return store;
	};
})();