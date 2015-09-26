import Ember from 'ember';
import EmberGraph from 'ember-graph';

Ember.onLoad('Ember.Application', function(Application) {
	Application.initializer({
		name: 'ember-graph',
		initialize(registry, application) {
			Ember.libraries.register('Ember Graph');

			const useService = !!Ember.Service;

			application.register('store:main', application.Store || EmberGraph.Store);

			if (useService) {
				application.register('service:store', application.Store || EmberGraph.Store);
			}

			application.register('adapter:rest', EmberGraph.RESTAdapter);
			application.register('adapter:memory', EmberGraph.MemoryAdapter);
			application.register('adapter:local_storage', EmberGraph.LocalStorageAdapter);

			application.register('serializer:json', EmberGraph.JSONSerializer);
			application.register('serializer:ember_graph', EmberGraph.EmberGraphSerializer);

			application.register('type:string', EmberGraph.StringType);
			application.register('type:number', EmberGraph.NumberType);
			application.register('type:boolean', EmberGraph.BooleanType);
			application.register('type:date', EmberGraph.DateType);
			application.register('type:object', EmberGraph.ObjectType);
			application.register('type:array', EmberGraph.ArrayType);

			application.inject('controller', 'store', 'store:main');
			application.inject('route', 'store', 'store:main');
			application.inject('adapter', 'store', 'store:main');
			application.inject('serializer', 'store', 'store:main');

			if (useService) {
				application.inject('controller', 'store', 'service:store');
				application.inject('route', 'store', 'service:store');
				application.inject('adapter', 'store', 'service:store');
				application.inject('serializer', 'store', 'service:store');
			}

			if (EmberGraph.DataAdapter) {
				application.register('data-adapter:main', EmberGraph.DataAdapter);
				application.inject('data-adapter', 'store', 'store:main');
			}
		}
	});

	if (Application.instanceInitializer) {
		Application.instanceInitializer({
			name: 'ember-graph',
			initialize(instance) {
				const application = instance.container.lookup('application:main');
				const store = instance.container.lookup('store:main');
				application.set('store', store);
			}
		});
	} else {
		Application.initializer({
			name: 'ember-graph-store',
			initialize(container, application) {
				const store = container.lookup('store:main');
				application.set('store', store);
			}
		});
	}
});