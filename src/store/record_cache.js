var forEach = Em.ArrayPolyfills.forEach;

EG.RecordCache = Em.Object.extend({

	cacheTimeout: Infinity,

	records: {},

	liveRecordArrays: {},

	init: function(cacheTimeout) {
		this.setProperties({
			cacheTimeout: (typeof cacheTimeout === 'number' ? cacheTimeout : Infinity),
			records: {},
			liveRecordArrays: {}
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
		if (EG.PromiseObject.detectInstance(record)) {
			record = record.getModel();
		}

		var typeKey = record.get('typeKey');

		var records = this.get('records');
		records[typeKey + ':' + record.get('id')] = {
			record: record,
			timestamp: (new Date()).getTime()
		};

		var liveRecordArrays = this.get('liveRecordArrays');
		liveRecordArrays[typeKey] = liveRecordArrays[typeKey] || Em.A();
		if (!liveRecordArrays[typeKey].contains(record)) {
			liveRecordArrays[typeKey].addObject(record);
		}
	},

	deleteRecord: function(typeKey, id) {
		var records = this.get('records');
		delete records[typeKey + ':' + id];
	},

	getLiveRecordArray: function(typeKey) {
		var liveRecordArrays = this.get('liveRecordArrays');
		liveRecordArrays[typeKey] = liveRecordArrays[typeKey] || Em.A();
		return liveRecordArrays[typeKey];
	}

});