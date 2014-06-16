var map = Ember.ArrayPolyfills.map;
var filter = Ember.ArrayPolyfills.filter;
var forEach = Ember.ArrayPolyfills.forEach;
var isArray = function(array) {
	return Object.prototype.toString.call(array) === '[object Array]';
};

var coerceId = function(id) {
	return (id === null ? null : id + '');
};

/**
 * This serializer was designed to be compatible with the
 * {{link-to 'JSON API' 'http://jsonapi.org'}}
 * (the ID format, not the URL format).
 *
 * @class JSONSerializer
 * @extends Serializer
 * @constructor
 */
EG.JSONSerializer = EG.Serializer.extend({

	serialize: function(record, options) {
		switch (options.requestType) {
			case 'updateRecord':
				return this.serializeDelta(record);
			case 'createRecord':
				var json = {};
				json[EG.String.pluralize(record.typeKey)] = [this.serializeRecord(record)];
				return json;
			default:
				throw new Error('Invalid request type for JSON serializer.');
		}
	},

	/**
	 * Converts a single record to its JSON representation.
	 *
	 * @method serializeRecord
	 * @param {Model} record
	 * @return {JSON} The JSON representation of the record
	 */
	serializeRecord: function(record) {
		var json = {
			links: {}
		};

		record.constructor.eachAttribute(function(name, meta) {
			var serialized = this.serializeAttribute(record, name);
			if (serialized) {
				json[serialized.name] = serialized.value;
			}
		}, this);

		record.constructor.eachRelationship(function(name, meta) {
			var serialized = this.serializeRelationship(record, name);
			if (serialized) {
				json.links[serialized.name] = serialized.value;
			}
		}, this);

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
	 *
	 * @method serializeAttribute
	 * @param {Model} record
	 * @param {String} name The name of the attribute to serialize
	 * @return {Object}
	 */
	serializeAttribute: function(record, name) {
		var meta = record.constructor.metaForAttribute(name);
		var type = this.get('store').attributeTypeFor(meta.type);

		return { name: name, value: type.serialize(record.get(name)) };
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
		var value = record.get('_' + name);

		if (meta.kind === EG.Model.HAS_ONE_KEY) {
			if (value === null || EG.Model.isTemporaryId(value)) {
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
	 * Serializes a record's changes to a list of change operations
	 * that can be used in a JSON API `PATCH` request. The format
	 * follows the specification except for one minor detail. At the
	 * time of writing this, the `path` in a change operation must
	 * be fully qualified, but there is a change upcoming to fix
	 * that. This uses the soon-to-be format. So instead of this:
	 *
	 * ```json
	 * PATCH /photos/1
	 *
	 * [
	 *     { "op": "remove", "path": "/photos/1/links/comments/5" }
	 * ]
	 * ```
	 *
	 * It uses this:
	 *
	 * ```json
	 * PATCH /photos/1
	 *
	 * [
	 *     { "op": "remove", "path": "/links/comments/5" }
	 * ]
	 * ```
	 *
	 * Everything else remains the same. It will use the `replace`
	 * operation for attributes and hasOne relationships, and the
	 * `add` and `remove` operations for hasMany relationships.
	 *
	 * @method serializeDelta
	 * @param {Model} record
	 * @return {JSON} Array of change operations
	 */
	serializeDelta: function(record) {
		var operations = [];

		operations = operations.concat(this.serializeAttributeDelta(record));
		operations = operations.concat(this.serializeRelationshipDelta(record));

		return operations;
	},

	/**
	 * Serializes a record's attributes changes to operation objects.
	 *
	 * @method serializeAttributeDelta
	 * @param {Model} record
	 * @return {JSON} Array of change operations
	 */
	serializeAttributeDelta: function(record) {
		var changes = record.changedAttributes();
		var store = this.get('store');

		return map.call(Em.keys(changes), function(attributeName) {
			var meta = record.constructor.metaForAttribute(attributeName);
			var type = store.attributeTypeFor(meta.type);
			var value = type.serialize(changes[attributeName][1]);

			return { op: 'replace', path: '/' + attributeName, value: value };
		});
	},

	/**
	 * Serializes a record's relationship changes to operation objects.
	 *
	 * @method serializeAttributeDelta
	 * @param {Model} record
	 * @return {JSON} Array of change operations
	 */
	serializeRelationshipDelta: function(record) {
		var operations = [];
		var changes = record.changedRelationships();

		forEach.call(Em.keys(changes), function(relationshipName) {
			var values = changes[relationshipName];
			var meta = record.constructor.metaForRelationship(relationshipName);

			if (meta.kind === EG.Model.HAS_ONE_KEY) {
				operations.push({ op: 'replace', path: '/links/' + relationshipName, value: values[1] });
			} else if (meta.kind === EG.Model.HAS_MANY_KEY) {
				var added = new Em.Set(values[1]).withoutAll(values[0]);
				var removed = new Em.Set(values[0]).withoutAll(values[1]);

				added.forEach(function(id) {
					operations.push({ op: 'add', path: '/links/' + relationshipName + '/-', value: id });
				});

				removed.forEach(function(id) {
					operations.push({ op: 'remove', path: '/links/' + relationshipName + '/' + id });
				});
			} else {
				Em.assert('Invalid relationship kind.');
			}
		});

		return operations;
	},

	deserialize: function(payload, options) {
		payload = payload || {};
		options = options || {};

		var store = this.get('store');
		var normalized = this.transformPayload(payload, options);

		forEach.call(Em.keys(normalized), function(typeKey) {
			if (typeKey === 'meta') {
				return;
			}

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
		if (!payload || Em.keys(payload).length === 0) {
			return {};
		}

		var normalized = {
			meta: {
				serverMeta: payload.meta || {}
			}
		};

		var mainTypeKey = EG.String.pluralize(options.recordType);

		if (options.requestType === 'findQuery') {
			normalized.meta.queryIds = map.call(payload[mainTypeKey], function(record) {
				return coerceId(record.id);
			});
		} else if (options.requestType === 'createRecord') {
			normalized.meta.newId = coerceId(payload[mainTypeKey][0].id);
		}

		normalized[options.recordType] = payload[mainTypeKey];

		delete payload[mainTypeKey];
		delete payload.meta;

		forEach.call(Em.keys(payload.linked || {}), function(key) {
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

		switch (Em.typeOf(json.id)) {
			case 'string':
			case 'number':
				record.id = coerceId(json.id);
				break;
			case 'undefined':
				throw new Error('Your JSON is missing an ID: ' + JSON.stringify(json));
			default:
				throw new Error('Your JSON has an invalid ID: ' + JSON.stringify(json));
		}

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
	 * error.
	 *
	 * @param {Class} model
	 * @param {JSON} json
	 * @param {String} name
	 * @return {Object}
	 */
	deserializeAttribute: function(model, json, name) {
		var meta = model.metaForAttribute(name);
		var type = this.get('store').attributeTypeFor(meta.type);
		var value = json[name];
		var error;

		if (value === undefined) {
			if (meta.isRequired) {
				error = { id: json.id, typeKey: model.typeKey, name: name };
				throw new Error('Attribute was missing: ' + JSON.stringify(error));
			} else {
				return {
					name: name,
					value: (meta.defaultValue === undefined ? type.get('defaultValue') : meta.defaultValue)
				};
			}
		} else {
			return { name: name, value: value };
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
				if (!isArray(value)) {
					error = { id: json.id, typeKey: model.typeKey, name: name, value: value };
					throw new Error('Invalid hasMany relationship value: ' + JSON.stringify(error));
				}

				return {
					name: name,
					value: map.call(value, function(id) {
						switch (Em.typeOf(id)) {
							case 'string':
							case 'number':
								return coerceId(id);
							default:
							case 'null':
								error = { id: json.id, typeKey: model.typeKey, name: name, value: value };
								throw new Error('Invalid hasMany relationship value: ' + JSON.stringify(error));
						}
					})
				};
			} else {
				Em.assert('Invalid relationship kind.');
				return null;
			}
		}
	}
});