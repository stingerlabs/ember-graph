var NEW_STATE = 'new';
var SAVED_STATE = 'saved';
var DELETED_STATE = 'deleted';

/**
 * A class used internally by Ember-Graph to keep the object-graph up-to-date.
 *
 * @class {Relationship}
 */
EG.Relationship = Em.Object.extend({

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
	state: (function() {
		var state = NEW_STATE;

		return function(key, value) {
			if (arguments.length > 1) {
				if (value === NEW_STATE || value === SAVED_STATE || value === DELETED_STATE) {
					state = value;
				} else {
					throw new Error('\'' + value + '\' is an invalid relationship state.');
				}
			}

			return state;
		};
	})(),

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
	oneWay: Em.computed(function() {
		return this.get('relationship2') === null;
	}).property('relationship2'),

	/**
	 * Initializes the relationship with a unique ID.
	 */
	init: (function() {
		var nextId = 0;

		return function() {
			this.set('id', nextId + '');
			nextId = nextId + 1;
		};
	})(),

	/**
	 * Signals that this relationship has been created on the client,
	 * and won't become permanent until the next save.
	 *
	 * @returns {Boolean}
	 */
	isNew: function() {
		return this.get('state') === NEW_STATE;
	},

	/**
	 * Signals that this relationship has been saved to the server
	 * and currently has no pending changes to it.
	 *
	 * @returns {Boolean}
	 */
	isSaved: function() {
		return this.get('state') === SAVED_STATE;
	},

	/**
	 * Signals that this relationship has been saved to the server,
	 * but is scheduled for deletion on the next record save.
	 *
	 * @returns {Boolean}
	 */
	isDeleted: function() {
		return this.get('state') === DELETED_STATE;
	},

	/**
	 * Given one side, returns the ID for the other side.
	 *
	 * @param {Model} record
	 * @returns {String|undefined}
	 */
	otherId: function(record) {
		Em.assert('Record must be an instance of `EG.Model`.', EG.Model.detectInstance(record));

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
		Em.assert('Record must be an instance of `EG.Model`.', EG.Model.detectInstance(record));

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
	},

	/**
	 * Determines if this relationship is connected to the given record on either side.
	 *
	 * @param {String} typeKey
	 * @param {String} id
	 * @returns {Boolean}
	 */
	isConnectedTo: function(typeKey, id) {
		if (this.get('type1') === typeKey && this.get('object1.id') === id) {
			return true;
		}

		if (this.get('type2') === typeKey) {
			var object2 = this.get('object2');

			if (Em.typeOf(object2) === 'string') {
				return (object2 === id);
			} else {
				return (Em.get(object2, 'id') === id);
			}
		}

		return false;
	}
});

EG.Relationship.reopenClass({

	NEW_STATE: NEW_STATE,
	SAVED_STATE: SAVED_STATE,
	DELETED_STATE: DELETED_STATE,

	/**
	 * Overrides the create method so the object properties
	 * can be included in the parameters like a constructor.
	 *
	 * @param {Object} properties
	 * @returns {Relationship}
	 */
	create: function(properties) {
		var relationship = this._super();

		Em.assert('Possible state values are new, deleted or saved.',
			properties.state === NEW_STATE || properties.state === DELETED_STATE || properties.state === SAVED_STATE);
		Em.assert('The first object must always be a record.', properties.object1 instanceof EG.Model);
		Em.assert('You must include a relationship name for the first object.',
			typeof properties.relationship1 === 'string');
		Em.assert('The second object must either be a record, or a permanent ID.',
			properties.object2 instanceof EG.Model || (typeof properties.object2 === 'string' &&
			!EG.String.startsWith(properties.object2, EG.Model.temporaryIdPrefix)));
		Em.assert('You must include a relationship name for the second object.',
			typeof properties.relationship1 === 'string' || properties.relationship1 === null);
		relationship.setProperties(properties);

		relationship.set('type1', properties.object1.typeKey);

		if (properties.object2 instanceof EG.Model) {
			relationship.set('type2', properties.object2.typeKey);
		} else {
			relationship.set('type2',
				properties.object1.constructor.metaForRelationship(properties.relationship1).relatedType);
		}

		return relationship;
	},

	/**
	 * Given a relationship state, determines which hash in the model the relationship should be in.
	 *
	 * @param {String} state
	 * @returns {String}
	 */
	stateToHash: function(state) {
		switch (state) {
			case NEW_STATE:
				return '_clientRelationships';
			case SAVED_STATE:
				return '_serverRelationships';
			case DELETED_STATE:
				return '_deletedRelationships';
			default:
				Em.assert('The given state was invalid.');
				return '';
		}
	}
});