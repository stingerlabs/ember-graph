import Ember from 'ember';

import { PromiseObject } from 'ember-graph/data/promise_object';
import { computed } from 'ember-graph/util/computed';


export default Ember.Object.extend({

	cacheTimeout: computed('_cacheTimeout', {
		get() {
			return this.get('_cacheTimeout');
		},
		set(key, value) {
			this.set('_cacheTimeout', typeof value === 'number' ? value : Infinity);
		}
	}),

	records: {},

	liveRecordArrays: {},

	init() {
		this.setProperties({
			_cacheTimeout: Infinity,
			records: {},
			liveRecordArrays: {}
		});
	},

	getRecord(typeKey, id) {
		const key = `${typeKey}:${id}`;
		const records = this.get('records');

		if (records[key] && records[key].timestamp >= (new Date()).getTime() - this.get('cacheTimeout')) {
			return records[key].record;
		}

		return null;
	},

	getRecords(typeKey) {
		const records = this.get('records');
		const found = [];
		const cutoff = (new Date()).getTime() - this.get('cacheTimeout');

		Object.keys(records).forEach((key) => {
			if (key.indexOf(typeKey) === 0 && records[key].timestamp >= cutoff) {
				found.push(records[key].record);
			}
		});

		return found;
	},

	storeRecord(record) {
		if (PromiseObject.detectInstance(record)) {
			record = record.getModel();
		}

		const typeKey = record.get('typeKey');

		const records = this.get('records');
		records[`${typeKey}:${record.get('id')}`] = {
			record,
			timestamp: (new Date()).getTime()
		};

		const liveRecordArrays = this.get('liveRecordArrays');
		liveRecordArrays[typeKey] = liveRecordArrays[typeKey] || Ember.A();
		if (!liveRecordArrays[typeKey].contains(record)) {
			liveRecordArrays[typeKey].addObject(record);
		}
	},

	deleteRecord(typeKey, id) {
		const records = this.get('records');
		delete records[`${typeKey}:${id}`];
	},

	getLiveRecordArray(typeKey) {
		const liveRecordArrays = this.get('liveRecordArrays');
		liveRecordArrays[typeKey] = liveRecordArrays[typeKey] || Ember.A();
		return liveRecordArrays[typeKey];
	}

});