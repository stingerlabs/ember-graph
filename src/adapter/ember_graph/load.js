var Promise = Em.RSVP.Promise;

var forEach = Em.ArrayPolyfills.forEach;
var typeOf = Em.typeOf;

EG.EmberGraphAdapter.extend({

	/**
	 * Determines whether or not to bootstrap the database
	 * with an initial set of data. If you want to initialize
	 * the database with data, you should override this property
	 * to return `true`. Use a computed property if deciding to
	 * initialize requires application logic.
	 *
	 * @method shouldBootstrapDatabase
	 * @return {Boolean}
	 * @protected
	 * @for EmberGraphAdapter
	 */
	shouldInitializeDatabase: function() {
		return false;
	},

	/**
	 * If {{link-to-method 'EmberGraphAdapter' 'shouldInitializeDatabase'}} returns `true`,
	 * then this hook is called to get the data to inject into the database. The format
	 * is the same format required by {{link-to-method 'Store' 'extractPayload'}}.
	 *
	 * @method getInitialPayload
	 * @return {Object}
	 * @protected
	 * @for EmberGraphAdapter
	 */
	getInitialPayload: function() {
		return { records: {}, relationships: [] };
	},

	/**
	 * Initializes the database (if configured to do so). Verifies all of the data first.
	 * Because saving data to the database can be asynchronous, this function returns
	 * a promise. Your application is probably not ready to be started until this
	 * promise resolves. If your implementation of this class saves the database
	 * synchronously, this can be done during initialization. Otherwise, you'll
	 * have to figure out a way to stall your application until it completes.
	 *
	 * @method initializeDatabase
	 * @return {Promise}
	 * @for EmberGraphAdapter
	 */
	initializeDatabase: function() {
		if (this.shouldInitializeDatabase()) {
			return Promise.resolve();
		}

		var payload = this.getInitialPayload();

		try {
			var db = this.convertAndVerifyPayload(Em.copy(payload, true));
			return this.setDatabase(db);
		} catch (error) {
			console.error('There was an error while trying to initialize your database.');
			return Promise.reject(error);
		}
	},

	/**
	 * @method convertAndVerifyPayload
	 * @param {Object} payload
	 * @return {JSON} Database object
	 * @private
	 * @for EmberGraphAdapter
	 */
	convertAndVerifyPayload: function(payload) {
		var records = this.extractRecords(payload);
		var relationships = this.extractRelationships(payload, records);

		var database = {
			records: records,
			relationships: relationships
		};

		this.validateDatabase(database);

		return database;
	},

	/**
	 * @method extractRecords
	 * @param {Object} payload
	 * @return {JSON} `records` object for database
	 * @private
	 * @for EmberGraphAdapter
	 */
	extractRecords: function(payload) {
		var store = this.get('store');
		var databaseRecords = {};

		EG.values(payload, function(typeKey, records) {
			databaseRecords[typeKey] = {};

			var model = store.modelForType(typeKey);

			forEach.call(records, function(record) {
				databaseRecords[typeKey][record.id] = this.convertRecord(model, record);
			}, this);
		}, this);
	},

	/**
	 * Takes a single record, fills in missing attributes
	 * and serializes it for storage in the database.
	 *
	 * @method convertRecord
	 * @param {Class} model
	 * @param {Object} record
	 * @return {JSON}
	 * @private
	 * @for EmberGraphAdapter
	 */
	convertRecord: function(model, record) {
		var json = {
			id: record.id + ''
		};

		model.eachAttribute(function(name, meta) {
			var type = this.get('store').attributeTypeFor(meta.type);

			if (record[name] === undefined) {
				if (meta.isRequired) {
					throw new Em.Error(Em.get(model, 'typeKey') + ':' + record.id + ' is missing `' + name + '`');
				} else {
					json[name] = type.serialize(meta.defaultValue);
				}
			} else {
				json[name] = type.serialize(record[name]);
			}
		}, this);

		return json;
	},

	/**
	 * @method extractRelationships
	 * @param {Object} payload
	 * @param {JSON} databaseRecords
	 * @return {JSON[]}
	 * @private
	 * @for EmberGraphAdapter
	 */
	extractRelationships: function(payload, databaseRecords) {
		var store = this.get('store');
		var createdRelationships = new Em.Set();

		EG.values(payload, function(typeKey, records) {
			 var model = store.modelForType(typeKey);

			forEach.call(records, function(record) {
				model.eachRelationship(function(name, meta) {
					
				});
			});
		}, this);
	},

	/**
	 * @method validateDatabase
	 * @param {JSON} db
	 * @private
	 * @for EmberGraphAdapter
	 */
	validateDatabase: function(db) {

	}

});