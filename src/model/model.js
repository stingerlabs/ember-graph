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
			var prefix = this.constructor.temporaryIdPrefix;

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
		this._loadRelationships(json, false);
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
	 * Holds the type associations (typeKey -> model)
	 *
	 * @private
	 * @static
	 */
	_typeKeys: {},

	/**
	 * @static
	 * @param {Object} json
	 * @returns {Eg.Model}
	 */
	createRecord: function(json) {
		var record = this.create();

		record._create(json);

		return record;
	},

	/**
	 * Modifies the extend method to ensure that the typeKey is available on
	 * both the class an instances. Also registers it with the system.
	 *
	 * @returns {Eg.Model} Subclass of Eg.Model
	 */
	extend: function() {
		var options = arguments[arguments.length - 1];

		Eg.debug.assert('You must include the `typeKey` attribute.', typeof options.typeKey === 'string');
		var typeKey = options.typeKey;
		delete options.typeKey;

		var subclass = this._super.apply(this, arguments);

		subclass.reopen({
			typeKey: typeKey
		});

		subclass.reopenClass({
			typeKey: typeKey
		});

		this._registerType(typeKey, subclass);

		return subclass;
	},

	/**
	 * Registers a type with the system. Will override a previous type.
	 *
	 * @param {String} typeKey The type name of the model
	 * @param {Eg.Model} model The model to associate with the type name
	 * @private
	 * @static
	 */
	_registerType: function(typeKey, model) {
		Eg.Model._typeKeys[typeKey] = model;
	},

	/**
	 * Looks up a model for a type name
	 *
	 * @param {String} typeKey The type name of the model
	 * @returns {Eg.Model} The model associated with the type given
	 * @static
	 */
	modelForType: function(typeKey) {
		return Eg.Model._typeKeys[typeKey];
	}
});

