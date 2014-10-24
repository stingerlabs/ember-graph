(function() {
	'use strict';

	window.setupStore = function(models, options, store) {
		options = options || {};

		var container = new Em.Container();
		container.register('adapter:rest', EG.RESTAdapter, { singleton: true });
		container.register('adapter:memory', EG.MemoryAdapter, { singleton: true });
		container.register('adapter:local_storage', EG.LocalStorageAdapter, { singleton: true });

		container.register('serializer:json', EG.JSONSerializer, { singleton: true });
		container.register('serializer:ember_graph', EG.EmberGraphSerializer, { singleton: true });

		container.register('type:string', EG.StringType, { singleton: true });
		container.register('type:number', EG.NumberType, { singleton: true });
		container.register('type:boolean', EG.BooleanType, { singleton: true });
		container.register('type:date', EG.DateType, { singleton: true });
		container.register('type:object', EG.ObjectType, { singleton: true });
		container.register('type:array', EG.ArrayType, { singleton: true });

		container.register('store:main', store || EG.Store, { singleton: true });
		store = container.lookup('store:main');

		container.injection('adapter', 'store', 'store:main');
		container.injection('serializer', 'store', 'store:main');

		if (options.adapter) {
			container.register('adapter:application', options.adapter, { singleton: true });
		}

		Em.keys(models || {}).forEach(function(typeKey) {
			container.register('model:' + typeKey, models[typeKey]);
			// Load the model to set the 'typeKey' attributes on it
			store.modelFor(typeKey);
		});

		return store;
	};
})();