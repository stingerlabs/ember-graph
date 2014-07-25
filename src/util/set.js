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