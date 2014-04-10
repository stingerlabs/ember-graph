/**
 * @class {JSONSerializer}
 */
EG.JSONSerializer = EG.Serializer.extend({

	/**
	 * Converts the record given to a JSON representation where the ID
	 * and attributes are stored at the top level, and relationships
	 * are stored as strings (or arrays) in a `links` object.
	 *
	 * Note: Temporary IDs are not included in relationships
	 *
	 * Current options:
	 * includeId: true to include the ID in the JSON, should default to false
	 *
	 * @param {Model} record The record to serialize
	 * @param {Object} options Any options that were passed by the adapter
	 * @returns {Object} JSON representation of record
	 */
	serialize: function(record, options) {
		options = options || {};
		var json = {};

		if (options.includeId) {
			json.id = record.get('id');
		}

		record.constructor.eachAttribute(function(name, meta) {
			var type = this.get('store').attributeTypeFor(meta.type);
			json[name] = type.serialize(record.get(name));
		}, this);

		if (Em.get(record.constructor, 'relationships').length > 0) {
			json.links = {};
		}

		record.constructor.eachRelationship(function(name, meta) {
			var val = record.get('_' + name);

			if (meta.kind === EG.Model.HAS_MANY_KEY) {
				json.links[name] = val.filter(function(id) {
					return (!EG.Model.isTemporaryId(id));
				});
			} else {
				if (val === null || EG.Model.isTemporaryId(val)) {
					json.links[name] = null;
				} else {
					json.links[name] = val;
				}
			}
		});

		return json;
	},

	/**
	 * Extracts records from a JSON payload. The payload should follow
	 * the JSON API (http://jsonapi.org/format/) format for IDs.
	 *
	 * Current options:
	 * isQuery: true to include a `queryIds` meta key
	 * isCreatedRecord: true to include a 'newId' meta key
	 *
	 * Note: For now, it is assumed that a query can only query over one type of object.
	 *
	 * @param {Object} payload
	 * @param {Object} options Any options that were passed by the adapter
	 * @returns {Object} Normalized JSON Payload
	 */
	deserialize: function(payload, options) {
		if (!payload || Em.keys(payload).length === 0) {
			return {};
		}

		var payloadKeys = new Em.Set(Em.keys(payload));
		var json = this._extract(payload);
		json.meta = json.meta || {};

		if (options && options.isQuery) {
			json.meta.queryIds = payload[payloadKeys.withoutAll(['meta', 'linked']).toArray()[0]].map(function(r) {
				return '' + r.id;
			});
		}

		if (options && options.isCreatedRecord) {
			json.meta.newId = payload[payloadKeys.withoutAll(['meta', 'linked']).toArray()[0]][0].id + '';
		}

		Em.keys(json).forEach(function(typeKey) {
			if (typeKey === 'meta') {
				return;
			}

			json[typeKey] = json[typeKey].map(function(record) {
				return this._deserializeSingle(typeKey, record);
			}, this).filter(function(item) { return !!item; });
		}, this);

		return json;
	},

	/**
	 * Takes the JSON payload and converts it halfway to normalized JSON.
	 * The records are all in the correct arrays, but the individual
	 * records themselves have yet to be deserialized.
	 *
	 * @param {Object} payload
	 * @returns {Object} Normalized JSON
	 * @private
	 */
	_extract: function(payload) {
		var json = (payload.hasOwnProperty('linked') ? this._extract(payload.linked) : {});

		Em.keys(payload).forEach(function(key) {
			if (key === 'linked' || key === 'meta') {
				return;
			}

			var typeKey = EG.String.singularize(key);
			json[typeKey] = payload[key].concat(json[typeKey] || []);
		}, this);

		return json;
	},

	/**
	 * Deserializes individual records. First it converts the ID to a string.
	 * Then it extracts all attributes, making sure all required attributes
	 * exist, and no extras are found. It repeats the process for the,
	 * relationships only it converts all IDs to strings in the process.
	 *
	 * @param typeKey
	 * @param json
	 * @returns {null}
	 * @private
	 */
	_deserializeSingle: function(typeKey, json) {
		try {
			json = json || {};
			json.links = json.links || {};

			if (typeof json.id !== 'string' && typeof json.id !== 'number') {
				Em.warn('Your JSON was missing an ID.');
				Em.warn('JSON: ' + JSON.stringify(json));
				return null;
			}

			var model = this.get('store').modelForType(typeKey);
			var record = { id: json.id + '' };

			this._validateAttributes(model, json);

			Em.keys(json).forEach(function(attribute) {
				if (attribute === 'id' || attribute === 'links') {
					return;
				}

				var meta = model.metaForAttribute(attribute);
				var type = this.get('store').attributeTypeFor(meta.type);
				record[attribute] = type.deserialize(json[attribute]);
			}, this);

			this._validateRelationships(model, json);

			Em.keys(json.links).forEach(function(relationship) {
				var meta = model.metaForRelationship(relationship);

				if (meta.kind === EG.Model.HAS_MANY_KEY) {
					record[relationship] = json.links[relationship].map(function(id) {
						return '' + id;
					});
				} else {
					record[relationship] = json.links[relationship];

					if (record[relationship] !== null) {
						record[relationship] = '' + record[relationship];
					}
				}
			});

			return record;
		} catch (e) {
			Em.warn(e);
			return null;
		}
	},

	/**
	 * Checks the validity of the attributes in the given JSON. It will throw exceptions
	 * for unrecoverable errors (missing required attributes) and will make assertions
	 * for errors than can be ignored (extra attributes).
	 *
	 * @param {Model} model
	 * @param {JSON} json
	 * @private
	 */
	_validateAttributes: function(model, json) {
		var attributes = Em.get(model, 'attributes');
		var givenAttributes = new Em.Set(Em.keys(json));
		givenAttributes.removeObjects(['id', 'links']);
		var extra = givenAttributes.withoutAll(attributes);

		Em.assert('Your JSON contained extra attributes: ' + extra.toArray().join(','), extra.length <= 0);

		model.eachAttribute(function(name, meta) {
			if (!json.hasOwnProperty(name) && meta.isRequired) {
				throw new Error('Your JSON is missing the required `' + name + '` attribute.');
			}
		});
	},

	/**
	 * Checks the validity of the relationships in the given JSON. It will throw exceptions
	 * for unrecoverable errors (missing required relationships or incorrect types) and will
	 * make assertions for errors than can be ignored (extra relationships).
	 *
	 * @param {Model} model
	 * @param {JSON} json
	 * @private
	 */
	_validateRelationships: function(model, json) {
		var relationships = Em.get(model, 'relationships');
		var givenRelationships = new Em.Set(Em.keys(json.links));
		var extra = givenRelationships.withoutAll(relationships);

		Em.assert('Your JSON contained extra relationships: ' + extra.toArray().join(','), extra.length <= 0);

		model.eachRelationship(function(name, meta) {
			if (!json.links.hasOwnProperty(name) && meta.isRequired) {
				throw new Error('Your JSON is missing the required `' + name + '` relationship.');
			}

			var jsonType = Em.typeOf(json.links[name]);
			if (meta.kind === EG.Model.HAS_MANY_KEY) {
				if (jsonType !== 'array') {
					throw new Error('The `' + name + '` has many relationship in your JSON was not an array.');
				}
			} else {
				if (jsonType !== 'string' && jsonType !== 'number' && jsonType !== 'null') {
					throw new Error('The `' + name + '` has one relationship in your ' +
						'JSON was not a valid value (string, number or null).');
				}
			}
		});
	}
});