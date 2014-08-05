var disallowedAttributeNames = new Em.Set(['id', 'type', 'content', 'length']);

var createAttribute = function(attributeName, options) {
	var meta = {
		isAttribute: true,
		type: options.type,
		isRequired: !options.hasOwnProperty('defaultValue') || options.serverOnly === true,
		defaultValue: options.defaultValue,
		isReadOnly: options.readOnly === true || options.serverOnly === true,
		isServerOnly: options.serverOnly === true,

		// These should really only be used internally by the model class
		isEqual: options.isEqual
	};

	return Em.computed(function(key, value) {
		var meta = this.constructor.metaForAttribute(key);
		var server = this.get('_serverAttributes.' + key);
		var client = this.get('_clientAttributes.' + key);
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
				delete this.get('_clientAttributes')[key];
			} else {
				this.set('_clientAttributes.' + key, value);
			}

			// This only notifies observers of the object itself, not the properties.
			// At this point in time, that's only the `_areAttributesDirty` property.
			this.notifyPropertyChange('_clientAttributes');
			return value;
		}

		return current;
	}).property('_clientAttributes.' + attributeName, '_serverAttributes.' + attributeName).meta(meta);
};

EG.Model.reopenClass({

	/**
	 * Goes through the subclass and declares an additional property for each attribute.
	 */
	_declareAttributes: function(attributes) {
		var obj = {};

		Em.keys(attributes).forEach(function(attributeName) {
			obj[attributeName] = createAttribute(attributeName, attributes[attributeName].options);
		});

		this.reopen(obj);
	},

	/**
	 * A set of all of the attribute names for this model.
	 *
	 * @property attributes
	 * @for Model
	 * @type Set
	 * @static
	 * @readOnly
	 */
	attributes: Em.computed(function() {
		var attributes = new Em.Set();

		this.eachComputedProperty(function(name, meta) {
			if (meta.isAttribute) {
				Em.assert('`' + name + '` cannot be used as an attribute name.',
					!disallowedAttributeNames.contains(name));

				attributes.addObject(name);
			}
		});

		return attributes;
	}).property(),

	/**
	 * Just a more semantic alias for `metaForProperty`
	 *
	 * @method metaForAttribute
	 * @for Model
	 * @param {String} attributeName
	 * @return {Object}
	 * @static
	 */
	metaForAttribute: Em.aliasMethod('metaForProperty'),

	/**
	 * @method isAttribute
	 * @for Model
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
	 * @for Model
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

EG.Model.reopen({

	/**
	 * Represents the latest set of properties from the server. The only way these
	 * can be updated is if the server sends over new JSON through an operation,
	 * or a save operation successfully completes, in which case `_clientAttributes`
	 * will be copied into this.
	 */
	_serverAttributes: null,

	/**
	 * Represents the state of the object on the client. These are likely different
	 * from what the server has and are completely temporary until saved.
	 */
	_clientAttributes: null,

	_initializeAttributes: function() {
		this.set('_serverAttributes', Em.Object.create());
		this.set('_clientAttributes', Em.Object.create());
	}.on('init'),

	/**
	 * Watches the client side attributes for changes and detects if there are
	 * any dirty attributes based on how many client attributes differ from
	 * the server attributes.
	 */
	_areAttributesDirty: Em.computed(function() {
		return Em.keys(this.get('_clientAttributes') || {}).length > 0;
	}).property('_clientAttributes'),

	/**
	 * Returns an object that contains every attribute
	 * that has been changed since the last save.
	 *
	 * @method changedAttributes
	 * @for Model
	 * @return {Object} Keys are attribute names, values are arrays with [oldVal, newVal]
	 */
	changedAttributes: function() {
		var diff = {};
		var store = this.get('store');

		this.constructor.eachAttribute(function(name, meta) {
			var server = this.get('_serverAttributes.' + name);
			var client = this.get('_clientAttributes.' + name);
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
	 * @for Model
	 */
	rollbackAttributes: function() {
		this.set('_clientAttributes', Em.Object.create());
	},

	/**
	 * Loads attributes from the server.
	 */
	loadAttributesFromServer: function(json) {
		this.constructor.eachAttribute(function(attributeName, meta) {
			Em.assert('Your JSON is missing the \'' + attributeName + '\' property.',
				!meta.isRequired || json.hasOwnProperty(attributeName));

			var value = (json.hasOwnProperty(attributeName) ? json[attributeName] : meta.defaultValue);

			this.set('_serverAttributes.' + attributeName, value);
			this._synchronizeAttribute(attributeName);
		}, this);
	},

	/**
	 * When an attribute's value is set directly (like in `extractPayload`), this
	 * will synchronize the server and client attributes and fix the dirty state.
	 */
	_synchronizeAttribute: function(name) {
		var server = this.get('_serverAttributes.' + name);
		var client = this.get('_clientAttributes.' + name);

		var meta = this.constructor.metaForAttribute(name),
        scope = meta.isEqual ? meta : this.get('store').attributeTypeFor(meta.type);
		if (scope.isEqual(server, client)) {
			delete this.get('_clientAttributes')[name];
			this.notifyPropertyChange('_clientAttributes');
		}
	},

	/**
	 * Sets up attributes given to the constructor for this record.
	 * Equivalent to setting the attribute values individually.
	 *
	 * @private
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
	 * @for Model
	 * @param attributeName
	 * @return {Boolean}
	 */
	isAttributeInitialized: function(attributeName) {
		return !this.get('isNew') || this.get(attributeName) !== undefined;
	}
});
