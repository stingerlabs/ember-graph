import Ember from 'ember';
import Model from 'ember-graph/model/model';

import { computed } from 'ember-graph/util/computed';


/**
 * Extends Ember's `DataAdapter` class to provide debug functionality for the Ember Inspector.
 *
 * Thanks to the Ember-Data team for the reference implementation.
 *
 * @class DataAdapter
 * @private
 */
const EmberGraphDataAdapter = Ember.DataAdapter && Ember.DataAdapter.extend({

	containerDebugAdapter: computed({
		get() {
			return this.get('container').lookup('container-debug-adapter:main');
		}
	}),

	getFilters: function() {
		return [
			{ name: 'isNew', desc: 'New' },
			{ name: 'isModified', desc: 'Modified' },
			{ name: 'isClean', desc: 'Clean' }
		];
	},

	detect: function(modelClass) {
		return (modelClass !== Model && Model.detect(modelClass));
	},

	columnsForType: function(modelClass) {
		var attributeLimit = this.get('attributeLimit');
		var columns = [{ name: 'id', desc: 'Id' }];

		modelClass.eachAttribute(function(name, meta) {
			if (columns.length > attributeLimit) {
				return;
			}

			var desc = Ember.String.capitalize(Ember.String.underscore(name).replace(/_/g, ' '));
			columns.push({ name: name, desc: desc });
		});

		return columns;
	},

	getRecords: function(modelClass) {
		var typeKey = Ember.get(modelClass, 'typeKey');
		return this.get('store').getLiveRecordArray(typeKey);
	},

	getRecordColumnValues: function(record) {
		var values = { id: record.get('id') };

		record.constructor.eachAttribute(function(name, meta) {
			values[name] = record.get(name);
		});

		return values;
	},

	getRecordKeywords: function(record) {
		var keywords = [];

		record.constructor.eachAttribute(function(name) {
			keywords.push(record.get(name) + '');
		});

		return keywords;
	},

	getRecordFilterValues: function(record) {
		var isNew = record.get('isNew');
		var isDirty = record.get('isDirty');

		return {
			isNew: isNew,
			isModified: isDirty && !isNew,
			isClean: !isDirty
		};
	},

	getRecordColor: function(record) {
		if (record.get('isNew')) {
			return 'green';
		} else if (record.get('isDirty')) {
			return 'blue';
		} else {
			return 'black';
		}
	},

	observeRecord: function(record, recordUpdated) {
		var releaseMethods = Ember.A();
		var propertiesToObserve = Ember.A(['id', 'isNew', 'isDirty']);

		propertiesToObserve.addObjects(Ember.get(record.constructor, 'attributes').toArray());

		propertiesToObserve.forEach((name) => {
			var handler = () => this.wrapRecord(record);

			Ember.addObserver(record, name, handler);

			releaseMethods.push(() => Ember.removeObserver(record, name, handler));
		});

		return function() {
			releaseMethods.forEach((release) => release());
		};
	}
});

const DataAdapter = (Ember.DataAdapter ? EmberGraphDataAdapter : null);

export default DataAdapter;