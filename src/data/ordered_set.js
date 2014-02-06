Eg.OrderedStringSet = Em.CoreObject.extend(Em.MutableEnumerable, Em.Copyable, Em.Freezable, {
	length: 0,
	itemExistence: {},
	itemOrder: [],

	init: function(strings) {
		this._super();
		this.itemExistence = {};
		this.itemOrder = [];

		if (strings) {
			this.addObjects(strings);
		}
	},

	nextObject: function(string) {
		return this.itemOrder[string];
	},

	objectAt: function(index) {
		return this.itemOrder[index];
	},

	contains: function(string) {
		return !!this.itemExistence[string];
	},

	indexOf: function(string) {
		return this.itemOrder.indexOf(string);
	},

	isEqual: function(other) {
		if (Em.get(other, 'length') !== Em.get(this, 'length')) {
			return false;
		}

		return (other || []).reduce(function(equal, string, index) {
			return equal && (string === this.itemOrder[index]);
		}.bind(this), true);
	},

	addObject: function(string) {
		if (typeof string !== 'string') { throw new Error('This is a set for strings only at this time.'); }
		if (this.get('isFrozen')) { throw new Em.Error(Ember.FROZEN_ERROR); }

		if (!this.itemExistence[string]) {
			this.enumerableContentWillChange(null, [string]);
			Em.propertyWillChange(this, 'lastObject');

			this.itemOrder.push(string);
			this.itemExistence[string] = true;

			Em.propertyDidChange(this, 'lastObject');
			this.enumerableContentDidChange(null, [string]);

			this.set('length', this.get('length') + 1);
		}

		return string;
	},

	addObjects: function(strings) {
		Em.beginPropertyChanges(this);
		(strings || []).forEach(function(string){
			this.addObject(string);
		}, this);
		Em.endPropertyChanges(this);
		return this;
	},

	addObjectAt: function(string, index) {
		if (this.get('isFrozen')) { throw new Em.Error(Ember.FROZEN_ERROR); }

		if (!this.itemExistence[string]) {
			if (index < 0) {
				index = 0;
			} else if (index >= this.itemOrder.length) {
				index = this.itemOrder.length;
			}

			var isFirst = (index === 0);
			var isLast = (index === this.itemOrder.length);

			this.enumerableContentWillChange(null, [string]);
			if (isFirst) { Em.propertyWillChange(this, 'firstObject'); }
			if (isLast) { Em.propertyWillChange(this, 'lastObject'); }

			this.itemOrder.splice(index, 0, string);
			this.itemExistence[string] = true;

			if (isFirst) { Em.propertyDidChange(this, 'firstObject'); }
			if (isLast) { Em.propertyDidChange(this, 'lastObject'); }
			this.enumerableContentDidChange(null, [string]);

			this.set('length', this.get('length') + 1);
		}

		return string;
	},

	removeObject: function(string) {
		if (this.get('isFrozen')) { throw new Em.Error(Ember.FROZEN_ERROR); }

		if (this.itemExistence[string]) {
			var index = this.itemOrder.indexOf(string);
			if (index < 0) { return null; }

			var isFirst = (index === 0);
			var isLast = (index === this.itemOrder.length - 1);

			this.enumerableContentWillChange([string], null);
			if (isFirst) { Em.propertyWillChange(this, 'firstObject'); }
			if (isLast) { Em.propertyWillChange(this, 'lastObject'); }

			this.itemOrder.splice(index, 1);

			delete this.itemExistence[string];

			if (isFirst) { Em.propertyDidChange(this, 'firstObject'); }
			if (isLast) { Em.propertyDidChange(this, 'lastObject'); }
			this.enumerableContentDidChange([string], null);

			this.set('length', this.get('length') - 1);
		}

		return string;
	},

	copy: function() {
		return new this.constructor(this.itemOrder);
	},

	get: function(key) {
		return Em.get(this, key);
	},

	set: function(key, value) {
		return Em.set(this, key, value);
	},

	/**
	 * Computes the difference between this set and another set.
	 *
	 * @param {Array} other The items to subtract from this set
	 * @returns {OrderedSet} A new set containing only those in this set
	 */
	subtract: function(other) {
		if (!Em.isArray(other)) {
			return null;
		}

		var ret = this.copy();

		other.forEach(function(item) {
			ret.removeObject(item);
		});

		return ret;
	}
});