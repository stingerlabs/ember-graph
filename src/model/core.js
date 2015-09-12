import Ember from 'ember';
import EmberGraphSet from 'ember-graph/util/set';

import { deprecateProperty } from 'ember-graph/util/util';
import { computed } from 'ember-graph/util/computed';


var createAttribute = function(attributeName, options) {
	var meta = {
		isAttribute: true,
		type: options.type,
		isRequired: !options.hasOwnProperty('defaultValue'),
		defaultValue: options.defaultValue,
		isReadOnly: options.readOnly === true || options.serverOnly === true,
		isServerOnly: options.serverOnly === true,

		getDefaultValue: function() {
			var defaultValue = this.defaultValue;
			return (typeof defaultValue === 'function' ? defaultValue() : defaultValue);
		},

		// deprecated
		isEqual: options.isEqual
	};

	return computed(`clientAttributes.${attributeName}`, `serverAttributes.${attributeName}`, {
		get(key) {
			const server = this.get(`serverAttributes.${key}`);
			const client = this.get(`clientAttributes.${key}`);
			return (client === undefined ? server : client);
		},

		set(key, value) {
			const meta = this.constructor.metaForAttribute(key);

			// New records can modify read only attributes. But not if they're server only
			if (meta.isReadOnly && !this.get('isNew')) {
				throw new Ember.Error('Cannot set read-only property "' + key + '" on object: ' + this);
			}

			if (value === undefined) {
				Ember.warn('`undefined` is not a valid property value.');
				return;
			}

			const isEqualScope = meta.isEqual ? meta : this.get('store').attributeTypeFor(meta.type);

			if (isEqualScope.isEqual(this.get(`serverAttributes.${key}`), value)) {
				delete this.get('clientAttributes')[key];
			} else {
				this.set(`clientAttributes.${key}`, value);
			}

			// This only notifies observers of the object itself, not the properties.
			// At this point in time, that's only the `_areAttributesDirty` property.
			this.notifyPropertyChange('clientAttributes');
		}
	}).meta(meta);
};

/**
 * This class serves as the base for Models and Embedded records.
 * This is considered private API and shouldn't be extended
 * unless you really know what you're doing.
 *
 * @class CoreModel
 * @abstract
 */
var CoreModel = Ember.Object.extend({

	/**
	 * The latest attributes from the server. When rolling back attributes,
	 * these values will be the new current values. These should only be
	 * updated when new data is received from the server, usually as the
	 * result of a save request or an asynchronous data push.
	 *
	 * @property serverAttributes
	 * @type Object
	 * @private
	 */
	serverAttributes: null,

	/**
	 * Client side changes to attributes, if there are any. These values
	 * are temporary and do not take effect until persisted to the server
	 * and turned into server attributes by being pushed with a payload.
	 * When rolling back attributes, this object is replaced with an
	 * empty one.
	 *
	 * @property clientAttributes
	 * @type Object
	 * @private
	 */
	clientAttributes: null,

	/**
	 * Determines if there are any dirty attributes.
	 *
	 * @property areAttributesDirty
	 * @type Boolean
	 */
	areAttributesDirty: computed('clientAttributes', {
		get() {
			return Object.keys(this.get('clientAttributes') || {}).length > 0;
		}
	}),

	_areAttributesDirty: deprecateProperty('`_areAttributeDirty` is now `areAttributesDirty`', 'areAttributesDirty'),

	init: function() {
		this._super();

		this.setProperties({
			serverAttributes: Ember.Object.create(),
			clientAttributes: Ember.Object.create()
		});
	},

	/**
	 * Returns an object that contains every attribute
	 * that has been changed since the last save.
	 *
	 * @method changedAttributes
	 * @return {Object} Keys are attribute names, values are arrays with [oldVal, newVal]
	 */
	changedAttributes: function() {
		var diff = {};
		var store = this.get('store');

		this.constructor.eachAttribute(function(name, meta) {
			var server = this.get('serverAttributes.' + name);
			var client = this.get('clientAttributes.' + name);

			var scope = meta.isEqual ? meta : store.attributeTypeFor(meta.type);
			if (client === undefined || scope.isEqual(server, client)) {
				return;
			}

			diff[name] = [server, client];
		}, this);

		return diff;
	},

	/**
	 * Resets all attribute changes to last known server attributes.
	 *
	 * @method rollbackAttributes
	 */
	rollbackAttributes: function() {
		this.set('clientAttributes', Ember.Object.create());
	},

	/**
	 * Loads attributes from the server.
	 */
	loadAttributesFromServer: function(json) {
		var serverAttributes = this.get('serverAttributes');

		this.constructor.eachAttribute(function(attributeName, meta) {
			Ember.assert('Your JSON is missing the \'' + attributeName + '\' property.',
				!meta.isRequired || json.hasOwnProperty(attributeName));

			// TODO: Why is there here? I thought we weren't allowing this.
			var value = (json.hasOwnProperty(attributeName) ? json[attributeName] : meta.getDefaultValue());
			serverAttributes.set(attributeName, value);

			this.synchronizeAttribute(attributeName);
		}, this);
	},

	/**
	 * When an attribute's value is set directly (like in `pushPayload`), this
	 * will synchronize the server and client attributes and fix the dirty state.
	 */
	synchronizeAttribute: function(name) {
		var server = this.get('serverAttributes.' + name);
		var client = this.get('clientAttributes.' + name);

		var meta = this.constructor.metaForAttribute(name);
		var scope = meta.isEqual ? meta : this.get('store').attributeTypeFor(meta.type);

		if (scope.isEqual(server, client)) {
			delete this.get('clientAttributes')[name];
			this.notifyPropertyChange('clientAttributes');
		}
	},

	/**
	 * Sets up attributes given to the constructor for this record.
	 * Equivalent to setting the attribute values individually.
	 */
	initializeAttributes: function(json) {
		this.constructor.eachAttribute(function(name, meta) {
			var value = json[name];

			if (value !== undefined) {
				this.set(name, value);
			}
		}, this);
	},

	areAttributesInitialized: function() {
		var initialized = true;

		this.constructor.eachAttribute(function(name, meta) {
			if (meta.isRequired && !meta.isServerOnly) {
				initialized = initialized && this.isAttributeInitialized(name);
			}
		}, this);

		return initialized;
	},

	/**
	 * Determines if the given attribute has been initialized or not.
	 * Always returns `true` for non-new records.
	 *
	 * @method isAttributeInitialized
	 * @param attributeName
	 * @return {Boolean}
	 */
	isAttributeInitialized: function(attributeName) {
		return !this.get('isNew') || this.get(attributeName) !== undefined;
	}

});

