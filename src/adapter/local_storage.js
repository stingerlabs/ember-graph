var forEach = Ember.ArrayPolyfills.forEach;

/**
 * Provides a way to persist model data to the browser's local storage.
 *
 * @class LocalStorageAdapter
 * @extends SynchronousAdapter
 * @constructor
 */
EG.LocalStorageAdapter = EG.SynchronousAdapter.extend({

	retrieveRecord: function(typeKey, id) {
		var json = JSON.parse(localStorage['records.' + typeKey + '.' + id] || 'null');

		if (json) {
			return json;
		} else {
			throw new Error('The record `' + typeKey + ':' + id + '` wasn\'t found in localStorage.');
		}
	},

	retrieveRecords: function(typeKey, query) {
		Em.assert('The LocalStorageAdapter doesn\'t support queries by default.', !query);

		var record;
		var records = [];

		for (var key in localStorage) {
			if (localStorage.hasOwnProperty(key)) {
				if (EG.String.startsWith(key, 'records.' + typeKey)) {
					record = JSON.parse(localStorage(key) || 'null');

					if (record) {
						records.push(record);
					}
				}
			}
		}

		return records;
	},

	modifyRecords: function(updates) {
		forEach(updates, function(update) {
			update.oldData = localStorage['records.' + update.typeKey + '.' + update.id];
		});

		try {
			forEach(updates, function(update) {
				if (update.data) {
					localStorage['records.' + update.typeKey + '.' + update.id] = update.data;
				} else {
					delete localStorage['records.' + update.typeKey + '.' + update.id];
				}
			});
		} catch (e) {
			forEach(updates, function(update) {
				localStorage['records.' + update.typeKey + '.' + update.id] = '';
			});

			forEach(updates, function(update) {
				localStorage['records.' + update.typeKey + '.' + update.id] = update.oldData;
			});

			throw e;
		}
	}
});