import Ember from 'ember';

export default Ember.Set.extend({

	init: function(items) {
		// Suppress deprecation warning until we re-implement
		// Also make sure groundskeeper doesn't remove the code
		var d = 'deprecate';
		var deprecate = Ember[d];
		Ember[d] = function() {};
		this._super(items);
		Ember[d] = deprecate;
	},

	withoutAll: function(items) {
		var ret = this.copy();
		ret.removeObjects(items);
		return ret;
	}
});

Ember.Set.reopen({

	/**
	 * Returns a copy of this set without the passed items.
	 *
	 *
	 * @param {Array} items
	 * @returns {Set}
	 * @for EG
	 */
	withoutAll: function(items) {
		var ret = this.copy();
		ret.removeObjects(items);
		return ret;
	}
});