CoreModel.reopenClass({

	/**
	 * At extend time, this method goes though and declares properties
	 * on the class for all attributes that were declared. It's done
	 * this way so the name of the attributes is known when creating
	 * the computed property.
	 *
	 * @method declareAttributes
	 * @param {Object} attributes
	 * @private
	 * @static
	 */
	declareAttributes: function(attributes) {
		var obj = {};

		Ember.runInDebug(function() {
			var RESERVED_NAMES = EmberGraphSet.create();
			RESERVED_NAMES.addObjects(['id', 'type', 'content', 'length', 'model']);

			Object.keys(attributes).forEach(function(name) {
				Ember.assert('`' + name + '` cannot be used as an attribute name.', !RESERVED_NAMES.contains(name));
				Ember.assert('An attribute name cannot start with an underscore.', name.charAt(0) !== '_');
				Ember.assert('Attribute names must start with a lowercase letter.', name.charAt(0).match(/[a-z]/));
			});
		});

		Object.keys(attributes).forEach(function(name) {
			obj[name] = createAttribute(name, attributes[name].options);
		});

		this.reopen(obj);
	},

	/**
	 * A set of all of the attribute names for this model.
	 *
	 * @property attributes
	 * @type Set
	 * @static
	 * @readOnly
	 */
	attributes: computed({
		get() {
			const attributes = EmberGraphSet.create();

			this.eachComputedProperty(function(name, meta) {
				if (meta.isAttribute) {
					attributes.addObject(name);
				}
			});

			return attributes;
		}
	}),

	/**
	 * Returns the metadata for the given property name. This should
	 * always be used over `metaForProperty` just in case the
	 * implementations ever have to differ.
	 *
	 * @method metaForAttribute
	 * @param {String} attributeName
	 * @return {Object}
	 * @static
	 */
	metaForAttribute: Ember.aliasMethod('metaForProperty'),

	/**
	 * @method isAttribute
	 * @param {String} propertyName
	 * @return {Boolean}
	 * @static
	 */
	isAttribute: function(propertyName) {
		return Ember.get(this, 'attributes').contains(propertyName);
	},

	/**
	 * Calls the callback for each attribute defined on the model.
	 *
	 * @method eachAttribute
	 * @param {Function} callback Function that takes `name` and `meta` parameters
	 * @param [binding] Object to use as `this`
	 * @static
	 */
	eachAttribute: function(callback, binding) {
		this.eachComputedProperty(function(name, meta) {
			if (meta.isAttribute) {
				callback.call(binding, name, meta);
			}
		});
	}

});

export default CoreModel;