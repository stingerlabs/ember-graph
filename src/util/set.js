import Ember from 'ember';
import Copyable from 'ember-graph/util/copyable';

/* eslint-disable */
/**
 * Pulled from the Ember 1.13 release.
 *
 * withoutAll added by me
 *
 * TODO: Remove and use ES6 Set
 */
export default Ember.CoreObject.extend(Ember.MutableArray, Copyable, {

	length: 0,

	clear() {
		var len = Ember.get(this, 'length');
		if (len === 0) { return this; }

		var guid;

		this.arrayContentWillChange(len, 0);

		for (var i=0; i < len; i++) {
			guid = Ember.guidFor(this[i]);
			delete this[guid];
			delete this[i];
		}

		Ember.set(this, 'length', 0);

		Ember.notifyPropertyChange(this, 'firstObject');
		Ember.notifyPropertyChange(this, 'lastObject');
		this.arrayContentDidChange(len, 0);

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
			if (!obj.includes(this[loc])) {
				return false;
			}
		}

		return true;
	},

	add() {
		return this.addObject(...arguments);
	},

	remove() {
		return this.removeObject(...arguments);
	},

	pop() {
		var obj = this.length > 0 ? this[this.length-1] : null;
		this.remove(obj);
		return obj;
	},

	push() {
		return this.addObject(...arguments);
	},

	shift() {
		return this.pop(...arguments);
	},

	unshift() {
		return this.push(...arguments);
	},

	addEach() {
		return this.addObject(...arguments);
	},

	removeEach() {
		return this.removeObjects(...arguments);
	},

	init(items) {
		this._super(...arguments);

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

		this.arrayContentWillChange(null, added);

		len = Ember.get(this, 'length');
		this[guid] = len;
		this[len] = obj;
		Ember.set(this, 'length', len+1);

		Ember.notifyPropertyChange(this, 'lastObject');
		this.arrayContentDidChange(null, added);

		return this;
	},

	removeObject(obj) {
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

			this.arrayContentWillChange(removed, null);

			// swap items - basically move the item to the end so it can be removed
			if (idx < len-1) {
				last = this[len-1];
				this[idx] = last;
				this[Ember.guidFor(last)] = idx;
			}

			delete this[guid];
			delete this[len-1];
			Ember.set(this, 'length', len-1);

			if (isFirst) { Ember.notifyPropertyChange(this, 'firstObject'); }
			if (isLast) { Ember.notifyPropertyChange(this, 'lastObject'); }
			this.arrayContentDidChange(removed, null);
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
		return 'Ember.Set<' + array.join(',') + '>';
	},

	withoutAll(items) {
		var ret = this.copy();
		ret.removeObjects(items);
		return ret;
	}
});
/* eslint-enable */
