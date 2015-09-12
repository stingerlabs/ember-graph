import Ember from 'ember';

/* eslint-disable */
/**
 * Pulled from the Ember 1.13 release.
 *
 * withoutAll added by me
 *
 * TODO: Remove and use ES6 Set
 */
export default Ember.CoreObject.extend(Ember.MutableEnumerable, Ember.Copyable, Ember.Freezable, {

	length: 0,

	clear() {
		if (this.isFrozen) { throw new Ember.Error(Ember.FROZEN_ERROR); }

		var len = Ember.get(this, 'length');
		if (len === 0) { return this; }

		var guid;

		this.enumerableContentWillChange(len, 0);
		Ember.propertyWillChange(this, 'firstObject');
		Ember.propertyWillChange(this, 'lastObject');

		for (var i=0; i < len; i++) {
			guid = Ember.guidFor(this[i]);
			delete this[guid];
			delete this[i];
		}

		Ember.set(this, 'length', 0);

		Ember.propertyDidChange(this, 'firstObject');
		Ember.propertyDidChange(this, 'lastObject');
		this.enumerableContentDidChange(len, 0);

		return this;
	},

	isEqual(obj) {
		// fail fast
		if (!Ember.Enumerable.detect(obj)) {
			return false;
		}

		var loc = Ember.get(this, 'length');
		if (Ember.get(obj, 'length') !== loc) {
			return false;
		}

		while (--loc >= 0) {
			if (!obj.contains(this[loc])) {
				return false;
			}
		}

		return true;
	},

	add: Ember.aliasMethod('addObject'),

	remove: Ember.aliasMethod('removeObject'),

	pop() {
		if (Ember.get(this, 'isFrozen')) {
			throw new Ember.Error(Ember.FROZEN_ERROR);
		}

		var obj = this.length > 0 ? this[this.length-1] : null;
		this.remove(obj);
		return obj;
	},

	push: Ember.aliasMethod('addObject'),

	shift: Ember.aliasMethod('pop'),

	unshift: Ember.aliasMethod('push'),

	addEach: Ember.aliasMethod('addObjects'),

	removeEach: Ember.aliasMethod('removeObjects'),

	init(items) {
		// Suppress deprecation notices
		// Also make sure groundskeeper doesn't remove the code
		const name = 'deprecate';
		const deprecate = Ember[name];
		Ember[name] = () => {};
		this._super(...arguments);
		Ember[name] = deprecate;

		if (items) {
			this.addObjects(items);
		}
	},

	nextObject(idx) {
		return this[idx];
	},

	firstObject: Ember.computed(function() {
		return this.length > 0 ? this[0] : undefined;
	}),

	lastObject: Ember.computed(function() {
		return this.length > 0 ? this[this.length-1] : undefined;
	}),

	addObject(obj) {
		if (Ember.get(this, 'isFrozen')) {
			throw new Ember.Error(Ember.FROZEN_ERROR);
		}

		if (Ember.isNone(obj)) {
			return this; // nothing to do
		}

		var guid = Ember.guidFor(obj);
		var idx  = this[guid];
		var len  = Ember.get(this, 'length');
		var added;

		if (idx>=0 && idx<len && (this[idx] === obj)) {
			return this; // added
		}

		added = [obj];

		this.enumerableContentWillChange(null, added);
		Ember.propertyWillChange(this, 'lastObject');

		len = Ember.get(this, 'length');
		this[guid] = len;
		this[len] = obj;
		Ember.set(this, 'length', len+1);

		Ember.propertyDidChange(this, 'lastObject');
		this.enumerableContentDidChange(null, added);

		return this;
	},

	removeObject(obj) {
		if (Ember.get(this, 'isFrozen')) {
			throw new Ember.Error(Ember.FROZEN_ERROR);
		}

		if (Ember.isNone(obj)) {
			return this; // nothing to do
		}

		var guid = Ember.guidFor(obj);
		var idx  = this[guid];
		var len = Ember.get(this, 'length');
		var isFirst = idx === 0;
		var isLast = idx === len-1;
		var last, removed;


		if (idx>=0 && idx<len && (this[idx] === obj)) {
			removed = [obj];

			this.enumerableContentWillChange(removed, null);
			if (isFirst) { Ember.propertyWillChange(this, 'firstObject'); }
			if (isLast) { Ember.propertyWillChange(this, 'lastObject'); }

			// swap items - basically move the item to the end so it can be removed
			if (idx < len-1) {
				last = this[len-1];
				this[idx] = last;
				this[Ember.guidFor(last)] = idx;
			}

			delete this[guid];
			delete this[len-1];
			Ember.set(this, 'length', len-1);

			if (isFirst) { Ember.propertyDidChange(this, 'firstObject'); }
			if (isLast) { Ember.propertyDidChange(this, 'lastObject'); }
			this.enumerableContentDidChange(removed, null);
		}

		return this;
	},

	contains(obj) {
		return this[Ember.guidFor(obj)]>=0;
	},

	copy() {
		var C = this.constructor;
		var ret = new C();
		var loc = Ember.get(this, 'length');

		set(ret, 'length', loc);
		while (--loc >= 0) {
			ret[loc] = this[loc];
			ret[Ember.guidFor(this[loc])] = loc;
		}
		return ret;
	},

	toString() {
		var len = this.length;
		var array = [];
		var idx;

		for (idx = 0; idx < len; idx++) {
			array[idx] = this[idx];
		}
		return Ember.fmt('Ember.Set<%@>', [array.join(',')]);
	},

	withoutAll(items) {
		var ret = this.copy();
		ret.removeObjects(items);
		return ret;
	}
});
/* eslint-enable */