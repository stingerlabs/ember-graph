(function() {
	'use strict';

	var forEach = Em.ArrayPolyfills.forEach;

	var Promise = Em.RSVP.Promise;
	var store, adapter;
	var data = {
		manufacturers: {
			vw: { id: '1', name: 'Volkswagen', links: { cars: ['1', '2'] } },
			ford: { id: '2', name: 'Ford', links: { cars: ['3', '4'] } },
			nissan: { id: '3', name: 'Nissan', links: { cars: [] } }
		},
		cars: {
			jetta: { id: '1', model: 'Jetta', color: 'red', year: 2014, links: { manufacturer: '1' } },
			rabbit: { id: '2', model: 'Rabbit', color: 'black', year: 2008, links: { manufacturer: '1' } },
			f150: { id: '3', model: 'F150', color: 'red', year: 2009, links: { manufacturer: '2' } },
			edge: { id: '4', model: 'Edge', color: 'silver', year: 2013, links: { manufacturer: '2' } }
		},
		people: {
			// http://xkcd.com/1323/
			alice: { id: '1', links: { cars: ['1'], favoriteManufacturer: '1' } },
			bob: { id: '2', links: { cars: ['3', '4'], favoriteManufacturer: '2' } },
			carol: { id: '3', links: { cars: ['2'], favoriteManufacturer: '1' } }
		}
	};

	var cloneJson = function(json) {
		return JSON.parse(JSON.stringify(json));
	};

	var flattenLinks = function(json) {
		json = cloneJson(json);

		forEach.call(Em.keys(json.links), function(linkName) {
			json[linkName] = json.links[linkName];
		});

		delete json.links;

		return json;
	};

	var sortById = function(a, b) {
		return (a.id < b.id ? -1 : 1);
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

	asyncTest('Find record', function() {
		expect(2);

		var vw = adapter.findRecord('manufacturer', '1');
		var jetta = adapter.findRecord('car', '1');

		Promise.all([vw, jetta]).then(function(payloads) {
			start();
			deepEqual(payloads[0].manufacturers[0], flattenLinks(data.manufacturers.vw));
			deepEqual(payloads[1].cars[0], flattenLinks(data.cars.jetta));
		});
	});

	asyncTest('Find all records', function() {
		expect(1);

		adapter.findAll('car').then(function(payload) {
			start();

			var expected = [flattenLinks(data.cars.jetta), flattenLinks(data.cars.rabbit),
				flattenLinks(data.cars.f150), flattenLinks(data.cars.edge)].sort(sortById);
			deepEqual(payload.cars.sort(sortById), expected);
		});
	});

	asyncTest('Create record 1', function() {
		expect(5);

		var id;
		var car = store.createRecord('car', {
			model: 'Passat',
			color: 'silver',
			year: 2000,

			manufacturer: '1'
		});

		adapter.createRecord(car).then(function(payload) {
			start();

			var passat = payload.cars[0];
			id = passat.id;

			strictEqual(passat.model, 'Passat');
			strictEqual(passat.color, 'silver');
			strictEqual(passat.year, 2000);
			strictEqual(passat.links.manufacturer, '1');

			stop();

			return adapter.findRecord('manufacturer', '1');
		}).then(function(payload) {
			start();

			deepEqual(payload.manufacturers[0].cars.sort(), data.manufacturers.vw.links.cars.concat(id).sort());
		});
	});

	asyncTest('Create record 2', function() {
		expect(6);

		var id;
		var manufacturer = store.createRecord('manufacturer', {
			name: 'Wal-Mart',
			cars: ['1', '2', '3', '4']
		});

		adapter.createRecord(manufacturer).then(function(payload) {
			start();

			var walmart = payload.manufacturers[0];
			id = walmart.id;

			strictEqual(walmart.name, 'Wal-Mart');
			deepEqual(walmart.links.cars.sort(), ['1', '2', '3', '4'].sort());

			stop();

			return adapter.findMany('car', ['1', '2', '3', '4']);
		}).then(function(payload) {
			start();

			strictEqual(payload.cars[0].manufacturer, id);
			strictEqual(payload.cars[1].manufacturer, id);
			strictEqual(payload.cars[2].manufacturer, id);
			strictEqual(payload.cars[3].manufacturer, id);
		});
	});

	asyncTest('Create record 3', function() {
		expect(2);

		var person = store.createRecord('person', {
			favoriteManufacturer: '2',
			cars: ['1', '4']
		});

		adapter.createRecord(person).then(function(payload) {
			start();

			var sideshowBob = payload.people[0];

			strictEqual(sideshowBob.links.favoriteManufacturer, '2');
			deepEqual(sideshowBob.links.cars.sort(), ['1', '4'].sort());
		});
	});
})();