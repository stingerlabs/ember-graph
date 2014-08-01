Em.Application.initializer({
	name: 'EmberGraph',

	initialize: function(container, App) {
		App.register('store:main', App.Store || EG.Store, { singleton: true });

		App.register('adapter:rest', EG.RESTAdapter, { singleton: true });
		App.register('adapter:local_storage', EG.LocalStorageAdapter, { singleton: true });

		App.register('serializer:json', EG.JSONSerializer, { singleton: true });

		App.register('type:string', EG.StringType, { singleton: true });
		App.register('type:number', EG.NumberType, { singleton: true });
		App.register('type:boolean', EG.BooleanType, { singleton: true });
		App.register('type:date', EG.DateType, { singleton: true });
		App.register('type:object', EG.ObjectType, { singleton: true });
		App.register('type:array', EG.ArrayType, { singleton: true });

		App.inject('controller', 'store', 'store:main');
		App.inject('route', 'store', 'store:main');
		App.inject('adapter', 'store', 'store:main');
		App.inject('serializer', 'store', 'store:main');

		var store = container.lookup('store:main');
		App.set('store', store);
	}
});