/**
 * Models act as classes for data. The model class should be
 * extended for each type of object that your object model
 * contains.
 *
 * @class {Model}
 */
Eg.Model = Em.Object.extend({

	/**
	 * Should be overridden in all subclasses with a name for this
	 * particular class. The name should be a unique string that
	 * will be referenced throughout the application. Refrain from
	 * special characters. Stick with lowercase letters.
	 *
	 * @type {String}
	 */
	typeKey: null,

	/**
	 * @type {String}
	 */
	_id: null,

	/**
	 * The ID of the record. The ID can only be changed once, and only if
	 * it's being changed from a temporary ID to a permanent one. Only the
	 * store should change the ID from a temporary one to a permanent one.
	 *
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
	 * Denotes that a record has been deleted. If `isDirty` is also true,
	 * the change hasn't been persisted to the server yet.
	 *
	 * @type {Boolean}
	 */
	isDeleted: null,

	/**
	 * Denotes that the record is currently saving its changes
	 * to the server, but the server hasn't responded yet.
	 *
	 * @type {Boolean}
	 */
	isSaving: null,

	/**
	 * Denotes that the record is being reloaded from the server,
	 * and will likely change when the server responds.
	 *
	 * @type {Boolean}
	 */
	isReloading: null,

	/**
	 * Denotes that a record has been loaded into a store and isn't freestanding.
	 *
	 * @type {Boolean}
	 */
	isLoaded: function() {
		return this.get('store') !== null;
	}.property('store'),

	/**
	 * Denotes that the record has changes that have not been saved to the server yet.
	 *
	 * @type {Boolean}
	 */
	isDirty: function() {
		return this.get('_areAttributesDirty') || this.get('_areRelationshipsDirty');
	}.property('_areAttributesDirty', '_areRelationshipsDirty'),

	/**
	 * Denotes that a record has just been created and has not been saved to
	 * the server yet. Most likely has a temporary ID if this is true.
	 *
	 * @type {Boolean}
	 */
	isNew: function() {
		return Eg.String.startsWith(this.get('_id'), this.constructor.temporaryIdPrefix);
	}.property('_id'),

	/**
	 * Sets up the instance variables of this class.
	 */
	init: function() {
		this.set('_id', null);
		this.set('store', null);

		this.set('isDeleted', false);
		this.set('isSaving', false);
		this.set('isReloading', false);
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

