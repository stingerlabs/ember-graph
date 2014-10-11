/**
 * Extends Ember's `DataAdapter` class to provide debug functionality for the Ember Inspector.
 *
 * Thanks to the Ember-Data team for the reference implementation.
 *
 * @class DataAdapter
 * @private
 */
EG.DataAdapter = Em.DataAdapter.extend({

	containerDebugAdapter: Em.computed(function() {
		return this.get('container').lookup('container-debug-adapter:main');
	}).property(),

	getFilters: function() {
		return [
			{ name: 'isNew', desc: 'New' },
			{ name: 'isModified', desc: 'Modified' },
			{ name: 'isClean', desc: 'Clean' }
		];
	},

	detect: function(modelClass) {
		return (modelClass !== EG.Model && EG.Model.detect(modelClass));
	},

	columnsForType: function(modelClass) {
		var attributeLimit = this.get('attributeLimit');
		var columns = [{ name: 'id', desc: 'Id' }];

		modelClass.eachAttribute(function(name, meta) {
			if (columns.length > attributeLimit) {
				return;
			}

			var desc = Em.String.capitalize(Em.String.underscore(name).replace(/_/g, ' '));
			columns.push({ name: name, desc: desc });
		});

		return columns;
	},

	getRecords: function(modelClass) {
		var typeKey = Em.get(modelClass, 'typeKey');
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
		var _this = this;
		var releaseMethods = Em.A();
		var propertiesToObserve = Em.A(['id', 'isNew', 'isDirty']);

		propertiesToObserve.addObjects(Em.get(record.constructor, 'attributes').toArray());

		propertiesToObserve.forEach(function(name) {
			var handler = function() {
				recordUpdated(_this.wrapRecord(record));
			};

			Em.addObserver(record, name, handler);

			releaseMethods.push(function() {
				Em.removeObserver(record, name, handler);
			});
		});

		return function() {
			releaseMethods.forEach(function(release) {
				release();
			});
		};
	}
});