(function() {
	'use strict';

	window.setupStore = function(models, options, store) {
		options = options || {};

		var container;
		var registry;

		if (Ember.Registry) {
			registry = new Ember.Registry();
			container = registry.container();
		} else {
			container = new Ember.Container();
			registry = container;
		}

		registry.register('adapter:rest', EG.RESTAdapter, { singleton: true });
		registry.register('adapter:memory', EG.MemoryAdapter, { singleton: true });
		registry.register('adapter:local_storage', EG.LocalStorageAdapter, { singleton: true });

		registry.register('serializer:json', EG.JSONSerializer, { singleton: true });
		registry.register('serializer:ember_graph', EG.EmberGraphSerializer, { singleton: true });

		registry.register('type:string', EG.StringType, { singleton: true });
		registry.register('type:number', EG.NumberType, { singleton: true });
		registry.register('type:boolean', EG.BooleanType, { singleton: true });
		registry.register('type:date', EG.DateType, { singleton: true });
		registry.register('type:object', EG.ObjectType, { singleton: true });
		registry.register('type:array', EG.ArrayType, { singleton: true });

		registry.register('store:main', store || EG.Store, { singleton: true });
		store = container.lookup('store:main');

		registry.injection('adapter', 'store', 'store:main');
		registry.injection('serializer', 'store', 'store:main');

		if (options.adapter) {
			registry.register('adapter:application', options.adapter, { singleton: true });
		}

		Object.keys(models || {}).forEach(function(typeKey) {
			registry.register('model:' + typeKey, models[typeKey]);
			// Load the model to set the 'typeKey' attributes on it
			store.modelFor(typeKey);
		});

		store.__registry__ = registry;

		return store;
	};
})();