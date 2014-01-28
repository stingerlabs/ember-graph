var disallowedAttributeNames = new Ember.Set(['id', 'type']);

var defaultCompare = function(oldVal, newVal) {
	return (oldVal === newVal);
};

/**
 * Possible options:
 * type: Type of the attribute. Required.
 * defaultValue: Value if not present when created. If omitted, property is required.
 * compare: Function to compare two instances of it. Return true if equal, false otherwise. Defaults to using ===.
 * readOnly: True if the attribute should be immutable. Defaults to false.
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
		readOnly: options.readOnly === true
	};

	return Em.computed(function(key, value) {

	}).property('originalData', 'modifiedData').meta(meta);
};

/**
 * @class Model
 */
Eg.Model.reopenClass({

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
			var oldVal = this.get('originalData.' + name);
			var newVal = this.get('modifiedData.' + name);

			if (!meta.compare(oldVal, newVal)) {
				diff[name] = [oldVal, newVal];
			}
		}, this);

		return diff;
	},

	/**
	 * @instance
	 */
	rollbackAttributes: function() {
		this.constructor.eachAttribute(function(name, meta) {
			this.set('modifiedData.' + name, this.get('originalData.' + name));
		}, this);
	}
});