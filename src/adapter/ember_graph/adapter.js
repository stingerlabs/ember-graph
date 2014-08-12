var Promise = Em.RSVP.Promise;

/**
 * This class acts as a base adapter for synchronous storage forms. Specifically,
 * the {{link-to-class 'LocalStorageAdapter'}} and {{link-to-class 'MemoryAdapter'}}
 * inherit from this class. This class will perform all of the work of updating data
 * and maintaining data integrity, subclasses need only implement the
 * {{link-to-method 'EmberGraphAdapter' 'getDatabase'}} and
 * {{link-to-method 'EmberGraphAdapter' 'setDatabase'}} methods to create a
 * fully-functioning adapter. This class works with data as a single JSON object
 * that takes the following form:
 *
 * ```json
 * {
 *     "records": {
 *          "type_key": {
 *              "record_id": {
 *                  "attr1": "value",
 *                  "attr2": 5
 *              }
 *          }
 *     },
 *     "relationships": [{
 *             "t1": "type_key",
 *             "i1": "id",
 *             "n1": "relationship_name",
 *             "t2": "type_key",
 *             "i2": "id",
 *             "n2": "relationship_name",
 *     }]
 * }
 * ```
 *
 * If you can store the JSON data, then this adapter will ensure complete
 * database integrity, since everything is done is single transactions.
 * You may also override some of the hooks and methods if you wish to
 * customize how the adapter saves or retrieves data.
 *
 * @class EmberGraphAdapter
 * @extends Adapter
 * @category abstract
 */
EG.EmberGraphAdapter = EG.Adapter.extend({

	/**
	 * Since we control both the client and 'server', we'll
	 * use the same serializer for all records.
	 *
	 * @property serializer
	 * @type JSONSerializer
	 * @protected
	 * @final
	 */
	serializer: Em.computed(function() {
		return this.get('container').lookup('serializer:ember_graph');
	}).property().readOnly(),

	createRecord: function(record) {
		var _this = this;
		var typeKey = record.get('typeKey');
		var serializerOptions = { requestType: 'createRecord', recordType: typeKey };
		var json = this.serialize(record, serializerOptions);

		return this.serverCreateRecord(typeKey, json).then(function(payload) {
			return _this.deserialize(payload, serializerOptions);
		});
	},

	findRecord: function(typeKey, id) {
		var _this = this;
		var serializerOptions = { requestType: 'findRecord', recordType: typeKey };

		return this.serverFindRecord(typeKey, id).then(function(payload) {
			return _this.deserialize(payload, serializerOptions);
		});
	},

	findMany: function(typeKey, ids) {
		var _this = this;
		var serializerOptions = { requestType: 'findMany', recordType: typeKey };

		return this.serverFindMany(typeKey, ids).then(function(payload) {
			return _this.deserialize(payload, serializerOptions);
		});
	},

	findAll: function(typeKey) {
		var _this = this;
		var serializerOptions = { requestType: 'findAll', recordType: typeKey };

		return this.serverFindAll(typeKey).then(function(payload) {
			return _this.deserialize(payload, serializerOptions);
		});
	},

	findQuery: function() {
		return Promise.reject('LocalStorageAdapter doesn\'t implement `findQuery` by default.');
	},

	updateRecord: function(record) {
		var _this = this;
		var typeKey = record.get('typeKey');
		var serializerOptions = { requestType: 'updateRecord', recordType: typeKey };
		var changes = this.serialize(record, serializerOptions);

		return this.serverUpdateRecord(typeKey, record.get('id'), changes).then(function(payload) {
			return _this.deserialize(payload, serializerOptions);
		});
	},

	deleteRecord: function(record) {
		var _this = this;
		var typeKey = record.get('typeKey');
		var serializerOptions = { requestType: 'deleteRecord', recordType: typeKey };

		return this.serverDeleteRecord(typeKey, record.get('id')).then(function(payload) {
			return _this.deserialize(payload, serializerOptions);
		});
	},

	serialize: function(record, options) {
		return this.get('serializer').serialize(record, options);
	},

	deserialize: function(payload, options) {
		return this.get('serializer').deserialize(payload, options);
	}

});