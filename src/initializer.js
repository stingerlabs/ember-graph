import Ember from 'ember';
import EmberGraph from 'ember-graph';

Ember.Application.initializer({
	name: 'Ember Graph',

	initialize: function(container, App) {
		Ember.libraries.register('Ember Graph');

		App.register('store:main', App.Store || EmberGraph.Store);

		App.register('adapter:rest', EmberGraph.RESTAdapter);
		App.register('adapter:memory', EmberGraph.MemoryAdapter);
		App.register('adapter:local_storage', EmberGraph.LocalStorageAdapter);

		App.register('serializer:json', EmberGraph.JSONSerializer);
		App.register('serializer:ember_graph', EmberGraph.EmberGraphSerializer);

		App.register('type:string', EmberGraph.StringType);
		App.register('type:number', EmberGraph.NumberType);
		App.register('type:boolean', EmberGraph.BooleanType);
		App.register('type:date', EmberGraph.DateType);
		App.register('type:object', EmberGraph.ObjectType);
		App.register('type:array', EmberGraph.ArrayType);

		App.register('data-adapter:main', EmberGraph.DataAdapter);

		App.inject('controller', 'store', 'store:main');
		App.inject('route', 'store', 'store:main');
		App.inject('adapter', 'store', 'store:main');
		App.inject('serializer', 'store', 'store:main');
		App.inject('data-adapter', 'store', 'store:main');

		var store = container.lookup('store:main');
		App.set('store', store);
	}
});