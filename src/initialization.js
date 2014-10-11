Em.Application.initializer({
	name: 'EmberGraph',

	initialize: function(container, App) {
		App.register('store:main', App.Store || EG.Store);

		App.register('adapter:rest', EG.RESTAdapter);
		App.register('adapter:memory', EG.MemoryAdapter);
		App.register('adapter:local_storage', EG.LocalStorageAdapter);

		App.register('serializer:json', EG.JSONSerializer);
		App.register('serializer:ember_graph', EG.EmberGraphSerializer);

		App.register('type:string', EG.StringType);
		App.register('type:number', EG.NumberType);
		App.register('type:boolean', EG.BooleanType);
		App.register('type:date', EG.DateType);
		App.register('type:object', EG.ObjectType);
		App.register('type:array', EG.ArrayType);

		App.register('data-adapter:main', EG.DataAdapter);

		App.inject('controller', 'store', 'store:main');
		App.inject('route', 'store', 'store:main');
		App.inject('adapter', 'store', 'store:main');
		App.inject('serializer', 'store', 'store:main');
		App.inject('data-adapter', 'store', 'store:main');

		var store = container.lookup('store:main');
		App.set('store', store);
	}
});