/**
 * @class Model
 */
Eg.Model = Em.Object.extend({

	/**
	 * The prefix added to generated IDs to show that the prefix wasn't given
	 * by the server and is only temporary until the real one comes in.
	 *
	 * @type {String}
	 * @constant
	 * @static
	 */
	temporaryIdPrefix: 'EG_TEMP_ID_',

	/**
	 * @type {String}
	 */
	id: null,

	/**
	 * @type {Object}
	 * @private
	 */
	store: null,

	/**
	 * @constructs
	 */
	init: function() {
		this.set('id', null);
		this.set('store', null);

		this.set('_serverAttributes', {});
		this.set('_clientAttributes', {});
	},

	/**
	 * @static
	 * @param {Object} json
	 * @returns {Eg.Model}
	 */
	createRecord: function(json) {
		var record = this.super();

		this.constructor.eachAttribute(function(name, meta) {
			
		}, this);

		return record;
	}
});