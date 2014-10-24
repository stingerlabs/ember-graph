var forEach = Em.ArrayPolyfills.forEach;

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

	return Em.computed(function(key, value) {
		var meta = this.constructor.metaForAttribute(key);
		var server = this.get('serverAttributes.' + key);
		var client = this.get('clientAttributes.' + key);
		var current = (client === undefined ? server : client);

		// New records can modify read only attributes. But not if they're server only
		if (arguments.length > 1 && meta.isReadOnly && !this.get('isNew')) {
			throw new Em.Error('Cannot set read-only property "' + key + '" on object: ' + this);
		}

		Em.runInDebug(function() {
			if (arguments.length > 1 && value === undefined) {
				Em.warn('`undefined` is not a valid property value.');
			}
		});

		if (value !== undefined) {
			var scope = meta.isEqual ? meta : this.get('store').attributeTypeFor(meta.type);

			if (scope.isEqual(server, value)) {
				delete this.get('clientAttributes')[key];
			} else {
				this.set('clientAttributes.' + key, value);
			}

			// This only notifies observers of the object itself, not the properties.
			// At this point in time, that's only the `_areAttributesDirty` property.
			this.notifyPropertyChange('clientAttributes');
			return value;
		}

		return current;
	}).property('clientAttributes.' + attributeName, 'serverAttributes.' + attributeName).meta(meta);
};

/**
 * This class serves as the base for Models and Embedded records.
 * This is considered private API and shouldn't be extended
 * unless you really know what you're doing.
 *
 * @class CoreModel
 * @abstract
 */
EG.CoreModel = Em.Object.extend({

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
	areAttributesDirty: Em.computed(function() {
		return Em.keys(this.get('clientAttributes') || {}).length > 0;
	}).property('clientAttributes'),

	_areAttributesDirty: EG.deprecateProperty('`_areAttributeDirty` is now `areAttributesDirty`', 'areAttributesDirty'),

	init: function() {
		this._super();

		this.setProperties({
			serverAttributes: Em.Object.create(),
			clientAttributes: Em.Object.create()
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
		this.set('clientAttributes', Em.Object.create());
	},

	/**
	 * Loads attributes from the server.
	 */
	loadAttributesFromServer: function(json) {
		var serverAttributes = this.get('serverAttributes');

		this.constructor.eachAttribute(function(attributeName, meta) {
			Em.assert('Your JSON is missing the \'' + attributeName + '\' property.',
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

EG.CoreModel.reopenClass({

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

		Em.runInDebug(function() {
			var RESERVED_NAMES = EG.Set.create();
			RESERVED_NAMES.addObjects(['id', 'type', 'content', 'length', 'model']);

			forEach.call(Em.keys(attributes), function(name) {
				Em.assert('`' + name + '` cannot be used as an attribute name.', !RESERVED_NAMES.contains(name));
				Em.assert('An attribute name cannot start with an underscore.', name.charAt(0) !== '_');
				Em.assert('Attribute names must start with a lowercase letter.', name.charAt(0).match(/[a-z]/));
			});
		});

		forEach.call(Em.keys(attributes), function(name) {
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
	attributes: Em.computed(function() {
		var attributes = EG.Set.create();

		this.eachComputedProperty(function(name, meta) {
			if (meta.isAttribute) {
				attributes.addObject(name);
			}
		});

		return attributes;
	}).property(),

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
	metaForAttribute: Em.aliasMethod('metaForProperty'),

	/**
	 * @method isAttribute
	 * @param {String} propertyName
	 * @return {Boolean}
	 * @static
	 */
	isAttribute: function(propertyName) {
		return Em.get(this, 'attributes').contains(propertyName);
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