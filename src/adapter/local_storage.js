var Promise = Em.RSVP.Promise;

/**
 * @class LocalStorageAdapter
 * @extends Adapter
 */
EG.LocalStorageAdapter = EG.Adapter.extend({

	createRecord: function(record) {
		var json = this.serialize(record, { requestType: 'createRecord', recordType: record.get('typeKey') });
		return this.serverCreateRecord(record.get('typeKey'), json);
	},

	findRecord: function(typeKey, id) {
		return this.serverFindRecord(typeKey, id);
	},

	findMany: function(typeKey, ids) {
		return this.serverFindMany(typeKey, ids);
	},

	findAll: function(typeKey) {
		return this.serverFindAll(typeKey);
	},

	findQuery: function() {
		return Promise.reject('LocalStorageAdapter doesn\'t implement `findQuery` by default.');
	},

	updateRecord: function(record) {
		var changes = this.serialize(record, { requestType: 'updateRecord', recordType: record.get('typeKey') });
		return this.serverUpdateRecord(record.get('typeKey'), record.get('id'), changes);
	},

	deleteRecord: function(record) {
		return this.serverDeleteRecord(record.get('typeKey'), record.get('id'));
	}

});

EG.LocalStorageAdapter.reopen({

	serverCreateRecord: function(typeKey, json) {

	},

	serverFindRecord: function(typeKey, id) {

	},

	serverFindMany: function(typeKey, ids) {

	},

	serverFindAll: function(typeKey) {

	},

	serverUpdateRecord: function(typeKey, id, changes) {

	},

	serverDeleteRecord: function(typeKey, id) {

	}

});