var disallowedAttributeNames = new Ember.Set(['id', 'type']);

var defaultCompare = function(oldVal, newVal) {
	return (oldVal === newVal);
};

var defaultValidity = function(value) {
	return true;
};

/**
 * Possible options:
 * type: Type of the attribute. Required.
 * defaultValue: Value if not present when created. If omitted, property is required.
 * compare: Function to compare two instances of it. Return true if equal, false otherwise. Defaults to using ===.
 * readOnly: True if the attribute should be immutable. Defaults to false.
 * valid: A function that returns whether the value is valid or not. Defaults to always valid.
 *
 * @param options
 * @returns {Em.ComputedProperty}
 */
Eg.attr = function(options) {
	var meta = {
		isAttribute: true,
		type: options.type,
		isRequired: options.hasOwnProperty('defaultValue'),
		defaultValue: options.defaultValue,
		compare: options.compare || defaultCompare,
		readOnly: options.readOnly === true,
		valid: options.valid || defaultValidity
	};

	return Em.computed(function(key, value) {
		if (arguments.length > 1) {
			if (meta.readOnly) {
				Ember.assert('Cannot modify a read-only property.');
				return undefined;
			}

			if (!meta.valid(value)) {
				Ember.assert('The value \'' + value + '\' wasn\'t valid for the \'' + key + '\' property.');
				return undefined;
			}

			if (value === undefined) {
				Ember.assert('`undefined` is not a valid property value.');
				return undefined;
			}

			if (!meta.compare(value, this.get('_serverAttributes.' + key))) {
				// TODO: Mark as dirty
				this.set('_clientAttributes.' + key, value);
			}

			return value;
		}

		var client = this.get('_clientAttributes.' + key);
		return (client === undefined ? this.get('_serverAttributes.' + key) : client);
	}).property('_clientAttributes').meta(meta);
};

/**
 * @class Model
 */
Eg.Model.reopenClass({

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
	 * @static
	 */
	attributes: Em.computed(function() {
		var attributes = new Em.Set();

		this.eachComputedProperty(function(name, meta) {
			if (meta.isAttribute) {
				Em.assert('The ' + name + ' cannot be used as an attribute name.',
					!disallowedAttributeNames.contains(name));

				attributes.pushObject(name);
			}
		});

		return attributes;
	}),

	/**
	 * @instance
	 * @param name Name of property
	 * @returns {Boolean} True if attribute, false otherwise
	 */
	isAttribute: function(name) {
		return Em.get(this.constructor, 'attributes').contains(name);
	},

	/**
	 * Calls the callback for each attribute defined on the model.
	 *
	 * @param callback Function that takes `name` and `meta` parameters
	 * @param binding Object to use as `this`
	 * @static
	 */
	eachAttribute: function(callback, binding) {
		this.eachComputedProperty(function(name, meta) {
			if (meta.isAttribute) {
				callback.call(binding, name, meta);
			}
		});
	},

	/**
	 * @instance
	 * @returns {Object}
	 */
	changedAttributes: function() {
		var diff = {};

		this.constructor.eachAttribute(function(name, meta) {
			var server = this.get('_serverAttributes.' + name);
			var client = this.get('_clientAttributes.' + name);

			if (!meta.compare(server, client)) {
				diff[name] = [server, client];
			}
		}, this);

		return diff;
	},

	/**
	 * @instance
	 */
	rollbackAttributes: function() {
		this.constructor.eachAttribute(function(name, meta) {
			this.set('_clientAttributes.' + name, this.get('_serverAttributes.' + name));
		}, this);
	}
});