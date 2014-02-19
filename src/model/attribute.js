var disallowedAttributeNames = new Em.Set(['id', 'type', 'content']);

/**
 * Possible options:
 * type: Type of the attribute. Required.
 * defaultValue: Value if not present when created. If included, property is optional.
 * readOnly: True if the attribute should be immutable. Defaults to false.
 * isEqual: Function to compare two instances of the property. Defaults to using the type comparison function.
 * isValid: A function that returns whether the value is valid or not. Defaults to using the type validity function.
 *
 * @param options
 * @returns {Em.ComputedProperty}
 */
Eg.attr = function(options) {
	var meta = {
		isAttribute: true,
		type: options.type,
		isRequired: !options.hasOwnProperty('defaultValue'),
		defaultValue: options.defaultValue,
		readOnly: options.readOnly === true,

		// These should really only be used internally by the model class
		isEqual: options.isEqual,
		isValid: options.isValid
	};

	var attribute = Em.computed(function(key, value) {
		var server = this.get('_serverAttributes.' + key);
		var client = this.get('_clientAttributes.' + key);
		var current = (client === undefined ? server : client);

		Eg.debug(function() {
			if (arguments.length > 1 && value === undefined) {
				Eg.debug.warn('`undefined` is not a valid property value.');
			}
		});

		if (value !== undefined) {
			var isValid = meta.isValid || this.get('store').attributeTypeFor(meta.type).isValid;
			if (!isValid(value)) {
				Eg.debug.warn('The value \'' + value + '\' wasn\'t valid for the \'' + key + '\' property.');
				return current;
			}

			var isEqual = meta.isEqual || this.get('store').attributeTypeFor(meta.type).isEqual;
			if (isEqual(server, value)) {
				delete this.get('_clientAttributes')[key];
				this.notifyPropertyChange('_clientAttributes');
				return server;
			} else {
				this.set('_clientAttributes.' + key, value);
				this.notifyPropertyChange('_clientAttributes');
				return value;
			}
		}

		return current;
	}).property('_clientAttributes', '_serverAttributes').meta(meta);

	return (options.readOnly ? attribute.readOnly() : attribute);
};

/**
 * @class Model
 */
Eg.Model.reopenClass({

	/**
	 * @static
	 * @type {Set}
	 */
	attributes: Em.computed(function() {
		var attributes = new Em.Set();

		this.eachComputedProperty(function(name, meta) {
			if (meta.isAttribute) {
				Eg.debug.assert('The ' + name + ' cannot be used as an attribute name.',
					!disallowedAttributeNames.contains(name));

				attributes.addObject(name);
			}
		});

		return attributes;
	}).property(),

	/**
	 * Just a more semantic alias for `metaForProperty`
	 * @alias metaForProperty
	 */
	metaForAttribute: Em.aliasMethod('metaForProperty'),

	/**
	 * @param name Name of property
	 * @returns {Boolean} True if attribute, false otherwise
	 * @static
	 */
	isAttribute: function(name) {
		return Em.get(this, 'attributes').contains(name);
	},

	/**
	 * Calls the callback for each attribute defined on the model.
	 *
	 * @param {Function} callback Function that takes `name` and `meta` parameters
	 * @param {*} [binding] Object to use as `this`
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

Eg.Model.reopen({

	/**
	 * Represents the latest set of properties from the server. The only way these
	 * can be updated is if the server sends over new JSON through an operation,
	 * or a save operation successfully completes, in which case `_clientAttributes`
	 * will be copied into this.
	 *
	 * @private
	 */
	_serverAttributes: null,

	/**
	 * Represents the state of the object on the client. These are likely different
	 * from what the server has and are completely temporary until saved.
	 *
	 * @private
	 */
	_clientAttributes: null,

	/**
	 * Watches the client side attributes for changes and detects if there are
	 * any dirty attributes based on how many client attributes differ from
	 * the server attributes.
	 */
	_areAttributesDirty: Em.computed(function() {
		return Em.keys(this.get('_clientAttributes') || {}).length > 0;
	}).property('_clientAttributes'),

	/**
	 * @returns {Object} Keys are attribute names, values are arrays with [oldVal, newVal]
	 */
	changedAttributes: function() {
		var diff = {};

		this.constructor.eachAttribute(function(name, meta) {
			var server = this.get('_serverAttributes.' + name);
			var client = this.get('_clientAttributes.' + name);

			if (client === undefined) {
				return;
			}

			diff[name] = [server, client];
		}, this);

		return diff;
	},

	/**
	 * Resets all attribute changes to last known server attributes.
	 */
	rollbackAttributes: function() {
		this.set('_clientAttributes', {});
	},

	/**
	 * Loads attributes from the server.
	 *
	 * @param {Object} json The JSON with properties to load
	 * @private
	 */
	_loadAttributes: function(json) {
		this.constructor.eachAttribute(function(name, meta) {
			Eg.debug.assert('Your JSON is missing the \'' + name + '\' property.',
				!meta.isRequired || json.hasOwnProperty(name));

			var value = (json.hasOwnProperty(name) ? json[name] : meta.defaultValue);

			// TODO: Do we want a way to accept non-valid value from the server?
			var isValid = meta.isValid || this.get('store').attributeTypeFor(meta.type).isValid;
			if (isValid(value)) {
				this.set('_serverAttributes.' + name, value);
			} else {
				Eg.debug.assert('Your value for the \'' + name + '\' property is inValid.');
				this.set('_serverAttributes.' + name, meta.defaultValue);
			}
		}, this);

		this.notifyPropertyChange('_serverAttributes');
	}
});