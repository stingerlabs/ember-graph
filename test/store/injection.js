(function() {
	'use strict';

	module('Store Injection Test');

	asyncTest('The store is injected into the application correctly', function() {
		expect(1);

		Ember.Application.create({
			ready: function() {
				start();
				ok(!!this.get('store'));
			}
		});
	});
})();