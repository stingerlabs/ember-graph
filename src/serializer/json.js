/**
 * @class JSONSerializer
 * @extends Serializer
 */
EG.JSONSerializer = EG.Serializer.extend({

	// TODO: Option to specify action for invalid values

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
	 * @method serialize
	 * @param {Model} record The record to serialize
	 * @param {Object} options Any options that were passed by the adapter
	 * @return {Object} JSON representation of record
	 */
	serialize: function(record, options) {
		options = options || {};
		var json = {};

		if (options.includeId) {
			json.id = record.get('id');
		}

		record.constructor.eachAttribute(function(name, meta) {
			// TODO: I'd like to cache the store and types somehow
			var type = this.get('store').attributeTypeFor(meta.type);

			var serialized = this.serializeAttribute(record, type, name, meta);
			if (serialized) {
				json[serialized.key] = serialized.value;
			}
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
	 * Performs the serialization of individual attributes. This allows attributes to be
	 * treated differently depending on the record or record type. It also allows you to
	 * change the name of the attribute in serialization, or remove it completely. This
	 * function also takes care of any validity and existence checking. If an attribute
	 * value is incorrect or missing, it's up to this function to either throw an error
	 * or provide a default value.
	 *
	 * The return value of this function should either be `null` to remove the attribute
	 * in the serialized object, or an object similar to the one below to keep it.
	 *
	 * ```
	 * {
	 *    key: "serialized_attribute_name",
	 *    value: "json_representation_of_value"
	 * }
	 * ```
	 *
	 * By default, this function will serialize the value using the AttributeType,
	 * and it will leave the name unchanged. If the value of the attribute is invalid
	 * for some reason, it will attempt to use the default value. If the attribute is
	 * required and invalid, it has no choice but to throw an error.
	 *
	 * @method serializeAttribute
	 * @param {Model} record
	 * @param {AttributeType} attributeType
	 * @param {String} attributeName
	 * @param {Object} attributeMeta
	 * @return {Object} And object as seen in the example, or `null`
	 */
	serializeAttribute: function(record, attributeType, attributeName, attributeMeta) {
		var value = attributeType.serialize(record.get(attributeName));
		var isValid = attributeMeta.isValid || attributeType.isValid;

		if (!isValid(value)) {
			if (attributeMeta.isRequired) {
				throw new Error('While serializing the record with ID `' + record.get('id') + '`, ' +
					'the `' + attributeName + '` attribute had an invalid value.');
			} else {
				value = (attributeMeta.defaultValue === undefined ?
					attributeType.get('defaultValue') : attributeMeta.defaultValue);
			}
		}

		return {
			key: attributeName,
			value: value
		};
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
	 * @method deserialize
	 * @param {Object} payload
	 * @param {Object} options Any options that were passed by the adapter
	 * @return {Object} Normalized JSON Payload
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
	 * @method _extract
	 * @param {Object} payload
	 * @returns {Object} Normalized JSON
	 * @protected
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
	 * @method _deserializeSingle
	 * @param {String} typeKey
	 * @param {Object} json
	 * @return {Object}
	 * @protected
	 */
	_deserializeSingle: function(typeKey, json) {
		try {
			json = json || {};
			json.links = json.links || {};

			if (Em.typeOf(json.id) !== 'string' && Em.typeOf(json.id) !== 'number') {
				Em.warn('Your JSON was missing an ID.');
				Em.warn('JSON: ' + JSON.stringify(json));
				return null;
			}

			var store = this.get('store');
			var model = store.modelForType(typeKey);
			var record = { id: json.id + '' };

			model.eachAttribute(function(name, meta) {
				var type = store.attributeTypeFor(meta.type);
				var deserialized = this.deserializeAttribute(json, type, name, meta);
				if (deserialized) {
					record[deserialized.key] = deserialized.value;
				}
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
	 * Performs the deserialization of individual attributes. This allows attributes to be
	 * treated differently depending on the record or record type. It also allows you to
	 * change the name of the attribute in deserialization, or remove it completely. This
	 * function also takes care of any validity and existence checking. If an attribute
	 * value is incorrect or missing, it's up to this function to either throw an error
	 * or provide a default value.
	 *
	 * The return value of this function should either be `null` to remove the attribute
	 * in the deserialized object, or an object similar to the one below to keep it.
	 *
	 * ```
	 * {
	 *    key: "deserialized_attribute_name",
	 *    value: "javascript_representation_of_value"
	 * }
	 * ```
	 *
	 * By default, this function will serialize the value using the AttributeType,
	 * and it will leave the name unchanged. If the value of the attribute is invalid
	 * for some reason, it will attempt to use the default value. If the attribute is
	 * required and invalid, it has no choice but to throw an error.
	 *
	 * By default, this function attempts to deserialize the value using the AttributeType,
	 * and it will leave the name unchanged. If the value is missing or invalid, it will
	 * attempt to use the default value. If the attribute is also required, it has no
	 * choice but to throw an error.
	 *
	 * @method deserializeAttribute
	 * @param {JSON} json
	 * @param {AttributeType} attributeType
	 * @param {String} attributeName
	 * @param {Object} attributeMeta
	 * @return {Object} And object as seen in the example, or `null`
	 */
	deserializeAttribute: function(json, attributeType, attributeName, attributeMeta) {
		var value = null;

		if (json.hasOwnProperty(attributeName)) {
			var isValid = attributeMeta.isValid || attributeType.isValid;
			var deserialized = attributeType.deserialize(json[attributeName]);
			if (isValid(deserialized)) {
				value = deserialized;
			} else {
				if (attributeMeta.isRequired) {
					throw new Error('The JSON object with id `' + json.id + '` had an invalid value of `' +
						json[attributeName] + '` for the required `' + attributeName + '` attribute.');
				} else {
					console.warn('The JSON object with id `' + json.id + '` had an invalid value of `' +
						json[attributeName] + '` for the non-required`' + attributeName + '` attribute.' +
						' The serializer will use the default value for the attribute instead.');

					value = (attributeMeta.defaultValue === undefined ?
						attributeType.get('defaultValue') : attributeMeta.defaultValue);
				}
			}
		} else {
			if (attributeMeta.isRequired) {
				throw new Error('The JSON object with id `' + json.id +
					'` was missing the required `' + attributeName + '` attribute.');
			} else {
				value = (attributeMeta.defaultValue === undefined ?
					attributeType.get('defaultValue') : attributeMeta.defaultValue);
			}
		}

		return {
			key: attributeName,
			value: value
		};
	},

	/**
	 * Checks the validity of the relationships in the given JSON. It will throw exceptions
	 * for unrecoverable errors (missing required relationships or incorrect types) and will
	 * make assertions for errors than can be ignored (extra relationships).
	 *
	 * @param {Class} model
	 * @param {Object} json
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

			if (json.links.hasOwnProperty(name)) {
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
			}
		});
	}
});