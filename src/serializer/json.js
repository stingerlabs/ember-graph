var map = Ember.ArrayPolyfills.map;
var filter = Ember.ArrayPolyfills.filter;
var forEach = Ember.ArrayPolyfills.forEach;

var coerceId = function(id) {
	return (id === null ? null : id + '');
};

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
		return this.serializeRecord(record, options.requestType === 'createRecord');
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
		var json = {
			links: {}
		};

		if (includeId) {
			json.id = record.get('id');
		}

		record.constructor.eachAttribute(function(name, meta) {
			var serialized = this.serializeAttribute(record, name);
			if (serialized) {
				json[serialized.name] = serialized.value;
			}
		});

		record.constructor.eachRelationship(function(name, meta) {
			var serialized = this.serializeRelationship(record, name);
			if (serialized) {
				json.links[serialized.name] = serialized.value;
			}
		});

		return json;
	},

	/**
	 * Serializes a single attribute for a record. This function
	 * determines how the value is serialized and what the
	 * serialized name will be. To remove the attribute
	 * from serialization, return `null` from this function. To
	 * keep the attribute, return an object like the one below:
	 *
	 * ```js
	 * {
	 *     name: "serialized_name",
	 *     value: "serialized_value"
	 * }
	 * ```
	 *
	 * By default, this function will keep the name of the
	 * attribute and serialize the value using the corresponding
	 * {{#link-to-class 'AttributeType'}}AttributeType{{/link-to-class}}.
	 * If the value is invalid for some reason, it will attempt
	 * to use the default value. If the value is invalid and
	 * required, it will throw an error.
	 *
	 * @method serializeAttribute
	 * @param {Model} record
	 * @param {String} name The name of the attribute to serialize
	 * @return {Object}
	 */
	serializeAttribute: function(record, name) {
		var meta = record.constructor.metaForAttribute(name);
		var type = this.get('store').attributeTypeFor(record.type);
		var isValid = meta.isValid || type.isValid;
		var value = record.get(name);

		if (isValid(value)) {
			return { name: name, value: value };
		} else {
			if (meta.isRequired) {
				var context = { id: record.get('id'), typeKey: record.typeKey, attribute: name, value: value };
				throw new Error('Invalid attribute during serialization: ' + JSON.stringify(context));
			} else {
				value = (meta.defaultValue === undefined ? type.get('defaultValue') : meta.defaultValue);
				return { name: name, value: value };
			}
		}
	},

	/**
	 * Serializes a single relationship for a record. This function
	 * determines how the value is serialized and what the
	 * serialized name will be. To remove the relationship
	 * from serialization, return `null` from this function. To
	 * keep the relationship, return an object like the one below:
	 *
	 * ```js
	 * {
	 *     name: "serialized_name",
	 *     value: "serialized_value"
	 * }
	 * ```
	 *
	 * By default, this function will keep the name of the
	 * relationship. For hasOne relationships, it will
	 * use either a single string ID or `null`. For hasMany
	 * relationships, it will use an array of string IDs.
	 *
	 * @method serializeRelationship
	 * @param {Model} record
	 * @param {String} name The name of the relationship to serialize
	 * @return {Object}
	 */
	serializeRelationship: function(record, name) {
		var meta = record.constructor.metaForRelationship(name);
		var value = record.get(name);

		if (meta.kind === EG.Model.HAS_ONE_KEY) {
			if (EG.Model.isTemporaryId(value)) {
				value = null;
			}
		} else if (meta.kind === EG.Model.HAS_MANY_KEY) {
			value = filter.call(value, function(id) {
				return !EG.Model.isTemporaryId(id);
			});
		}

		return { name: name, value: value };
	},

	/**
	 * @category inherit_documentation
	 */
	deserialize: function(payload, options) {
		var store = this.get('store');
		var normalized = this.transformPayload(payload, options);

		forEach.call(Em.keys(normalized), function(typeKey) {
			var model = store.modelForType(typeKey);

			normalized[typeKey] = map.call(normalized[typeKey], function(json) {
				return this.deserializeRecord(model, json);
			}, this);
		}, this);

		return normalized;
	},

	/**
	 * Converts a payload partially to normalized JSON.
	 * The layout is the same, but the individual records
	 * themselves have yet to be deserialized.
	 *
	 * @method transformPayload
	 * @param {JSON} payload
	 * @param {Object} options
	 * @return {Object} Normalized JSON payload
	 */
	transformPayload: function(payload, options) {
		var normalized = {
			meta: {
				serverMeta: payload.meta || {}
			}
		};

		var mainTypeKey = payload[EG.String.pluralize(options.recordType)];

		if (options.relatedType === 'findQuery') {
			normalized.queryIds = map.call(mainTypeKey, function(record) {
				return coerceId(record.id);
			});
		} else if (options.relatedType === 'createRecord') {
			normalized.newId = coerceId(mainTypeKey);
		}

		normalized[options.recordType] = payload[mainTypeKey];

		delete payload[mainTypeKey];
		delete payload.meta;

		forEach.call(Em.keys(payload.linked), function(key) {
			normalized[EG.String.singularize(key)] = payload.linked[key];
		});

		return normalized;
	},

	/**
	 * Converts a single record from its JSON representation
	 * to the Javascript representation that the store expects.
	 *
	 * @method deserializeRecord
	 * @param {Model} model
	 * @param {JSON} json
	 * @return {Object} Deserialized record
	 */
	deserializeRecord: function(model, json) {
		var record = {
			id: coerceId(json.id)
		};

		model.eachAttribute(function(name, meta) {
			var deserialized = this.deserializeAttribute(model, json, name);
			if (deserialized) {
				record[deserialized.name] = deserialized.value;
			}
		}, this);

		json.links = json.links || {};

		model.eachRelationship(function(name, meta) {
			var deserialized = this.deserializeRelationship(model, json, name);
			if (deserialized) {
				record[deserialized.name] = deserialized.value;
			}
		}, this);

		return record;
	},

	/**
	 * Deserializes a single attribute for a record. This function
	 * determines how the value is deserialized and what the
	 * deserialized name will be. To remove the attribute
	 * from deserialization, return `null` from this function. To
	 * keep the attribute, return an object like the one below:
	 *
	 * ```js
	 * {
	 *     name: "deserialized_name",
	 *     value: "deserialized_value"
	 * }
	 * ```
	 *
	 * By default, this function keeps the original name and
	 * serializes the value using the corresponding
	 * {{#link-to-class 'AttributeType'}}AttributeType{{/link-to-class}}.
	 * If the value is missing, it attempts to use the default
	 * value. If it's missing and required, it has to throw an
	 * error. If the value is invalid, it will also try to use
	 * the default. If it's both invalid and required, again,
	 * it has to throw an error.
	 *
	 * @param {Class} model
	 * @param {JSON} json
	 * @param {String} name
	 * @return {Object}
	 */
	deserializeAttribute: function(model, json, name) {
		var meta = model.metaForAttribute(name);
		var type = this.get('store').attributeTypeFort(meta.type);
		var isValid = meta.isValid || type.isValid;
		var defaultValue = (meta.defaultValue === undefined ? type.get('defaultValue') : meta.defaultValue);
		var value = json[name];
		var error;

		if (value === undefined) {
			if (meta.isRequired) {
				error = { id: json.id, typeKey: model.typeKey, name: name };
				throw new Error('Attribute was missing: ' + JSON.stringify(error));
			} else {
				return { name: name, value: defaultValue };
			}
		} else {
			if (isValid(value)) {
				return { name: name, value: value };
			} else {
				if (meta.isRequired) {
					error = { id: json.id, typeKey: model.typeKey, name: name, value: value };
					throw new Error('Attribute value was invalid: ' + JSON.stringify(error));
				} else {
					return { name: name, value: defaultValue };
				}
			}
		}
	},

	/**
	 * Deserializes a single relationship for a record. This function
	 * determines how the value is deserialized and what the
	 * deserialized name will be. To remove the relationship
	 * from deserialization, return `null` from this function. To
	 * keep the relationship, return an object like the one below:
	 *
	 * ```js
	 * {
	 *     name: "deserialized_name",
	 *     value: "deserialized_value"
	 * }
	 * ```
	 *
	 * By default, this function keeps the original name. HasOne
	 * relationships are expected to be either `null`, or a number
	 * or string. Numbers are converted to strings for the store.
	 * HasMany relationships are expected to be an array of
	 * numbers or strings. If any relationship is missing or invalid,
	 * the default value will be used. If it's missing or invalid
	 * and required, an error will be thrown.
	 *
	 * @param {Class} model
	 * @param {JSON} json
	 * @param {String} name
	 * @return {Object}
	 */
	deserializeRelationship: function(model, json, name) {
		var meta = model.metaForRelationship(name);
		var value = json.links[name];
		var error;

		if (value === undefined) {
			if (meta.isRequired) {
				error = { id: json.id, typeKey: model.typeKey, name: name };
				throw new Error('Relationship was missing: ' + JSON.stringify(error));
			} else {
				return { name: name, value: value };
			}
		} else {
			if (meta.kind === EG.Model.HAS_ONE_KEY) {
				switch (Em.typeOf(value)) {
					case 'null':
					case 'string':
					case 'number':
						return { name: name, value: coerceId(value) };
					default:
						error = { id: json.id, typeKey: model.typeKey, name: name, value: value };
						throw new Error('Invalid hasOne relationship value: ' + JSON.stringify(error));
				}
			} else if (meta.kind === EG.Model.HAS_MANY_KEY) {
				return {
					name: name,
					value: map.call(value, function(id) {
						switch (Em.typeOf(value)) {
							case 'null':
							case 'string':
							case 'number':
								return coerceId(id);
							default:
								error = { id: json.id, typeKey: model.typeKey, name: name, value: value };
								throw new Error('Invalid hasMany relationship value: ' + JSON.stringify(error));
						}
					})
				};
			} else {
				throw new Error('Invalid relationship kind.');
			}
		}
	}
});