var map = Ember.ArrayPolyfills.map;
var mapBy = EG.ArrayPolyfills.mapBy;
var filter = Ember.ArrayPolyfills.filter;
var forEach = Ember.ArrayPolyfills.forEach;

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

	/**
	 * This property can be overridden if you're using polymorphic relationships
	 * in your models. Instead of strings for IDs, the serializer will use objects
	 * for IDs. Each object will contain a `type` and `id` property.
	 *
	 * @property polymorphicRelationships
	 * @type Boolean
	 * @default false
	 * @private
	 */
	polymorphicRelationships: false,

	serialize: function(record, options) {
		switch (options.requestType) {
			case 'updateRecord':
				return this.serializeDelta(record);
			case 'createRecord':
				var json = {};
				json[EG.String.pluralize(record.typeKey)] = [this.serializeRecord(record)];
				return json;
			default:
				throw new Em.Error('Invalid request type for JSON serializer.');
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
	 * @protected
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
	 * @protected
	 */
	serializeRelationship: function(record, name) {
		var meta = record.constructor.metaForRelationship(name);
		var value = record.get('_' + name);

		if (meta.kind === EG.Model.HAS_ONE_KEY) {
			if (value === null || EG.Model.isTemporaryId(value.id)) {
				value = null;
			}

			return {
				name: name,
				value: (this.get('polymorphicRelationships') ? value : value.id)
			};
		} else {
			value = filter.call(value, function(v) {
				return !EG.Model.isTemporaryId(v.id);
			});

			return {
				name: name,
				value: (this.get('polymorphicRelationships') ? value : mapBy.call(value, 'id'))
			};
		}
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
		var operations = this.serializeAttributeDelta(record);
		return operations.concat(this.serializeRelationshipDelta(record));
	},

	/**
	 * Serializes a record's attributes changes to operation objects.
	 *
	 * @method serializeAttributeDelta
	 * @param {Model} record
	 * @return {JSON} Array of change operations
	 * @protected
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
	 * @protected
	 */
	serializeRelationshipDelta: function(record) {
		var operations = [];
		var changes = record.changedRelationships();
		var polymorphicRelationships = this.get('polymorphicRelationships');

		forEach.call(Em.keys(changes), function(relationshipName) {
			var values = changes[relationshipName];
			var meta = record.constructor.metaForRelationship(relationshipName);

			if (meta.kind === EG.Model.HAS_ONE_KEY) {
				operations.push({
					op: 'replace',
					path: '/links/' + relationshipName,
					value: (polymorphicRelationships ? values[1] : (values[1] === null ? null : values[1].id))
				});
			} else if (meta.kind === EG.Model.HAS_MANY_KEY) {
				var originalSet = new Em.Set(map.call(values[0], function(value) {
					return value.type + ':' + value.id;
				}));

				var currentSet = new Em.Set(map.call(values[1], function(value) {
					return value.type + ':' + value.id;
				}));

				forEach.call(values[1], function(value) {
					if (!originalSet.contains(value.type + ':' + value.id) && !EG.Model.isTemporaryId(value.id)) {
						operations.push({
							op: 'add',
							path: '/links/' + relationshipName,
							value: (polymorphicRelationships ? value : value.id)
						});
					}
				});

				forEach.call(values[0], function(value) {
					if (!currentSet.contains(value.type + ':' + value.id)  && !EG.Model.isTemporaryId(value.id)) {
						operations.push({
							op: 'remove',
							path: '/links/' + relationshipName + '/' + value.id,
							value: (polymorphicRelationships ? value : value.id)
						});
					}
				});
			}
		});

		return operations;
	},

	deserialize: function(payload, options) {
		var store = this.get('store');
		var normalized = this.transformPayload(payload || {}, options || {});

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
	 * @protected
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

		delete payload.meta;

		if (options.requestType === 'findQuery') {
			normalized.meta.queryIds = map.call(payload[EG.String.pluralize(options.recordType)], function(record) {
				return record.id + '';
			});
		} else if (options.requestType === 'createRecord') {
			normalized.meta.newId = payload[EG.String.pluralize(options.recordType)][0].id + '';
		}

		forEach.call(Em.keys(payload), function(key) {
			if (key !== 'linked' && key !== 'meta') {
				normalized[EG.String.singularize(key)] = payload[key];
				delete payload[key];
			}
		});

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
	 * @protected
	 */
	deserializeRecord: function(model, json) {
		if (Em.typeOf(json.id) !== 'string' && Em.typeOf(json.id) !== 'number') {
			throw new Em.Error('Your JSON has an invalid ID: ' + JSON.stringify(json));
		}

		var record = {
			id: json.id + ''
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
	 * error.
	 *
	 * @param {Class} model
	 * @param {JSON} json
	 * @param {String} name
	 * @return {Object}
	 * @protected
	 */
	deserializeAttribute: function(model, json, name) {
		var meta = model.metaForAttribute(name);
		var type = this.get('store').attributeTypeFor(meta.type);
		var value = json[name];

		if (value === undefined) {
			if (meta.isRequired) {
				var error = { id: json.id, typeKey: model.typeKey, name: name };
				throw new Em.Error('Attribute was missing: ' + JSON.stringify(error));
			}

			return {
				name: name,
				value: (meta.defaultValue === undefined ? type.get('defaultValue') : meta.defaultValue)
			};
		} else {
			return { name: name, value: type.deserialize(value) };
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
	 * @protected
	 */
	deserializeRelationship: function(model, json, name) {
		var meta = model.metaForRelationship(name);
		var value = json.links[name];

		if (value === undefined) {
			if (meta.isRequired) {
				throw new Em.Error('Missing `' + name + '` relationship: ' + JSON.stringify(json));
			}

			return { name: name, value: meta.defautlValue };
		} else {
			if (meta.kind === EG.Model.HAS_MANY_KEY) {
				return this.deserializeHasManyRelationship(model, name, value);
			} else {
				return this.deserializeHasOneRelationship(model, name, value);
			}
		}
	},

	/**
	 * After {{link-to-method 'JSONSerializer' 'deserializeRelationship}} has checked
	 * for missing values, it delegates to this function to deserialize a single
	 * hasOne relationship. Their return types are the same.
	 *
	 * @deserializeHasOneRelationship
	 * @param {Class} model
	 * @param {String} name
	 * @param {Object|String|Number} value
	 * @returns {Object}
	 * @protected
	 */
	deserializeHasOneRelationship: function(model, name, value) {
		if (value === null) {
			return { name: name, value: null };
		}

		var polymorphic = this.get('polymorphicRelationships');

		return {
			name: name,
			value: {
				type: (polymorphic ? value.type : model.metaForRelationship(name).relatedType),
				id: (polymorphic ? value.id : value) + ''
			}
		};
	},

	/**
	 * After {{link-to-method 'JSONSerializer' 'deserializeRelationship}} has checked
	 * for missing values, it delegates to this function to deserialize a single
	 * hasMany relationship. Their return types are the same.
	 *
	 * @deserializeHasManyRelationship
	 * @param {Class} model
	 * @param {String} name
	 * @param {Object[]|String[]|Number[]} values
	 * @returns {Object}
	 * @protected
	 */
	deserializeHasManyRelationship: function(model, name, values) {
		var relatedType = model.metaForRelationship(name).relatedType;
		var polymorphic = this.get('polymorphicRelationships');

		var mapped =  map.call(values, function(value) {
			return {
				type: (polymorphic ? value.type : relatedType),
				id: (polymorphic ? value.id : value) + ''
			};
		});

		return { name: name, value: mapped };
	}
});