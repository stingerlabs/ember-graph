var Promise = Em.RSVP.Promise;

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
			var db = this.convertAndVerifyPayload(payload);
			return this.setDatabase(db);
		} catch (error) {
			console.error('There was an error while trying to initialize your database.');
			return Promise.reject(error);
		}
	},

	/**
	 *
	 * @method convertAndVerifyPayload
	 * @param {JSON} payload
	 * @return {JSON} Database object
	 * @private
	 * @for EmberGraphAdapter
	 */
	convertAndVerifyPayload: function(payload) {

	}

});