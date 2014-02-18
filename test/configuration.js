(function() {
	'use strict';

	window.setupStore = function(options, models) {
		var store = EG.Store.extend(options || {}).create();
		var container = new Em.Container();
		store.set('container', container);
		container.register('store:main', store);

		Em.keys(models || {}).forEach(function(typeKey) {
			container.register('model:' + typeKey, models[typeKey]);
			// Load the model to set the 'typeKey' attributes on it
			store.modelForType(typeKey);
		});

		return store;
	};
})();