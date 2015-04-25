import Ember from 'ember';
import AttributeType from 'ember-graph/attribute_type/type';

/**
 * @class DateType
 * @extends AttributeType
 * @constructor
 */
export default AttributeType.extend({

	/**
	 * Converts any Date object, number or string to a timestamp.
	 *
	 * @method serialize
	 * @param {Date|Number|String} date
	 * @return {Number}
	 */
	serialize: function(date) {
		switch (Ember.typeOf(date)) {
			case 'date':
				return date.getTime();
			case 'number':
				return date;
			case 'string':
				return new Date(date).getTime();
			default:
				return null;
		}
	},

	/**
	 * Converts any numeric or string timestamp to a Date object.
	 * Everything else gets converted to `null`.
	 *
	 * @method deserialize
	 * @param {Number|String} timestamp
	 * @return {Date}
	 */
	deserialize: function(timestamp) {
		switch (Ember.typeOf(timestamp)) {
			case 'number':
			case 'string':
				return new Date(timestamp);
			default:
				return null;
		}
	},

	/**
	 * Converts both arguments to a timestamp, then compares.
	 *
	 * @param {Date} a
	 * @param {Date} b
	 * @return {Boolean}
	 */
	isEqual: function(a, b) {
		var aNone = (a === null);
		var bNone = (b === null);

		if (aNone && bNone) {
			return true;
		} else if ((aNone && !bNone) || (!aNone && bNone)) {
			return false;
		} else {
			return (new Date(a).getTime() === new Date(b).getTime());
		}
	}
});