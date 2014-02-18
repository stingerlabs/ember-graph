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
		var isDeleted = this.get('isDeleted');
		var isSaving = this.get('isSaving');

		if (isDeleted && !isSaving) {
			return false;
		}

		var deleting = isDeleted && isSaving;
		return this.get('_areAttributesDirty') || this.get('_areRelationshipsDirty') || deleting;
	}.property('_areAttributesDirty', '_areRelationshipsDirty', 'isDeleted', 'isSaving'),

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

		this.set('_serverAttributes', {});
		this.set('_clientAttributes', {});

		this.set('_serverRelationships', {});
		this.set('_clientRelationships', {});
		this.set('_deletedRelationships', {});

		this.set('isDeleted', false);
		this.set('isSaving', false);
		this.set('isReloading', false);
	},

	/**
	 * Loads JSON data from the server into the record. This may be used when
	 * the record is brand new, or when the record is being reloaded. This
	 * should generally only be used by the store or for testing purposes.
	 * If called directly in production, this will have unintended consequences.
	 */
	_loadData: function(json) {
		json = json || {};
		Eg.debug.assert('The record `' + this.typeKey + ':' + this.get('id') + '` was attempted to be reloaded ' +
			'while dirty with `reloadDirty` disabled.', !this.get('isDirty') || this.get('store.reloadDirty'));

		this._loadAttributes(json);
		this._loadRelationships(json);
	},

	/**
	 * Proxies the store's save method for convenience.
	 */
	save: function() {
		return this.get('store').saveRecord(this);
	},

	/**
	 * Proxies the store's reload method for convenience.
	 */
	reload: function() {
		return this.get('store').reloadRecord(this);
	},

	/**
	 * Proxies the store's delete method for convenience.
	 */
	destroy: function() {
		return this.get('store').deleteRecord(this);
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
	 * @returns {Boolean}
	 */
	isTemporaryId: function(id) {
		return Eg.String.startsWith(id, this.temporaryIdPrefix);
	},

	create: function() {
		Eg.debug.assert('You can\'t create a record directly. Use the store.');
	},

	_create: Eg.Model.create,

	extend: function() {
		var args = Array.prototype.slice.call(arguments, 0);
		var options = args.pop() || {};
		var relationships = {};

		if (!(options instanceof Em.Mixin)) {
			Em.keys(options).forEach(function(key) {
				var value = options[key];

				if (options[key] && options[key].isRelationship) {
					relationships[key] = value;
					delete options[key];
				}
			});
		}

		args.push(options);

		var subclass = this._super.apply(this, args);
		subclass._declareRelationships(relationships);
		return subclass;
	}
});

