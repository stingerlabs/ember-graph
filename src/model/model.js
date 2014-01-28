/**
 * @class Model
 */
Eg.Model = Em.Object.extend({

	/**
	 * @type {String}
	 * @public
	 */
	id: null,

	/**
	 * @type {Object}
	 * @private
	 */
	originalData: null,

	/**
	 * @type {Object}
	 * @private
	 */
	modifiedData: null,

	/**
	 * @type {Object}
	 * @private
	 */
	store: null,

	/**
	 * @constructs
	 */
	init: function() {

	},

	/**
	 * @static
	 * @param {Object} json
	 * @returns {Eg.Model}
	 */
	createRecord: function(json) {

	},


	/**
	 * @instance
	 * @returns {Object}
	 */
	toJSON: function() {

	},

	/**
	 * Proxies the store's save method for convenience.
	 * @returns {Em.RSVP.Promise}
	 * @throws Error If this record hasn't been loaded into the store
	 */
	save: function() {
		if (this.store) {
			return this.store.save(this);
		} else {
			throw new Error('This record hasn\'t been loaded into a store yet.');
		}
	}
});