var HAS_MANY_KEY = Eg.Model.HAS_MANY_KEY;
var BELONGS_TO_KEY = Eg.Model.BELONGS_TO_KEY;

/**
 * @class {JSONSerializer}
 */
Eg.JSONSerializer = Em.Object.extend({

	/**
	 * Converts the record given to a JSON representation where the ID
	 * and attributes are stored at the top level, and relationships
	 * are stored as strings (or arrays) in a `links` object.
	 *
	 * Note: Temporary IDs are not included in relationships
	 *
	 * @param {Model} record The record to serialize
	 * @param {Object} options Any options that were passed by the adapter
	 * @returns {Object} JSON representation of record
	 */
	serialize: function(record, options) {
		options = options || {};
		var json = {};

		if (options.includeId) {
			json.id = json.get('id');
		}

		record.constructor.eachAttribute(function(name, meta) {
			var type = Eg.AttributeType.attributeTypeForName(meta.type);
			json[name] = type.serialize(record.get(name));
		}, this);

		record.constructor.eachRelationship(function(name, meta) {
			var val = record.get(name);

			if (meta.kind === HAS_MANY_KEY) {
				json[name] = val.filter(function(id) {
					return (!Eg.Model.isTemporaryId(id));
				});
			} else {
				if (val === null || Eg.Model.isTemporaryId(val)) {
					json[name] = null;
				} else {
					json[name] = val;
				}
			}
		});

		return json;
	},

	/**
	 * Extracts records from a JSON payload. The payload should follow
	 * the JSON API (http://jsonapi.org/format/) format for IDs.
	 *
	 * @param {Object} payload
	 * @param {Object} options Any options that were passed by the adapter
	 * @returns {Object} Normalized JSON Payload
	 */
	deserialize: function(payload, options) {

	},

	_extract: function(payload) {
		var json = (payload.hasOwnProperty('linked') ? this._extract(json.linked) : {});

		Em.keys(payload).forEach(function(key) {
			if (key === 'meta' || key === 'linked') {
				return;
			}

			var normalized = payload[key].map(function(record) {
				return this._extractSingle(record);
			}, this).filter(function(record) { return !!record; });

			//json[Eg.String.singularize(key)];
		}, this);

		return json;
	},

	_extractSingle: function(typeKey, json) {
		// extract id
		// extract relationships (copy them)
		// ensure that no extra relationships exist
		// extract attributes (copy them) (deserialize them as well)
		// ensure that no extra attributes exist
		// log any errors and return null
	}
});