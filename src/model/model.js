/**
 * Models act as classes for data. The model class should be
 * extended for each type of object that your object model
 * contains.
 *
 * @class Model
 * @constructor
 * @namespace EmberGraph
 * @extends Ember.Object
 */
EG.Model = Em.Object.extend(Em.Evented, {

	/**
	 * Should be overridden in all subclasses with a name for this
	 * particular class. The name should be a unique string that
	 * will be referenced throughout the application. Refrain from
	 * special characters. Stick with lowercase letters.
	 *
	 * @property typeKey
	 * @type String
	 * @final
	 */
	typeKey: null,

	_id: null,

	/**
	 * The ID of the record. The ID can only be changed once, and only if
	 * it's being changed from a temporary ID to a permanent one. Only the
	 * store should change the ID from a temporary one to a permanent one.
	 *
	 * @property id
	 * @type String
	 * @final
	 */
	id: Em.computed(function(key, value) {
		var id = this.get('_id');

		if (arguments.length > 1) {
			var prefix = this.constructor.temporaryIdPrefix;

			if (id === null) {
				this.set('_id', value);
				return value;
			} else if (EG.String.startsWith(id, prefix) && !EG.String.startsWith(value, prefix)) {
				this.set('_id', value);
				return value;
			} else {
				throw new Error('Cannot change the \'id\' property of a model.');
			}
		}

		return id;
	}).property('_id'),

	/**
	 * @property store
	 * @type EmberGraph.Store
	 * @final
	 */
	store: null,

	/**
	 * Denotes that a record has been deleted. If `isDirty` is also true,
	 * the change hasn't been persisted to the server yet.
	 *
	 * @property isDeleted
	 * @type Boolean
	 * @final
	 */
	isDeleted: null,

	/**
	 * Denotes that the record is currently saving its changes
	 * to the server, but the server hasn't responded yet.
	 *
	 * @property isSaving
	 * @type Boolean
	 * @final
	 */
	isSaving: null,

	/**
	 * Denotes that the record is being reloaded from the server,
	 * and will likely change when the server responds.
	 *
	 * @property isReloading
	 * @type Boolean
	 * @final
	 */
	isReloading: null,

	/**
	 * Denotes that a record has been loaded into a store and isn't freestanding.
	 *
	 * @property isLoaded
	 * @type Boolean
	 * @final
	 */
	isLoaded: Em.computed(function() {
		return this.get('store') !== null;
	}).property('store'),

	/**
	 * Denotes that the record has changes that have not been saved to the server yet.
	 *
	 * @property isDirty
	 * @type Boolean
	 * @final
	 */
	isDirty: Em.computed(function() {
		var isDeleted = this.get('isDeleted');
		var isSaving = this.get('isSaving');

		if (isDeleted && !isSaving) {
			return false;
		}

		var deleting = isDeleted && isSaving;
		return this.get('_areAttributesDirty') || this.get('_areRelationshipsDirty') || deleting;
	}).property('_areAttributesDirty', '_areRelationshipsDirty', 'isDeleted', 'isSaving'),

	/**
	 * Denotes that a record has just been created and has not been saved to
	 * the server yet. Most likely has a temporary ID if this is true.
	 *
	 * @property isNew
	 * @type Boolean
	 * @final
	 */
	isNew: Em.computed(function() {
		return EG.String.startsWith(this.get('_id'), this.constructor.temporaryIdPrefix);
	}).property('_id'),

	/**
	 * Sets up the instance variables of this class.
	 *
	 * @method init
	 */
	init: function() {
		this._super();

		this.set('_id', null);
		this.set('store', null);

		this.set('_serverAttributes', Em.Object.create());
		this.set('_clientAttributes', Em.Object.create());

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
		Em.assert('The record `' + this.typeKey + ':' + this.get('id') + '` was attempted to be reloaded ' +
			'while dirty with `reloadDirty` disabled.', !this.get('isDirty') || this.get('store.reloadDirty'));

		this._loadAttributes(json);
		this._loadRelationships(json);
	},

	/**
	 * Proxies the store's save method for convenience.
	 *
	 * @method save
	 * @return Promise
	 */
	save: function() {
		return this.get('store').saveRecord(this);
	},

	/**
	 * Proxies the store's reload method for convenience.
	 *
	 * @method reload
	 * @return Promise
	 */
	reload: function() {
		return this.get('store').reloadRecord(this);
	},

	/**
	 * Proxies the store's delete method for convenience.
	 *
	 * @method destroy
	 * @return Promise
	 */
	destroy: function() {
		return this.get('store').deleteRecord(this);
	},

	/**
	 * Determines if the other object is a model that represents the same record.
	 *
	 * @method isEqual
	 * @return Boolean
	 */
	isEqual: function(other) {
		if (!other) {
			return;
		}

		return (this.typeKey === Em.get(other, 'typeKey') && this.get('id') === Em.get(other, 'id'));
	},

	/**
	 * Rolls back changes to both attributes and relationships.
	 *
	 * @method rollback
	 */
	rollback: function() {
		this.rollbackAttributes();
		this.rollbackRelationships();
	}
});

/**
 * @class Model
 * @namespace EmberGraph
 */
EG.Model.reopenClass({

	/**
	 * The prefix added to generated IDs to show that the prefix wasn't given
	 * by the server and is only temporary until the real one comes in.
	 *
	 * @property temporaryIdPrefix
	 * @type String
	 * @static
	 */
	temporaryIdPrefix: 'EG_TEMP_ID_',

	/**
	 * @method isTemporaryId
	 * @param {String} id
	 * @return Boolean
	 * @static
	 */
	isTemporaryId: function(id) {
		return EG.String.startsWith(id, this.temporaryIdPrefix);
	},

	create: function() {
		Em.assert('You can\'t create a record directly. Use the store.');
	},

	_create: EG.Model.create,

	/**
	 * @method extend
	 * @static
	 */
	extend: function() {
		var args = Array.prototype.slice.call(arguments, 0);
		var options = args.pop() || {};
		var attributes = {};
		var relationships = {};

		if (!(options instanceof Em.Mixin)) {
			Em.keys(options).forEach(function(key) {
				var value = options[key];

				if (options[key]) {
					if (options[key].isRelationship) {
						relationships[key] = value;
						delete options[key];
					} else if (options[key].isAttribute) {
						attributes[key] = value;
						delete options[key];
					}
				}
			});
		}

		args.push(options);

		var subclass = this._super.apply(this, args);
		subclass._declareAttributes(attributes);
		subclass._declareRelationships(relationships);
		return subclass;
	},

	/**
	 * Determines if the two objects passed in are equal models (or model proxies).
	 *
	 * @param {Model} a
	 * @param {Model} b
	 * @return Boolean
	 * @static
	 */
	isEqual: function(a, b) {
		if (Em.isNone(a) || Em.isNone(b)) {
			return false;
		}

		if (this.detectInstance(a)) {
			return a.isEqual(b);
		}

		if (this.detectInstance(b)) {
			return b.isEqual(a);
		}

		if (this.detectInstance(Em.get(a, 'content'))) {
			return Em.get(a, 'content').isEqual(b);
		}

		if (this.detectInstance(Em.get(b, 'content'))) {
			return Em.get(b, 'content').isEqual(a);
		}

		return false;
	}
});

