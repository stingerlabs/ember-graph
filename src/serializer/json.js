/**
 * This serializer was designed to be compatible with the
 * {{#link-to 'http://jsonapi.org'}}JSON API{{/link-to}}
 * (the ID format, not the URL format).
 *
 * @class JSONSerializer
 * @extends Serializer
 */
EG.JSONSerializer = EG.Serializer.extend({

	/**
	 * @category inherit_documentation
	 */
	serialize: function(record, options) {
		throw methodMissing('serialize');
	},

	/**
	 * Converts a single record to its JSON representation.
	 *
	 * @method serializeRecord
	 * @param {Model} record
	 * @param {Boolean} includeId
	 * @return {JSON} The JSON representation of the record
	 */
	serializeRecord: function(record, includeId) {

	},

	/**
	 * @method serializeAttribute
	 * @param {Model} record
	 * @param {String} name
	 * @return {Object}
	 */
	serializeAttribute: function(record, name) {

	},

	serializeRelationship: function(record, name) {

	},

	/**
	 * @category inherit_documentation
	 */
	deserialize: function(payload, options) {
		throw methodMissing('deserialize');
	},

	transformPayload: function(payload, options) {

	},

	deserializeRecord: function(model, json) {

	},

	deserializeAttribute: function(model, json, name) {

	},

	deserializeRelationship: function(model, json, name) {

	}
});