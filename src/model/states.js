import Ember from 'ember';

import { computed } from 'ember-graph/util/computed';
import { startsWith } from 'ember-graph/util/string';

export default {

	/**
	 * Denotes that the record is currently being deleted, but the server hasn't responded yet.
	 *
	 * @property isDeleting
	 * @type Boolean
	 * @final
	 * @for Model
	 */
	isDeleting: false,

	/**
	 * Denotes that a record has been deleted and the change persisted to the server.
	 *
	 * @property isDeleted
	 * @type Boolean
	 * @final
	 * @for Model
	 */
	isDeleted: false,

	/**
	 * Denotes that the record is currently saving its changes to the server, but the server hasn't responded yet.
	 * (This doesn't overlap with `isCreating` at all. This is only true on subsequent saves.)
	 *
	 * @property isSaving
	 * @type Boolean
	 * @final
	 * @for Model
	 */
	isSaving: false,

	/**
	 * Denotes that the record is being reloaded from the server, but the server hasn't responded yet.
	 *
	 * @property isReloading
	 * @type Boolean
	 * @final
	 * @for Model
	 */
	isReloading: false,

	/**
	 * Denotes that a record has been loaded into a store and isn't freestanding.
	 *
	 * @property isLoaded
	 * @type Boolean
	 * @final
	 * @for Model
	 */
	isLoaded: computed('store', {
		get() {
			return (this.get('store') !== null);
		}
	}),

	/**
	 * Denotes that the record has attribute or relationship changes that have not been saved to the server yet.
	 * Note: A new record is always dirty.
	 *
	 * @property isDirty
	 * @type Boolean
	 * @final
	 * @for Model
	 */
	isDirty: Ember.computed.or('areAttributesDirty', 'areRelationshipsDirty', 'isNew'),

	/**
	 * Denotes that the record is currently being saved to the server for the first time,
	 * and the server hasn't responded yet.
	 *
	 * @property isCreating
	 * @type Boolean
	 * @final
	 * @for Model
	 */
	isCreating: false,

	/**
	 * Denotes that a record has just been created and has not been saved to
	 * the server yet. Most likely has a temporary ID if this is true.
	 *
	 * @property isNew
	 * @type Boolean
	 * @final
	 * @for Model
	 */
	isNew: computed('_id', {
		get() {
			return startsWith(this.get('_id'), this.constructor.temporaryIdPrefix);
		}
	}),

	/**
	 * Denotes that the record is currently waiting for the server to respond to an operation.
	 *
	 * @property isInTransit
	 * @type Boolean
	 * @final
	 * @for Model
	 */
	isInTransit: Ember.computed.or('isSaving', 'isDeleting', 'isCreating', 'isReloading')
};