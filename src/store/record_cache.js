var forEach = Em.ArrayPolyfills.forEach;

// TODO: Need tests
EG.RecordCache = Em.Object.extend({

	cacheTimeout: Infinity,

	records: {},

	init: function(cacheTimeout) {
		this.setProperties({
			cacheTimeout: cacheTimeout,
			records: {}
		});
	},

	getRecord: function(typeKey, id) {
		var key = typeKey + ':' + id;
		var records = this.get('records');

		if (records[key] && records[key].timestamp >= (new Date()).getTime() - this.get('cacheTimeout')) {
			return records[key].record;
		}

		return null;
	},

	getRecords: function(typeKey) {
		var records = this.get('records');
		var found = [];
		var cutoff = (new Date()).getTime() - this.get('cacheTimeout');

		forEach.call(Em.keys(records), function(key) {
			if (key.indexOf(typeKey) === 0 && records[key].timestamp >= cutoff) {
				found.push(records[key].record);
			}
		});

		return found;
	},

	storeRecord: function(record) {
		var records = this.get('records');

		records[record.typeKey + ':' + record.get('id')] = {
			record: record,
			timestamp: (new Date()).getTime()
		};
	},

	deleteRecord: function(typeKey, id) {
		var records = this.get('records');
		delete records[typeKey + ':' + id];
	}

});