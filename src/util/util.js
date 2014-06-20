var reduce = Em.ArrayPolyfills.reduce;

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
 * @category top-level
 * @for EG
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
 * @category top-level
 * @for EG
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
 * @category top-level
 * @for EG
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
 * @category top-level
 * @for EG
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
 * @category top-level
 * @for EG
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