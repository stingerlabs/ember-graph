(function() {
	'use strict';

	var Promise = Em.RSVP.Promise;
	var store, adapter;
	var data = {
		manufacturers: {
			vw: { id: '1', name: 'Volkswagen', cars: ['1', '2'] },
			ford: { id: '2', name: 'Ford', cars: ['3', '4'] },
			nissan: { id: '3', name: 'Nissan', cars: [] }
		},
		cars: {
			jetta: { id: '1', model: 'Jetta', color: 'red', year: 2014, manufacturer: '1'},
			rabbit: { id: '2', model: 'Rabbit', color: 'black', year: 2008, manufacturer: '1'},
			f150: { id: '3', model: 'F150', color: 'red', year: 2009, manufacturer: '2'},
			edge: { id: '4', model: 'Edge', color: 'silver', year: 2013, manufacturer: '2'}
		},
		people: {
			// http://xkcd.com/1323/
			alice: { id: '1', cars: ['1'], favoriteManufacturer: '1' },
			bob: { id: '2', cars: ['3', '4'], favoriteManufacturer: '2' },
			carol: { id: '3', cars: ['2'], favoriteManufacturer: '1' }
		}
	};

	module('LocalStorage Adapter', {
		setup: function() {
			store = setupStore({
				manufacturer: EG.Model.extend({
					name: EG.attr({ type: 'string' }),

					cars: EG.hasMany({
						relatedType: 'car',
						inverse: 'manufacturer'
					})
				}),

				car: EG.Model.extend({
					model: EG.attr({ type: 'string' }),
					color: EG.attr({ type: 'string', defaultValue: 'silver' }),
					year: EG.attr({ type: 'number' }),

					manufacturer: EG.hasOne({
						relatedType: 'manufacturer',
						inverse: 'cars'
					})
				}),

				person: EG.Model.extend({
					cars: EG.hasMany({
						relatedType: 'car',
						inverse: null
					}),

					favoriteManufacturer: EG.hasOne({
						relatedType: 'manufacturer',
						inverse: null
					})
				})
			}, { adapter: EG.LocalStorageAdapter });

			adapter = store.get('adapter');
			adapter.clearData();

			localStorage['records.manufacturer.1'] = JSON.stringify(data.manufacturers.vw);
			localStorage['records.manufacturer.2'] = JSON.stringify(data.manufacturers.ford);
			localStorage['records.manufacturer.3'] = JSON.stringify(data.manufacturers.nissan);

			localStorage['records.car.1'] = JSON.stringify(data.cars.jetta);
			localStorage['records.car.2'] = JSON.stringify(data.cars.rabbit);
			localStorage['records.car.3'] = JSON.stringify(data.cars.f150);
			localStorage['records.car.4'] = JSON.stringify(data.cars.edge);

			localStorage['records.person.1'] = JSON.stringify(data.people.alice);
			localStorage['records.person.2'] = JSON.stringify(data.people.bob);
			localStorage['records.person.3'] = JSON.stringify(data.people.carol);
		}
	});

	asyncTest('Find records', function() {
		expect(2);

		var vw = adapter.findRecord('manufacturer', '1');
		var jetta = adapter.findRecord('car', '1');

		Promise.all([vw, jetta]).then(function(resolvedData) {
			start();
			deepEqual(resolvedData[0], { manufacturers: [data.manufacturers.vw] });
			deepEqual(resolvedData[1], { cars: [data.cars.jetta] });
		});
	});
})();