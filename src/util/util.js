var reduce = EG.ArrayPolyfills.reduce;

/**
 * Denotes that method must be implemented in a subclass.
 * If it's not overridden, calling it will throw an error.
 *
 * ```js
 * var Shape = Ember.Object.extend({
 *     getNumberOfSides: EG.abstractMethod('getNumberOfSides')
 * });
 * ```
 *
 * @method abstractMethod
 * @param {String} methodName
 * @return {Function}
 * @namespace EmberGraph
 */
EG.abstractMethod = function(methodName) {
	return function() {
		throw new Error('You failed to implement the abstract `' + methodName + '` method.');
	};
};

/**
 * Denotes that a property must be overridden in a subclass.
 * If it's not overridden, using it will throw an error.
 *
 * ```js
 * var Shape = Ember.Object.extend({
 *     name: EG.abstractProperty('name')
 * });
 * ```
 *
 * @method abstractProperty
 * @param {String} propertyName
 * @return {ComputedProperty}
 * @namespace EmberGraph
 */
EG.abstractProperty = function(propertyName) {
	return Em.computed(function() {
		throw new Error('You failed to override the abstract `' + propertyName + '` property.');
	}).property();
};

/**
 * Generates a version 4 (random) UUID.
 *
 * @method generateUUID
 * @return {String}
 * @namespace EmberGraph
 */
EG.generateUUID = function() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random()*16|0; // jshint ignore:line
		var v = (c == 'x' ? r : (r&0x3|0x8)); // jshint ignore:line
		return v.toString(16);
	});
};

/**
 * Compares the contents of two arrays for equality. Uses
 * Ember.Set to make the comparison, so the objects must
 * be equal with `===`.
 *
 * @method arrayContentsEqual
 * @param {Array} a
 * @param {Array} b
 * @returns {Boolean}
 * @namespace EmberGraph
 */
EG.arrayContentsEqual = function(a, b) {
	return (a.length === b.length && (new Em.Set(a)).isEqual(b));
};

/**
 * Takes a list of record objects (with `type` and `id`)
 * and groups them into arrays based on their type.
 *
 * @method groupRecords
 * @param {Object[]} records
 * @return {Array[]}
 * @namespace EmberGraph
 */
EG.groupRecords = function(records) {
	var groups = reduce.call(records, function(groups, record) {
		if (groups[record.type]) {
			groups[record.type].push(record);
		} else {
			groups[record.type] = [record];
		}

		return groups;
	}, {});

	return reduce.call(Em.keys(groups), function(array, key) {
		if (groups[key].length > 0) {
			array.push(groups[key]);
		}

		return array;
	}, []);
};

/**
 * Calls `callback` once for each value of the given object.
 * The callback receives `key` and `value` parameters.
 *
 * @method values
 * @param {Object} obj
 * @param {Function} callback
 * @param {Any} [thisArg=undefined]
 * @namespace EmberGraph
 */
EG.values = function(obj, callback, thisArg) {
	var keys = Em.keys(obj);

	for (var i = 0; i < keys.length; ++i) {
		callback.call(thisArg, keys[i], obj[keys[i]]);
	}
};

/**
 * Works like `Ember.aliasMethod` only it displays a
 * deprecation warning before the aliased method is called.
 *
 * @method deprecateMethod
 * @param {String} message
 * @param {String} method
 * @return {Function}
 * @namespace EmberGraph
 */
EG.deprecateMethod = function(message, method) {
	return function() {
		Em.deprecate(message);
		this[method].apply(this, arguments);
	};
};

/**
 * Works like 'Ember.computed.alias' only it displays a
 * deprecation warning before the aliased property is returned.
 *
 * @method deprecateProperty
 * @param {String} message
 * @param {String} property
 * @return {ComputedProperty}
 * @namespace EmberGraph
 */
EG.deprecateProperty = function(message, property) {
	return Em.computed(function(key, value) {
		Em.deprecate(message);

		if (arguments.length > 1) {
			this.set(property, value);
		}

		return this.get(property);
	}).property(property);
};