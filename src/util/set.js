EG.Set = Em.Set.extend({

	init: function(items) {
		// Suppress deprecation warning until we re-implement
		// Also make sure groundskeeper doesn't remove the code
		var d = 'deprecate';
		var deprecate = Em[d];
		Em[d] = function() {};
		this._super(items);
		Em[d] = deprecate;
	},

	withoutAll: function(items) {
		var ret = this.copy();
		ret.removeObjects(items);
		return ret;
	}
});

Em.Set.reopen({

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