import Ember from 'ember';

/**
 * Define HashMap class
 *
 * Simple use of associative array as hash table allowing buckets w/
 * chaining for duplicates.
 */

var RelationshipNode = Ember.Object.extend({

	next: undefined,
	prev: undefined,
	item: undefined,

	initialize: Ember.on('init', function() {
		this.setProperties({
			next: undefined,
			prev: undefined,
			item: undefined
		});
	})

});


var RelationshipHash = Ember.Object.extend({

	buckets: [],

	initialize: Ember.on('init', function() {
		this.setProperties({
			buckets: []
		});
	}),

	add(item, ids) {
		for (var i = 0; i < ids.length; ++i) {
			var newNode = RelationshipNode.create();
			newNode.item = item;
			if (this.buckets[ids[i]]) {
				// Push onto head of chain
				newNode.next = this.buckets[ids[i]];
				this.buckets[ids[i]].prev = newNode;
			}
			this.buckets[ids[i]] = newNode;
		}
	},

	findAllByKeys(ids) {
		var retVal = [];
		for (var i = 0; i < ids.length; ++i) {
			var current = this.buckets[ids[i]];
			while (current) {
				retVal[current.item.id] = current.item;
				current = current.next;
			}
		}
		return retVal;
	},

	remove(item, ids) {
		for (var i = 0; i < ids.length; ++i) {
			var current = this.buckets[ids[i]];
			while (current) {
				var next = current.next;
				if (current.item === item) {
					if (!current.next && !current.prev) {
						var deleteme = this.buckets[ids[i]];
						this.buckets[ids[i]] = undefined;
						// Don't forget to delete last node removed
						deleteme.destroy();
					} else {
						if (current.next) {
							current.next.prev = current.prev;
						}
						if (current.prev) {
							current.prev.next = current.next;
						}
						current.prev = undefined;
						current.next = undefined;
						// Delete node when removed
						current.destroy();
					}
				}
				current = next;
			}
		}
	}
});

export default RelationshipHash;