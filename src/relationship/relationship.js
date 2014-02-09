var nextRelationshipId = 0;
var allRelationships = {};

/**
 * A class used internally by Ember-Graph to keep the object-graph up-to-date.
 *
 * @class {Relationship}
 */
Eg.Relationship = Em.Object.extend({

	/**
	 * The ID of this relationship. Has no significance and isn't used
	 * by the records, it's just used for quick indexing.
	 *
	 * @type {String}
	 */
	id: null,

	/**
	 * The state of the relationship. One of the following:
	 * new - client side relationship that hasn't been saved
	 * saved - server side relationship
	 * deleted - server side relationship scheduled for deletion
	 *
	 * @type {String}
	 */
	state: null,

	/**
	 * The first object of this relationship. This object must always
	 * be a record. If the relationship is only one way, this must be
	 * the object on which the relationship is declared.
	 *
	 * @type {Model}
	 */
	object1: null,

	/**
	 * The name of the relationship on object1 that contains this relationship.
	 *
	 * @type {String}
	 */
	relationship1: null,

	/**
	 * Holds the type of the second object (populated automatically)
	 *
	 * @type {String}
	 */
	type1: null,

	/**
	 * The second object of the relationship. This object may be a
	 * string ID if the record isn't loaded yet, although it must
	 * be a permanent ID. If the relationship is one way, the
	 * other side of this relationship for this object will always
	 * be null.
	 *
	 * @type {Model|String}
	 */
	object2: null,

	/**
	 * The name of the relationship on object1 that contains this relationship.
	 * Can be null if the object is a one way relationship.
	 *
	 * @type {String}
	 */
	relationship2: null,

	/**
	 * Holds the type of the second object (populated automatically)
	 *
	 * @type {String}
	 */
	type2: null,

	/**
	 * Signifies that this relationship goes from object1 to object2, but not vice-versa.
	 *
	 * @type {Boolean}
	 */
	oneWay: function() {
		return this.get('relationship2') === null;
	}.property('relationship2'),

	/**
	 * Initializes the relationship with a unique ID.
	 */
	init: function() {
		this.set('id', nextRelationshipId + '');
		nextRelationshipId = nextRelationshipId + 1;
	},

	/**
	 * Signals that this relationship has been created on the client,
	 * and won't become permanent until the next save.
	 *
	 * @returns {Boolean}
	 */
	isNew: function() {
		return this.get('state') === 'new';
	},

	/**
	 * Signals that this relationship has been saved to the server
	 * and currently has no pending changes to it.
	 *
	 * @returns {Boolean}
	 */
	isSaved: function() {
		return this.get('state') === 'saved';
	},

	/**
	 * Signals that this relationship has been saved to the server,
	 * but is scheduled for deletion on the next record save.
	 *
	 * @returns {Boolean}
	 */
	isDeleted: function() {
		return this.get('state') === 'deleted';
	},

	/**
	 * Given one side, returns the ID for the other side.
	 *
	 * @param {Model} record
	 * @returns {String|undefined}
	 */
	otherId: function(record) {
		Eg.debug.assert(record instanceof Eg.Model);

		if (this.get('object1') === record) {
			var object2 = this.get('object2');
			return (typeof object2 === 'string' ? object2 : object2.get('id'));
		} else {
			return this.get('object1.id');
		}
	},

	/**
	 * Returns the opposite record of the one given. If object2 is an ID, then
	 * it will attempt to find the record. If it can't find the record, it
	 * will return null. Do NOT call this with a record that isn't attached.
	 *
	 * @param {Model} record
	 * @returns {Model|null}
	 */
	otherRecord: function(record) {
		Eg.debug.assert(record instanceof Eg.Model);

		var object1 = this.get('object1');
		if (object1 === record) {
			var object2 = this.get('object2');

			if (typeof object2 === 'string') {
				var inverse = object1.constructor.metaForRelationship(this.get('relationship1')).relatedType;
				return object1.get('store').getRecord(inverse, object2);
			} else {
				return object2;
			}
		} else {
			return object1;
		}
	},

	/**
	 * Given a record, returns the relationship name that belongs to that record.
	 *
	 * @param {Model} record
	 * @return {String} Relationship name
	 */
	relationshipName: function(record) {
		if (this.get('object1') === record) {
			return this.get('relationship1');
		} else if (this.get('object2') === record) {
			return this.get('relationship2');
		} else {
			return undefined;
		}
	}
});

Eg.Relationship.reopenClass({

	/**
	 * Overrides the create method so the object properties
	 * can be included in the parameters like a constructor.
	 *
	 * @param {Object} properties
	 * @returns {Relationship}
	 */
	create: function(properties) {
		var relationship = this._super();

		Eg.debug.assert('Possible state values are new, deleted or saved.',
			properties.state === 'new' || properties.state === 'deleted' || properties.state === 'saved');
		Eg.debug.assert('The first object must always be a record.', properties.object1 instanceof Eg.Model);
		Eg.debug.assert('You must include a relationship name for the first object.',
			typeof properties.relationship1 === 'string');
		Eg.debug.assert('The second object must either be a record, or a permanent ID.',
			properties.object2 instanceof Eg.Model || (typeof properties.object2 === 'string' &&
			!Eg.String.startsWith(properties.object2, Eg.Model.temporaryIdPrefix)));
		Eg.debug.assert('You must include a relationship name for the second object.',
			typeof properties.relationship1 === 'string' || properties.relationship1 === null);
		relationship.setProperties(properties);

		relationship.set('type1', properties.object1.typeKey);

		if (properties.object2 instanceof Eg.Model) {
			relationship.set('type2', properties.object2.typeKey);
		} else {
			relationship.set('type2',
				properties.object1.constructor.metaForRelationship(properties.relationship1).relatedType);
		}

		allRelationships[relationship.get('id')] = relationship;

		return relationship;
	},

	/**
	 * @param {String} id
	 * @returns {Relationship|undefined}
	 */
	getRelationship: function(id) {
		return allRelationships[id];
	},

	/**
	 * Removes the relationship from the list of tracked relationships.
	 * Doesn't disconnect it from anything. Just removes the reference
	 * from this class so `getRelationship` will no longer find it.
	 *
	 * @param {String} id
	 */
	deleteRelationship: function(id) {
		delete allRelationships[id];
	}
});