import Ember from 'ember';
import EmberGraphSet from 'ember-graph/util/set';

import { computed } from 'ember-graph/util/computed';

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
function abstractMethod(methodName) {
	return function() {
		throw new Ember.Error('You failed to implement the abstract `' + methodName + '` method.');
	};
}

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
function abstractProperty(propertyName) {
	return computed({
		get() {
			throw new Ember.Error('You failed to override the abstract `' + propertyName + '` property.');
		}
	});
}

/**
 * Generates a version 4 (random) UUID.
 *
 * @method generateUUID
 * @return {String}
 * @namespace EmberGraph
 */
function generateUUID() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random() * 16|0; // eslint-disable-line
		var v = (c == 'x' ? r : (r&0x3|0x8)); // eslint-disable-line
		return v.toString(16);
	});
}

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
function arrayContentsEqual(a, b) {
	var set = EmberGraphSet.create();
	set.addObjects(a);
	return (a.length === b.length && set.isEqual(b));
}

/**
 * Takes a list of record objects (with `type` and `id`)
 * and groups them into arrays based on their type.
 *
 * @method groupRecords
 * @param {Object[]} records
 * @return {Array[]}
 * @namespace EmberGraph
 */
function groupRecords(records) {
	var groups = records.reduce(function(groups, record) {
		if (groups[record.type]) {
			groups[record.type].push(record);
		} else {
			groups[record.type] = [record];
		}

		return groups;
	}, {});

	return Object.keys(groups).reduce(function(array, key) {
		if (groups[key].length > 0) {
			array.push(groups[key]);
		}

		return array;
	}, []);
}

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
function values(obj, callback, thisArg) {
	var keys = Object.keys(obj);

	for (var i = 0; i < keys.length; ++i) {
		callback.call(thisArg, keys[i], obj[keys[i]]);
	}
}

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
function deprecateMethod(message, method) {
	return function() {
		Ember.deprecate(message);
		this[method].apply(this, arguments);
	};
}

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
function deprecateProperty(message, property) {
	return computed(property, {
		get() {
			Ember.deprecate(message);
			return this.get(property);
		},
		set(key, value) {
			this.set(property, value);
		}
	});
}

export {
	abstractMethod,
	abstractProperty,
	generateUUID,
	arrayContentsEqual,
	groupRecords,
	values,
	deprecateMethod,
	deprecateProperty
};