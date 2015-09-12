import Ember from 'ember';
import CoreModel from 'ember-graph/model/core';
import StateProperties from 'ember-graph/model/states';
import RelationshipLoadMethods from 'ember-graph/model/relationship_load';

import { generateUUID } from 'ember-graph/util/util';
import { startsWith } from 'ember-graph/util/string';
import { computed } from 'ember-graph/util/computed';
import {
	RelationshipClassMethods,
	RelationshipPublicMethods,
	RelationshipPrivateMethods,
	HAS_ONE_KEY,
	HAS_MANY_KEY
} from 'ember-graph/model/relationship';


/**
 * Models are the classes that represent your domain data.
 * Each type of object in your domain should have its own
 * model, with attributes and relationships declared using the
 * [attr](EG.html#method_attr), [hasOne](EG.html#method_hasOne)
 * and [hasMany](EG.html#method_hasMany) functions.
 *
 * To create a model, subclass this class (or any other Model
 * subclass) and place it your app's namespace. The name
 * that you give it is important, since that's how it will be
 * looked up by the container. The usual convention is to use
 * a camel-cased name like `App.PostComment` or `App.ForumAdmin`.
 * For more information on resolving, read the Ember.js entry
 * on the [DefaultResolver](http://emberjs.com/api/classes/Ember.DefaultResolver.html).
 *
 * @class Model
 * @extends CoreModel
 * @uses Ember.Evented
 */
var Model = CoreModel.extend(Ember.Evented, {

	/**
	 * This property is available on every model instance and every
	 * model subclass (after being looked up at least once by the
	 * container). This is the key that you use to refer to the model
	 * in relationships and store methods. Examples:
	 *
	 * ```
	 * App.User => user
	 * App.PostComment => postComment
	 * ```
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
	id: computed('_id', {
		get() {
			return this.get('_id');
		},
		set(key, value) {
			const id = this.get('_id');
			const prefix = this.constructor.temporaryIdPrefix;

			if (id === null || (startsWith(id, prefix) && !startsWith(value, prefix))) {
				this.set('_id', value);
			} else {
				throw new Ember.Error('Cannot change the \'id\' property of a model.');
			}
		}
	}),

	/**
	 * @property store
	 * @type Store
	 * @final
	 */
	store: null,

	/**
	 * Loads JSON data from the server into the record. This may be used when
	 * the record is brand new, or when the record is being reloaded. This
	 * should generally only be used by the store or for testing purposes.
	 * However, this can be useful to override to intercept data before it's
	 * loaded into the record;
	 *
	 * @method loadData
	 * @param {Object} json
	 * @deprecated Use `loadDataFromServer` instead
	 */
	loadData: Ember.aliasMethod('loadDataFromServer'),

	/**
	 * Takes a payload from the server and merges the data into the current data.
	 * This is generally only called by the store, but it may be useful to
	 * override it if you're looking to intercept and modify server data before
	 * it's loaded into the record.
	 *
	 * @method loadDataFromServer
	 * @param {Object} json
	 */
	loadDataFromServer(json = {}) {
		Ember.assert('The record `' + this.typeKey + ':' + this.get('id') + '` was attempted to be reloaded ' +
			'while dirty with `reloadDirty` disabled.', !this.get('isDirty') || this.get('store.reloadDirty'));

		this.loadAttributesFromServer(json);
		this.loadRelationshipsFromServer(json);
	},

	/**
	 * Takes the data passed to the store's {{link-to-method 'Store' 'createRecord'}}
	 * method and loads it into the newly created record by calling the model's
	 * public API methods for manipulating records. This should really only be
	 * called by the store and when a record is brand new.
	 *
	 * @method initializeRecord
	 * @param {Object} json
	 */
	initializeRecord: function(json = {}) {
		this.initializeAttributes(json);
		this.initializeRelationships(json);
	},

	/**
	 * Proxies the store's save method for convenience.
	 *
	 * @method save
	 * @return Promise
	 */
	save: function() {
		var _this = this;
		var property = null;

		if (this.get('isNew')) {
			property = 'isCreating';
		} else {
			property = 'isSaving';
		}

		this.set(property, true);
		return this.get('store').saveRecord(this).finally(function() {
			_this.set(property, false);
		});
	},

	/**
	 * Proxies the store's reload method for convenience.
	 *
	 * @method reload
	 * @return Promise
	 */
	reload: function() {
		var _this = this;

		this.set('isReloading', true);
		return this.get('store').reloadRecord(this).finally(function() {
			_this.set('isReloading', false);
		});
	},

	/**
	 * Proxies the store's delete method for convenience.
	 *
	 * @method destroy
	 * @return Promise
	 */
	destroy: function() {
		var _this = this;

		this.set('isDeleting', true);
		return this.get('store').deleteRecord(this).then(function() {
			_this.set('isDeleted', true);
			_this.set('store', null);
		}).finally(function() {
			_this.set('isDeleting', false);
		});
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

		return (this.typeKey === Ember.get(other, 'typeKey') && this.get('id') === Ember.get(other, 'id'));
	},

	/**
	 * Determines if the newly created record is fully initialized yet.
	 * If it's not initialized, it can't be persisted to the server.
	 * This will always return `true` for non-new records.
	 */
	isInitialized: function() {
		return !this.get('isNew') || (this.areAttributesInitialized() && this.areRelationshipsInitialized());
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

Model.reopenClass({

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
		return startsWith(id, this.temporaryIdPrefix);
	},

	/**
	 * This method creates a record shell, initializing the `store` and `id` properties.
	 * (The ID is a temporary ID.) **This can only be called by the store.** Calling it
	 * yourself will decouple the record from the store, causing odd behavior.
	 *
	 * @method create
	 * @param {Store} store
	 * @return {Model}
	 */
	create: function(store) {
		var record = this._super();
		record.set('store', store);
		record.set('_id', Ember.get(this, 'temporaryIdPrefix') + generateUUID());
		return record;
	},

	/**
	 * @method extend
	 * @static
	 */
	extend: function() {
		var args = Array.prototype.slice.call(arguments, 0);
		var options = args.pop() || {};
		var attributes = {};
		var relationships = {};

		// Ember.Mixin doesn't have a `detectInstance` method
		if (!(options instanceof Ember.Mixin)) {
			Object.keys(options).forEach(function(key) {
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
		subclass.declareAttributes(attributes);
		subclass.declareRelationships(relationships);
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
		if (Ember.isNone(a) || Ember.isNone(b)) {
			return false;
		}

		if (this.detectInstance(a)) {
			return a.isEqual(b);
		}

		if (this.detectInstance(b)) {
			return b.isEqual(a);
		}

		if (this.detectInstance(Ember.get(a, 'content'))) {
			return Ember.get(a, 'content').isEqual(b);
		}

		if (this.detectInstance(Ember.get(b, 'content'))) {
			return Ember.get(b, 'content').isEqual(a);
		}

		return false;
	}
});

Model.reopen(StateProperties);
Model.reopen(RelationshipPublicMethods);
Model.reopen(RelationshipPrivateMethods);
Model.reopen(RelationshipLoadMethods);
Model.reopenClass(RelationshipClassMethods);
Model.reopenClass({
	HAS_ONE_KEY: HAS_ONE_KEY,
	HAS_MANY_KEY: HAS_MANY_KEY
});

export default Model;