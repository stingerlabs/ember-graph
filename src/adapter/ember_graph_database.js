var Promise = Em.RSVP.Promise;

/**
 * @class EmberGraphDatabaseAdapter
 * @extends Adapter
 * @constructor
 */
EG.EmberGraphDatabaseAdapter = EG.Adapter.extend({

	/**
	 * The database to store the records and relationships in.
	 *
	 * @property database
	 * @type EmberGraphDatabase
	 * @category abstract
	 */
	database: EG.requiredProperty('database'),

	/**
	 * This adapter requires the built-in JSON serializer to function properly.
	 *
	 * @property serializer
	 * @type EmberGraphDatabaseSerializer
	 * @final
	 */
	serializer: Em.computed(function() {
		return this.get('container').lookup('serializer:ember_graph_database');
	}).property().readOnly(),

	createRecord: function(record) {
		try {
			var json = this.serverCreateRecord(record);
			var payload = { meta: { newId: json.id } };
			payload[record.typeKey] = [json];

			return Promise.resolve(payload);
		} catch (e) {
			console.log(e && e.stack);
			return Promise.reject();
		}
	},

	findRecord: function(typeKey, id) {
		try {
			var json = this.retrieveRecord(typeKey, id);
			var deserialized = this.deserialize(json, { recordType: typeKey });

			var payload = {};
			payload[typeKey] = [deserialized];

			return Promise.resolve(payload);
		} catch (e) {
			console.log(e && e.stack);
			return Promise.reject();
		}
	},

	findMany: function(typeKey, ids) {
		try {
			var json = map.call(ids, function(id) {
				return this.retrieveRecord(typeKey, id);
			}, this);

			var deserialized = map.call(json, function(record) {
				return this.deserialize(record, { recordType: typeKey });
			}, this);

			var payload = {};
			payload[typeKey] = deserialized;

			return Promise.resolve(payload);
		} catch (e) {
			console.log(e && e.stack);
			return Promise.reject();
		}
	},

	findAll: function(typeKey) {
		try {
			var json = this.retrieveRecords(typeKey);
			var deserialized = map.call(json, function(record) {
				return this.deserialize(record, { recordType: typeKey });
			}, this);

			var payload = {};
			payload[typeKey] = deserialized;

			return Promise.resolve(payload);
		} catch (e) {
			console.log(e && e.stack);
			return Promise.reject();
		}
	},

	findQuery: function(typeKey, query) {
		try {
			var json = this.retrieveRecords(typeKey, query);
			var deserialized = map.call(json, function(record) {
				return this.deserialize(record, { recordType: typeKey });
			}, this);

			var payload = {};
			payload[typeKey] = deserialized;

			return Promise.resolve(payload);
		} catch (e) {
			console.log(e && e.stack);
			return Promise.reject();
		}
	},

	updateRecord: function(record) {
		try {
			var json = this.serverUpdateRecord(record);

			var payload = {};
			payload[record.typeKey] = [json];

			return Promise.resolve(payload);
		} catch (e) {
			console.log(e && e.stack);
			return Promise.reject();
		}
	},

	deleteRecord: function(record) {
		try {
			this.serverDeleteRecord(record);
			return Promise.resolve();
		} catch (e) {
			console.log(e && e.stack);
			return Promise.reject();
		}
	}

});