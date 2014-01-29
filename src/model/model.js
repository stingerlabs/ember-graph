/**
 * @class Model
 */
Eg.Model = Em.Object.extend({

	/**
	 * @type {String}
	 */
	_id: null,

	/**
	 * @type {String}
	 */
	id: function(key, value) {
		var id = this.get('_id');

		if (arguments.length > 1) {
			var prefix = Em.get(this.constructor, 'temporaryIdPrefix');

			if (id === null) {
				this.set('_id', value);
				return value;
			} else if (Eg.String.startsWith(id, prefix) && !Eg.String.startsWith(value, prefix)) {
				this.set('_id', value);
				return value;
			} else {
				throw new Error('Cannot change the \'id\' property of a model.');
			}
		}

		return id;
	}.property('_id'),

	/**
	 * @type {Object}
	 * @private
	 */
	store: null,

	/**
	 * @constructs
	 */
	init: function() {
		this.set('_id', null);
		this.set('store', null);
	},

	/**
	 * @private
	 */
	_create: function(json) {
		if (json.hasOwnProperty('id')) {
			this.set('id', json.id);
			delete json.id;
		} else {
			this.set('id', Em.get(this.constructor, 'temporaryIdPrefix') + Eg.util.generateGUID());
		}

		this._loadAttributes(json, false);
	}
});

Eg.Model.reopenClass({
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
	 * @static
	 * @param {Object} json
	 * @returns {Eg.Model}
	 */
	createRecord: function(json) {
		var record = this.create();

		record._create(json);

		return record;
	}
});