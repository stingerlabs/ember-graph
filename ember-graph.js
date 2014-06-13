(function() {

/**
 * @module ember-graph
 * @main ember-graph
 */
window.EmberGraph = window.EG = Em.Namespace.create({
	/**
	 * @property VERSION
	 * @category top-level
	 * @type String
	 * @static
	 * @final
	 */
	VERSION: '0.1.0'
});

if (Ember.libraries) {
	Ember.libraries.register('Ember Graph', EG.VERSION);
}


})();

(function() {

if (Em) {
	// Remember, these are run AFTER the application becomes ready
	Em.onLoad('Ember.Application', function(Application) {
		Application.initializer({
			name: 'injectStore',
			before: 'store',

			initialize: function(container, App) {
				App.inject('controller', 'store', 'store:main');
				App.inject('route', 'store', 'store:main');
				App.inject('adapter', 'store', 'store:main');
				App.inject('serializer', 'store', 'store:main');
			}
		});

		Application.initializer({
			name: 'store',

			initialize: function(container, App) {
				App.register('store:main', App.Store || EG.Store, { singleton: true });

				App.register('adapter:rest', EG.RESTAdapter, { singleton: true });
				App.register('adapter:fixture', EG.FixtureAdapter, { singleton: true });
				App.register('adapter:localStorage', EG.LocalStorageAdapter, { singleton: true });
				App.register('serializer:json', EG.JSONSerializer, { singleton: true });

				App.register('type:string', EG.StringType, { singleton: true });
				App.register('type:number', EG.NumberType, { singleton: true });
				App.register('type:boolean', EG.BooleanType, { singleton: true });
				App.register('type:date', EG.DateType, { singleton: true });
				App.register('type:object', EG.ObjectType, { singleton: true });
				App.register('type:array', EG.ArrayType, { singleton: true });

				var store = container.lookup('store:main');
				App.set('store', store);
			}
		});
	});
}

})();

(function() {

/**
 * Denotes that method must be implemented in a subclass.
 * If it's not overridden, calling it will throw an error.
 *
 * @method required
 * @param {String} methodName
 * @return {Function}
 * @category top-level
 * @for EG
 */
EG.required = function(methodName) {
	return function() {
		throw new Error('You failed to implement the abstract `' + methodName + '` method.');
	};
};

/**
 * Generates a version 4 (random) UUID.
 *
 * @method generateUUID
 * @return {String}
 * @category top-level
 * @for EG
 */
EG.generateUUID = function() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random()*16|0; // jshint ignore:line
		var v = (c == 'x' ? r : (r&0x3|0x8)); // jshint ignore:line
		return v.toString(16);
	});
};

})();

(function() {

Em.Set.reopen({

	/**
	 * Returns a copy of this set without the passed items.
	 *
	 * @param {Array} items
	 * @returns {Set}
	 */
	withoutAll: function(items) {
		var ret = this.copy();
		ret.removeObjects(items);
		return ret;
	}
});

})();

(function() {

EG.String = {
	startsWith: function(string, prefix) {
		return string.indexOf(prefix) === 0;
	},

	endsWith: function(string, suffix) {
		return string.indexOf(suffix, string.length - suffix.length) >= 0;
	},

	capitalize: function(string) {
		return string[0].toLocaleUpperCase() + string.substring(1);
	},

	decapitalize: function(string) {
		return string[0].toLocaleLowerCase() + string.substring(1);
	}
};

if (Em.EXTEND_PROTOTYPES === true || Em.EXTEND_PROTOTYPES.String) {
	String.prototype.startsWith = String.prototype.startsWith || function(prefix) {
		return EG.String.startsWith(this, prefix);
	};

	String.prototype.endsWith = String.prototype.endsWith || function(suffix) {
		return EG.String.endsWith(this, suffix);
	};

	String.prototype.capitalize = String.prototype.capitalize || function() {
		return EG.String.capitalize(this);
	};

	String.prototype.decapitalize = String.prototype.decapitalize || function() {
		return EG.String.decapitalize(this);
	};
}

})();

(function() {

/*
 I took the rules in this code from inflection.js, whose license can be found below.
 */

/*!
 Copyright (c) 2010 Ryan Schuft (ryan.schuft@gmail.com)

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 */

var uncountableWords = [
	'equipment', 'information', 'rice', 'money', 'species', 'series', 'fish', 'sheep', 'moose', 'deer', 'news'
];

var pluralRules = [
	[/(m)an$/gi,                 '$1en'],
	[/(pe)rson$/gi,              '$1ople'],
	[/(child)$/gi,               '$1ren'],
	[/^(ox)$/gi,                 '$1en'],
	[/(ax|test)is$/gi,           '$1es'],
	[/(octop|vir)us$/gi,         '$1i'],
	[/(alias|status)$/gi,        '$1es'],
	[/(bu)s$/gi,                 '$1ses'],
	[/(buffal|tomat|potat)o$/gi, '$1oes'],
	[/([ti])um$/gi,              '$1a'],
	[/sis$/gi,                   'ses'],
	[/(?:([^f])fe|([lr])f)$/gi,  '$1$2ves'],
	[/(hive)$/gi,                '$1s'],
	[/([^aeiouy]|qu)y$/gi,       '$1ies'],
	[/(x|ch|ss|sh)$/gi,          '$1es'],
	[/(matr|vert|ind)ix|ex$/gi,  '$1ices'],
	[/([m|l])ouse$/gi,           '$1ice'],
	[/(quiz)$/gi,                '$1zes'],
	[/s$/gi,                     's'],
	[/$/gi,                      's']
];

var singularRules = [
	[/(m)en$/gi,                                                        '$1an'],
	[/(pe)ople$/gi,                                                     '$1rson'],
	[/(child)ren$/gi,                                                   '$1'],
	[/([ti])a$/gi,                                                      '$1um'],
	[/((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$/gi, '$1$2sis'],
	[/(hive)s$/gi,                                                      '$1'],
	[/(tive)s$/gi,                                                      '$1'],
	[/(curve)s$/gi,                                                     '$1'],
	[/([lr])ves$/gi,                                                    '$1f'],
	[/([^fo])ves$/gi,                                                   '$1fe'],
	[/([^aeiouy]|qu)ies$/gi,                                            '$1y'],
	[/(s)eries$/gi,                                                     '$1eries'],
	[/(m)ovies$/gi,                                                     '$1ovie'],
	[/(x|ch|ss|sh)es$/gi,                                               '$1'],
	[/([m|l])ice$/gi,                                                   '$1ouse'],
	[/(bus)es$/gi,                                                      '$1'],
	[/(o)es$/gi,                                                        '$1'],
	[/(shoe)s$/gi,                                                      '$1'],
	[/(cris|ax|test)es$/gi,                                             '$1is'],
	[/(octop|vir)i$/gi,                                                 '$1us'],
	[/(alias|status)es$/gi,                                             '$1'],
	[/^(ox)en/gi,                                                       '$1'],
	[/(vert|ind)ices$/gi,                                               '$1ex'],
	[/(matr)ices$/gi,                                                   '$1ix'],
	[/(quiz)zes$/gi,                                                    '$1'],
	[/s$/gi,                                                            '']
];

var apply = function(str, rules) {
	if (uncountableWords.indexOf(str) >= 0) {
		return str;
	}

	for (var i = 0; i < rules.length; i = i + 1) {
		if (str.match(rules[i][0])) {
			return str.replace(rules[i][0], rules[i][1]);
		}
	}

	return str;
};

EG.String.pluralize = function(str) {
	return apply(str, pluralRules);
};

EG.String.singularize = function(str) {
	return apply(str, singularRules);
};

if (Em.EXTEND_PROTOTYPES === true || Em.EXTEND_PROTOTYPES.String) {
	String.prototype.pluralize = String.prototype.pluralize || function() {
		return EG.String.pluralize(this);
	};

	String.prototype.singularize = String.prototype.singularize || function() {
		return EG.String.singularize(this);
	};
}

})();

(function() {

var methodMissing = function(method) {
	return new Error('Your serializer failed to implement the \'' + method + '\' method.');
};

/**
 * An interface for a serializer. A serializer is used to convert
 * objects back and forth between the JSON that the server uses,
 * and the records that are used on the client side.
 *
 * @class Serializer
 */
EG.Serializer = Em.Object.extend({

	/**
	 * The store that the records will be loaded into. This
	 * property is injected by the container on startup.
	 * This can be used for fetching models and their metadata.
	 *
	 * @property store
	 * @type Store
	 * @final
	 */
	store: null,

	/**
	 * Converts a record to a JSON payload that can be sent to
	 * the server. The options object is a general object where any options
	 * necessary can be passed in from the adapter. The built-in Ember-Graph
	 * adapters pass in just one option: `requestType`. This lets the
	 * serializer know what kind of request will made using the payload
	 * returned from this call. The value of `requestType` will be one of
	 * either `createRecord` or `updateRecord`. If you write a custom
	 * adapter or serializer, you're free to pass in any other options
	 * you may need.
	 *
	 * @method serialize
	 * @param {Model} record The record to serialize
	 * @param {Object} [options] Any options that were passed by the adapter
	 * @return {JSON} JSON payload to send to server
	 */
	serialize: function(record, options) {
		throw methodMissing('serialize');
	},

	/**
	 * Takes a payload from the server and converts it into a normalized
	 * JSON payload that the store can use. Details about the format
	 * can be found in the {{link-to-method 'Store' 'extractPayload'}}
	 * documentation.
	 *
	 * In addition to the format described by the store, the adapter
	 * may require some additional information. This information should
	 * be included in the `meta` object. The attributes required by the
	 * built-in Ember-Graph adapters are:
	 *
	 * - `queryIds`: This is an array of IDs that represents the records
	 *     returned as the result of a query. This helps the adapter in the
	 *     case that addition records of the same type were side-loaded.
	 * - `newId`: This tells the adapter which record was just created. Again,
	 *     this helps the adapter differentiate the newly created record in
	 *     case other records of the same type were side-loaded.
	 *
	 * To determine whether those meta attributes are required or not, the
	 * `requestType` option can be used. The built-in Ember-Graph adapters
	 * will pass one of the following values: `findRecord`, `findMany`,
	 * `findAll`, `findQuery`, `createRecord`, `updateRecord`, `deleteRecord`.
	 * If the value is `findQuery`, then the `queryIds` meta attribute is
	 * required. If the value is `createRecord`, then the `newId` meta
	 * attribute is required.
	 *
	 * TODO: Implement...
	 *
	 * There's also an optional attribute that can be given for any call:
	 *
	 * - `deletedRecords`: This attribute is given to the store to let it
	 *     know that records were deleted from the server and that the store
	 *     should unload them. This allows you to remove records from the
	 *     store as easily as you can add them. The format of this attribute
	 *     can be seen in the example below:
	 *
	 * ```js
	 * {
	 *     deletedRecords: [
	 *         { typeKey: 'user', id: '3' },
	 *         { typeKey: 'post', id: '10' },
	 *         { typeKey: 'post', id: '11' },
	 *         { typeKey: 'tag', id: '674' }
	 *     ]
	 * }
	 * ```
	 *
	 * In addition to `requestType`, the following options are available:
	 *
	 * - `recordType`: The type of record that the request was performed on
	 * - `id`:  The ID of the record referred to by a `findRecord`,
	 *     `updateRecord` or `deleteRecord` request
	 * - `ids`: The IDs of the records requested by a `findMany` request
	 * - `query`: The query submitted to the `findQuery` request
	 *
	 * @method deserialize
	 * @param {JSON} payload
	 * @param {Object} [options] Any options that were passed by the adapter
	 * @return {Object} Normalized JSON payload
	 */
	deserialize: function(payload, options) {
		throw methodMissing('deserialize');
	}
});


})();

(function() {

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
 */
EG.JSONSerializer = EG.Serializer.extend({

	/**
	 * @category inherit_documentation
	 */
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

	/**
	 * @category inherit_documentation
	 */
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
				Em.assert('Invalid relationship kind.');
				return null;
			}
		}
	}
});

})();

(function() {

/**
 * An interface for an adapter. And adapter is used to communicated with
 * the server. The adapter is never called directly, its methods are
 * called by the store to perform its operations.
 *
 * The adapter should return normalized JSON from its operations. Details
 * about normalized JSON can be found in the {{link-to-method 'Store' 'extractPayload'}}
 * documentation.
 *
 * @class Adapter
 * @constructor
 * @category abstract
 */
EG.Adapter = Em.Object.extend({

	/**
	 * The store that this adapter belongs to.
	 * This might be needed to get models and their metadata.
	 *
	 * @property store
	 * @type Store
	 */
	store: null,

	/**
	 * The serializer to use if an application serializer is not found.
	 *
	 * @property defaultSerializer
	 * @type String
	 * @default 'json'
	 */
	defaultSerializer: 'json',

	/**
	 * The serializer used to convert records and payload to the correct formats.
	 * The adapter will attempt to use the application serializer, and if one
	 * isn't found, it will used the serializer specified by
	 * {{link-to-property 'Adapter' 'defaultSerializer'}}.
	 *
	 * @property serializer
	 * @type Serializer
	 */
	serializer: Em.computed(function() {
		var container = this.get('container');
		var serializer = container.lookup('serializer:application') ||
			container.lookup('serializer:' + this.get('defaultSerializer'));

		Em.assert('A valid serializer could not be found.', EG.Serializer.detectInstance(serializer));

		return serializer;
	}).property().readOnly(),

	/**
	 * Persists a record to the server. The returned JSON
	 * must include the `newId` meta attribute as described
	 * {{link-to-method 'here' 'Serializer' 'deserialize'}}.
	 *
	 * @method createRecord
	 * @param {Model} record
	 * @return {Promise} Resolves to the normalized JSON
	 * @category abstract
	 */
	createRecord: EG.required('createRecord'),

	/**
	 * Fetch a record from the server.
	 *
	 * @method findRecord
	 * @param {String} typeKey
	 * @param {String} id
	 * @return {Promise} Resolves to the normalized JSON
	 * @category abstract
	 */
	findRecord: EG.required('findRecord'),

	/**
	 * The same as find, only it should load several records.
	 *
	 * @method findMany
	 * @param {String} typeKey
	 * @param {String[]} ids
	 * @return {Promise} Resolves to the normalized JSON
	 * @category abstract
	 */
	findMany: EG.required('findMany'),

	/**
	 * The same as find, only it should load all records of the given type.
	 *
	 * @method findAll
	 * @param {String} typeKey
	 * @return {Promise} Resolves to the normalized JSON
	 * @category abstract
	 */
	findAll: EG.required('findAll'),

	/**
	 * Queries the server for records of the given type. The resolved
	 * JSON should include the `queryIds` meta attribute as
	 * described {{link-to-method 'here' 'Serializer' 'deserialize'}}.
	 *
	 * @method findQuery
	 * @param {String} typeKey
	 * @param {Object} query The query object passed into the store's `find` method
	 * @return {Promise} Resolves to the normalized JSON
	 * @category abstract
	 */
	findQuery: EG.required('findQuery'),

	/**
	 * Saves the record's changes to the server.
	 *
	 * @method updateRecord
	 * @param {Model} record
	 * @return {Promise} Resolves to the normalized JSON
	 * @category abstract
	 */
	updateRecord: EG.required('updateRecord'),

	/**
	 * Deletes the record.
	 *
	 * @method deleteRecord
	 * @param {Model} record
	 * @return {Promise} Resolves to the normalized JSON
	 * @category abstract
	 */
	deleteRecord: EG.required('deleteRecord'),

	/**
	 * Serializes the given record. By default, it defers to the serializer.
	 *
	 * @method serialize
	 * @param {Model} record
	 * @param {Object} options
	 * @return {Object} Serialized record
	 * @protected
	 */
	serialize: function(record, options) {
		return this.get('serializer').serialize(record, options);
	},

	/**
	 * Deserializes the given payload. By default, it defers to the serializer.
	 *
	 * @method deserialize
	 * @param {JSON} payload
	 * @param {Object} options
	 * @return {Object} Normalized JSON payload
	 * @protected
	 */
	deserialize: function(payload, options) {
		return this.get('serializer').deserialize(payload, options);
	}
});


})();

(function() {

var Promise = Em.RSVP.Promise;
var map = Em.ArrayPolyfills.map;
var forEach = Em.ArrayPolyfills.forEach;
var indexOf = Em.ArrayPolyfills.indexOf;

/**
 * An abstract base class that allows easy integration of synchronous
 * data stores. Examples include in-memory, local storage and web SQL.
 * To extend this adapter, you must implement
 * {{link-to-method 'SynchronousAdapter' 'retrieveRecords'}} and
 * {{link-to-method 'SynchronousAdapter' 'modifyRecords'}}. You may
 * also override {{link-to-method 'SynchronousAdapter' 'generateId'}}
 * if you wish to customize the IDs that new records are assigned.
 *
 * If any operations fail (for any reason), throw an error and
 * the adapter will take care of rejecting the right promises.
 *
 * @class SynchronousAdapter
 * @extends Adapter
 * @constructor
 */
EG.SynchronousAdapter = EG.Adapter.extend({

	/**
	 * This adapter requires the built-in JSON serializer to function properly.
	 *
	 * @property serializer
	 * @type JSONSerializer
	 * @final
	 */
	serializer: Em.computed(function() {
		return this.get('container').lookup('serializer:json');
	}).property().readOnly(),

	createRecord: function(record) {
		try {
			var json = this.serverCreateRecord(record);
			var payload = { meta: { newId: json.id } };
			payload[EG.String.pluralize(record.typeKey)] = [json];

			return Promise.resolve(payload);
		} catch (e) {
			Em.warn(e && e.stack);
			return Promise.reject();
		}
	},

	findRecord: function(typeKey, id) {
		try {
			var json = this.retrieveRecord(typeKey, id);
			var deserialized = this.deserialize(json, { recordType: typeKey, requestType: 'findRecord', id: id });

			var payload = {};
			payload[EG.String.pluralize(typeKey)] = [deserialized];

			return Promise.resolve(payload);
		} catch (e) {
			Em.warn(e && e.stack);
			return Promise.reject();
		}
	},

	findMany: function(typeKey, ids) {
		try {
			var json = map.call(ids, function(id) {
				return this.retrieveRecord(typeKey, id);
			}, this);

			var deserialized = map.call(json, function(record) {
				return this.deserialize(record, { recordType: typeKey, requestType: 'findMany', ids: ids });
			}, this);

			var payload = {};
			payload[EG.String.pluralize(typeKey)] = deserialized;

			return Promise.resolve(payload);
		} catch (e) {
			Em.warn(e && e.stack);
			return Promise.reject();
		}
	},

	findAll: function(typeKey) {
		try {
			var json = this.retrieveRecords(typeKey);
			var deserialized = map.call(json, function(record) {
				return this.deserialize(record, { recordType: typeKey, requestType: 'findRecord' });
			}, this);

			var payload = {};
			payload[EG.String.pluralize(typeKey)] = deserialized;

			return Promise.resolve(payload);
		} catch (e) {
			Em.warn(e && e.stack);
			return Promise.reject();
		}
	},

	findQuery: function(typeKey, query) {
		try {
			var json = this.retrieveRecords(typeKey, query);
			var deserialized = map.call(json, function(record) {
				return this.deserialize(record, { recordType: typeKey, requestType: 'findRecord' });
			}, this);

			var payload = {};
			payload[EG.String.pluralize(typeKey)] = deserialized;

			return Promise.resolve(payload);
		} catch (e) {
			Em.warn(e && e.stack);
			return Promise.reject();
		}
	},

	updateRecord: function(record) {
		try {
			var json = this.serverUpdateRecord(record);

			var payload = {};
			payload[EG.String.pluralize(record.typeKey)] = [json];

			return Promise.resolve(payload);
		} catch (e) {
			Em.warn(e && e.stack);
			return Promise.reject();
		}
	},

	deleteRecord: function(record) {
		try {
			this.serverDeleteRecord(record);
			return Promise.resolve();
		} catch (e) {
			Em.warn(e && e.stack);
			return Promise.reject();
		}
	},

	/**
	 * Serializes a single record to its JSON format.
	 *
	 * @method serialize
	 * @param {Model} record
	 * @param {Object} options
	 * @return {Object} Serialized record
	 * @protected
	 */
	serialize: function(record, options) {
		var payload = this.get('serializer').serialize(record, options);
		return payload[EG.String.pluralize(record.typeKey)][0];
	},

	/**
	 * Deserializes a single record from its JSON format.
	 *
	 * @method deserialize
	 * @param {JSON} record
	 * @param {Object} options
	 * @return {Object} Normalized JSON payload
	 * @protected
	 */
	deserialize: function(record, options) {
		var payload = {};
		payload[EG.String.pluralize(options.recordType)] = [record];
		var deserializeOptions = { requestType: 'findRecord', recordType: options.recordType, id: record.id };
		var deserialized = this.get('serializer').deserialize(payload, deserializeOptions);
		return deserialized[options.recordType][0];
	},

	/**
	 * Generates an ID for a newly created record.
	 *
	 * @method generateId
	 * @param {Model} record
	 * @return {String}
	 * @protected
	 */
	generateId: function(record) {
		return EG.generateUUID();
	},

	/**
	 * Retrieves a single record from the data store.
	 *
	 * @method retrieveRecord
	 * @param {String} typeKey
	 * @param {String} id
	 * @return {JSON}
	 * @protected
	 * @category abstract
	 */
	retrieveRecord: EG.required('retrieveRecord'),

	/**
	 * Retrieves records from the data store. If 'query`
	 * is `undefined`, it should return all records of
	 * the given type. Otherwise it should only return
	 * the records that match the given query.
	 *
	 * @method retrieveRecords
	 * @param {String} typeKey
	 * @param {Object} query
	 * @return {JSON} Array of records
	 * @protected
	 * @category abstract
	 */
	retrieveRecords: EG.required('retrieveRecords'),

	/**
	 * Modifies a set of records. The records should be updated in a transaction.
	 * Either all of the records are updated, or none of them. If the records
	 * aren't updated together, corrupted data is possible.
	 *
	 * The `updates` parameter is a list of objects that have the following fields:
	 *
	 * - `typeKey`: The type of the record to modify.
	 * - `id`: The ID of the record to modify.
	 * - `data`: The data that represents the updated version of the record.
	 *     If the value is `undefined`, the record should be removed from the store.
	 *
	 * @method modifyRecords
	 * @param {Object[]} updates
	 * @protected
	 * @category abstract
	 */
	modifyRecords: EG.required('modifyRecords'),

	/**
	 * Creates the record as if it were the server. It serializes
	 * the record, generates an ID, puts the record in the store
	 * and connects any relationships it needs to.
	 *
	 * @method serverCreateRecord
	 * @param {Model} record
	 * @return {JSON} Created record
	 * @protected
	 */
	serverCreateRecord: function(record) {
		var HAS_MANY_KEY = EG.Model.HAS_MANY_KEY;
		var HAS_ONE_KEY = EG.Model.HAS_ONE_KEY;

		// A small cache that keeps records we've already retrieved and modified
		var recordCache = {};
		var getRecord = function(typeKey, id) {
			if (!recordCache[typeKey + '.' + id]) {
				recordCache[typeKey + '.' + id] = this.retrieveRecord(typeKey, id);
			}

			return recordCache[typeKey + '.' + id];
		}.bind(this);

		// Helper functions to (dis)connect new relationships
		var store = this.get('store');
		var connectRelationshipTo = function(typeKey, id, name, value) {
			var model = store.modelForType(typeKey);
			var meta = model.metaForRelationship(name);
			var record = getRecord(typeKey, id);

			if (meta.kind === HAS_MANY_KEY) {
				record.links[name].push(value);
			} else if (meta.kind === HAS_ONE_KEY) {
				if (record.links[name] !== null) {
					disconnectRelationshipFrom(typeKey, id, name, record.links[name]);
				}

				record.links[name] = value;
			} else {
				Em.assert('Bad relationship kind');
			}
		};
		var disconnectRelationshipFrom = function(typeKey, id, name, value) {
			var model = store.modelForType(typeKey);
			var meta = model.metaForRelationship(name);
			var record = getRecord(typeKey, id);

			if (meta.kind === HAS_MANY_KEY) {
				record.links[name].splice(indexOf.call(record.links[name], value), 1);
			} else if (meta.kind === HAS_ONE_KEY) {
				if (record.links[name] === value) {
					record.links[name] = null;
				}
			} else {
				Em.assert('Bad relationship kind');
			}
		};

		// Serialize the created record and store it in the cache
		var json = this.serialize(record, { requestType: 'createRecord' });
		json.id = this.generateId(record);
		recordCache[record.typeKey + '.' + json.id] = json;

		// Connect all of the necessary relationships
		record.constructor.eachRelationship(function(name, meta) {
			if (!meta.inverse) {
				return;
			}

			if (json.links[name] === null || (Em.isArray(json.links[name]) && json.links[name].length <= 0)) {
				return;
			}

			var value = record.get('_' + name);

			if (meta.kind === HAS_MANY_KEY) {
				forEach.call(value, function(id) {
					connectRelationshipTo(meta.relatedType, id, meta.inverse, json.id);
				});
			} else if (meta.kind === HAS_ONE_KEY) {
				connectRelationshipTo(meta.relatedType, value, meta.inverse, json.id);
			} else {
				Em.assert('Bad relationship kind');
			}
		}, this);

		// Gather the modifications
		//modifications.push({ typeKey: record.typeKey, id: json.id, data: json });

		var modifications = map.call(Em.keys(recordCache), function(key) {
			return {
				typeKey: key.substring(0, key.indexOf('.')),
				id: recordCache[key].id,
				data: recordCache[key]
			};
		});

		this.modifyRecords(modifications);

		return json;
	},

	/**
	 * Updates the record as if it were the server. It serializes
	 * the record, puts the record in the store and connects any
	 * relationships it needs to.
	 *
	 * @method serverUpdateRecord
	 * @param {Model} record
	 * @return {JSON} Updated version of record
	 * @protected
	 */
	serverUpdateRecord: function(record) {

	},

	/**
	 * Deletes the record and its relationships from the store.
	 *
	 * @method serverDeleteRecord
	 * @param {Model} record
	 * @protected
	 */
	serverDeleteRecord: function(record) {

	}

});

})();

(function() {

EG.FixtureAdapter = EG.SynchronousAdapter.extend({

});

})();

(function() {

var forEach = Ember.ArrayPolyfills.forEach;

/**
 * Provides a way to persist model data to the browser's local storage.
 *
 * @class LocalStorageAdapter
 * @extends SynchronousAdapter
 * @constructor
 */
EG.LocalStorageAdapter = EG.SynchronousAdapter.extend({

	/**
	 * The value with which to prefix local storage keys.
	 * This helps separate the local storage entries made
	 * by this adapter from other data.
	 *
	 * @property keyPrefix
	 * @type String
	 * @default 'records'
	 * @final
	 */
	keyPrefix: 'records',

	retrieveRecord: function(typeKey, id) {
		var json = JSON.parse(localStorage[this.get('keyPrefix') + '.' + typeKey + '.' + id] || 'null');

		if (json) {
			return json;
		} else {
			throw new Error('The record `' + typeKey + ':' + id + '` wasn\'t found in localStorage.');
		}
	},

	retrieveRecords: function(typeKey, query) {
		Em.assert('The LocalStorageAdapter doesn\'t support queries by default.', !query);

		var record;
		var records = [];

		for (var key in localStorage) {
			if (localStorage.hasOwnProperty(key)) {
				if (EG.String.startsWith(key, this.get('keyPrefix') + '.' + typeKey)) {
					record = JSON.parse(localStorage[key] || 'null');

					if (record) {
						records.push(record);
					}
				}
			}
		}

		return records;
	},

	modifyRecords: function(updates) {
		var keyPrefix = this.get('keyPrefix');

		forEach.call(updates, function(update) {
			update.oldData = localStorage[keyPrefix +  '.' + update.typeKey + '.' + update.id];
		});

		try {
			forEach.call(updates, function(update) {
				if (update.data) {
					localStorage[keyPrefix + '.' + update.typeKey + '.' + update.id] = JSON.stringify(update.data);
				} else {
					delete localStorage[keyPrefix + '.' + update.typeKey + '.' + update.id];
				}
			});
		} catch (e) {
			forEach.call(updates, function(update) {
				localStorage[keyPrefix + '.' + update.typeKey + '.' + update.id] = '';
			});

			forEach.call(updates, function(update) {
				localStorage[keyPrefix + '.' + update.typeKey + '.' + update.id] = update.oldData;
			});

			throw e;
		}
	},

	/**
	 * Clears all records from the local storage.
	 *
	 * @method clearData
	 */
	clearData: function() {
		var keyPrefix = this.get('keyPrefix');

		forEach.call(Em.keys(localStorage), function(key) {
			if (EG.String.startsWith(key, keyPrefix)) {
				delete localStorage[key];
			}
		});
	}
});

})();

(function() {

/**
 * An adapter that communicates with REST back-ends.
 *
 * @class RESTAdapter
 * @extends Adapter
 */
EG.RESTAdapter = EG.Adapter.extend({

	/**
	 * Sends a `POST` request to `/{pluralized_type}` with the serialized record as the body.
	 *
	 * @method createRecord
	 * @param {Model} record
	 * @return {Promise} A promise that resolves to the created record
	 */
	createRecord: function(record) {
		var url = this.buildUrl(record.typeKey, null);
		var json = this.serialize(record, { requestType: 'createRecord' });

		return this.ajax(url, 'POST', json).then(function(payload) {
			return this.deserialize(payload, { requestType: 'createRecord', recordType: record.typeKey });
		}.bind(this));
	},

	/**
	 * Sends a `GET` request to `/{pluralized_type}/{id}`.
	 *
	 * @method findRecord
	 * @param {String} typeKey
	 * @param {String} id
	 * @return {Promise} A promise that resolves to the requested record
	 */
	findRecord: function(typeKey, id) {
		var url = this.buildUrl(typeKey, id);

		return this.ajax(url, 'GET').then(function(payload) {
			return this.deserialize(payload, { requestType: 'findRecord', recordType: typeKey, id: id });
		}.bind(this));
	},

	/**
	 * Sends a `GET` request to `/{pluralized_type}/{id},{id},{id}`
	 *
	 * @method findMany
	 * @param {String} typeKey
	 * @param {String[]} ids
	 * @return {Promise} A promise that resolves to an array of requested records
	 */
	findMany: function(typeKey, ids) {
		var url = this.buildUrl(typeKey, ids.join(','));

		return this.ajax(url, 'GET').then(function(payload) {
			return this.deserialize(payload, { requestType: 'findMany', recordType: typeKey, ids: ids });
		}.bind(this));
	},

	/**
	 * Sends a `GET` request to `/{pluralized_type}`.
	 *
	 * @method findAll
	 * @param {String} typeKey
	 * @return {Promise} A promise that resolves to an array of requested records
	 */
	findAll: function(typeKey) {
		var url = this.buildUrl(typeKey, null);

		return this.ajax(url, 'GET').then(function(payload) {
			return this.deserialize(payload, { requestType: 'findAll', recordType: typeKey });
		}.bind(this));
	},

	/**
	 * Sends a `GET` request to `/{pluralized_type}?option=value`.
	 *
	 * @method findQuery
	 * @param {String} typeKey
	 * @param {Object} query An object with query parameters to serialize into the URL
	 * @return {Promise} A promise that resolves to an array of requested records
	 */
	findQuery: function(typeKey, query) {
		var options = {};

		Em.keys(query).forEach(function(key) {
			options[key] = '' + query[key];
		});

		var url = this.buildUrl(typeKey, null, options);

		return this.ajax(url, 'GET').then(function(payload) {
			return this.deserialize(payload, { requestType: 'findQuery', recordType: typeKey, query: query });
		}.bind(this));
	},

	/**
	 * Sends a `PATCH` request to `/{pluralized_type}/{id}` with the record's
	 * changes serialized to JSON change operations.
	 *
	 * @method updateRecord
	 * @param {Model} record
	 * @return {Promise} A promise that resolves to the updated record
	 */
	updateRecord: function(record) {
		var url = this.buildUrl(record.typeKey, record.get('id'));
		var json = this.serialize(record, { requestType: 'updateRecord' });

		if (json.length <= 0) {
			return Em.RSVP.resolve();
		}

		return this.ajax(url, 'PATCH', json).then(function(payload) {
			return this.deserialize(payload, { requestType: 'updateRecord', recordType: record.typeKey });
		}.bind(this));
	},

	/**
	 * Sends a `DELETE` request to `/{singularized_type}/{id}`.
	 *
	 * @method deleteRecord
	 * @param {Model} record
	 * @return {Promise} A promise that resolves on success and rejects on failure
	 */
	deleteRecord: function(record) {
		var url = this.buildUrl(record.typeKey, record.get('id'));

		return this.ajax(url, 'DELETE').then(function(payload) {
			var options = { requestType: 'deleteRecord', recordType: record.typeKey };
			return this.deserialize(payload, options);
		}.bind(this));
	},

	/**
	 * This function will build the URL that the request will be posted to.
	 * The options must be strings, but they don't have to be escaped,
	 * this function will do that.
	 *
	 * @method buildUrl
	 * @param {String} typeKey
	 * @param {String} [id]
	 * @param {Object} [options]
	 * @return {String}
	 * @protected
	 */
	buildUrl: function(typeKey, id, options) {
		var url = this.get('prefix') + '/' + EG.String.pluralize(typeKey);

		if (id) {
			url += '/' + id;
		}

		if (options) {
			Em.keys(options).forEach(function(key, index) {
				url += ((index === 0) ? '?' : '&') + key + '=' + encodeURIComponent(options[key]);
			});
		}

		return url;
	},

	/**
	 * This property is used by the adapter when forming the URL for requests.
	 * The adapter normally makes requests to the current location. So the URL
	 * looks like `/users/6`. If you want to add a different host, or a prefix,
	 * override this property.
	 *
	 * Warning: Do **not** include a trailing slash. The adapter won't check for
	 * mistakes, so just don't do it.
	 *
	 * @property prefix
	 * @type String
	 * @default ''
	 */
	prefix: Em.computed(function() {
		return '';
	}).property(),

	/**
	 * This method sends the request to the server.
	 * The response is processed in the Ember run-loop.
	 *
	 * @method ajax
	 * @param {String} url
	 * @param {String} verb `GET`, `POST`, `PATCH` or `DELETE`
	 * @param {String} [body=undefined]
	 * @return {Promise}
	 * @protected
	 */
	ajax: function(url, verb, body) {
		var headers = this.headers(url, verb, body);

		return new Em.RSVP.Promise(function(resolve, reject) {
			$.ajax({
				cache: false,
				contentType: 'application/json',
				data: (body === undefined ? undefined : (Em.typeOf(body) === 'string' ? body : JSON.stringify(body))),
				headers: headers,
				processData: false,
				type: verb,
				url: url,

				error: function(jqXHR, textStatus, error) {
					Em.run(null, reject, error);
				},

				success: function(data, status, jqXHR) {
					Em.run(null, resolve, data);
				}
			});
		});
	},

	/**
	 * This is a small hook to allow including extra headers in the AJAX request.
	 *
	 * @method headers
	 * @param {String} url
	 * @param {String} verb `GET`, `POST`, `PATCH` or `DELETE`
	 * @param {String} [body=undefined]
	 * @return {Object} Headers to give to jQuery `ajax` function
	 * @protected
	 */
	headers: function(url, verb, body) {
		return {};
	}
});

})();

(function() {

/**
 * The store is used to manage all records in the application.
 * Ideally, there should only be one store for an application.
 *
 * @class Store
 * @constructor
 */
EG.Store = Em.Object.extend({

	/**
	 * The adapter to use if an application adapter is not found.
	 *
	 * @property defaultAdapter
	 * @type String
	 * @default `'rest'`
	 */
	defaultAdapter: 'rest',

	/**
	 * The number of milliseconds after a record in the cache expires
	 * and must be re-fetched from the server. Leave at Infinity for
	 * now, as finite timeouts will likely cause a lot of bugs.
	 */
	cacheTimeout: Infinity,

	/**
	 * Contains the records cached in the store. The keys are type names,
	 * and the values are nested objects keyed at the ID of the record.
	 *
	 * @type {Object.<String, Model>}
	 */
	_records: {},

	/**
	 * The adapter used by the store to communicate with the server.
	 * The adapter is found by looking for App.ApplicationAdapter.
	 * If not found, defaults to the REST adapter.
	 */
	adapter: Em.computed(function() {
		var container = this.get('container');
		var adapter = container.lookup('adapter:application') ||
			container.lookup('adapter:' + this.get('defaultAdapter'));

		Em.assert('A valid adapter could not be found.', EG.Adapter.detectInstance(adapter));

		return adapter;
	}).property(),

	/**
	 * Initializes all of the variables properly
	 */
	init: function() {
		this.set('_records', {});
		this.set('_types', {});
		this.set('_relationships', {});
		this.set('_queuedRelationships', {});
	},

	/**
	 * Gets a record from the store's cached records (including timestamp).
	 *
	 * @param {String} typeKey
	 * @param {String} id
	 * @private
	 */
	_getRecord: function(typeKey, id) {
		var records = this.get('_records');
		records[typeKey] = records[typeKey] || {};
		return records[typeKey][id];
	},

	/**
	 * Puts a record into the store's cached records.
	 * Overwrites the old instance of it if it exists.
	 *
	 * @param {String} typeKey
	 * @param {Model} record
	 * @private
	 */
	_setRecord: function(typeKey, record) {
		var records = this.get('_records');
		records[typeKey] = records[typeKey] || {};
		records[typeKey][record.get('id')] = {
			record: record,
			timestamp: new Date().getTime()
		};
	},

	/**
	 * Deletes a record from the store's cached records.
	 *
	 * @param {Store} typeKey
	 * @param {String} id
	 * @private
	 */
	_deleteRecord: function(typeKey, id) {
		var records = this.get('_records');
		records[typeKey] = records[typeKey] || {};
		delete records[typeKey][id];
	},

	/**
	 * Looks up the model for the specified typeKey. The `typeKey` property
	 * isn't available on the class or its instances until the type is
	 * looked up with this method for the first time.
	 *
	 * @method modelForType
	 * @param {String} typeKey
	 * @returns {Model}
	 */
	modelForType: function(typeKey) {
		this._modelCache = this._modelCache || {};
		var factory = this.get('container').lookupFactory('model:' + typeKey);

		if (!this._modelCache[typeKey]) {
			this._modelCache[typeKey] = factory;
			factory.reopen({ typeKey: typeKey });
			factory.reopenClass({ typeKey: typeKey });
		}

		return factory;
	},

	/**
	 * Creates a record of the specified type. If the JSON has an ID,
	 * then the record 'created' is a permanent record from the server.
	 * If it doesn't contain an ID, the store assumes that it's new.
	 *
	 * @method createRecord
	 * @param {String} typeKey
	 * @param {Object} json
	 * @returns {Model}
	 */
	createRecord: function(typeKey, json) {
		json = json || {};

		var record = this.modelForType(typeKey)._create();
		record.set('store', this);
		record.set('id', EG.Model.temporaryIdPrefix + EG.generateUUID());

		this._setRecord(typeKey, record);

		record.loadData(json);

		return record;
	},

	/**
	 * Loads an already created record into the store. This method
	 * should probably only be used by the store or adapter.
	 *
	 * @param typeKey
	 * @param json
	 * @deprecated Use `extractPayload` instead
	 */
	_loadRecord: function(typeKey, json) {
		var record = this.modelForType(typeKey)._create();
		record.set('store', this);
		record.set('id', json.id);

		this._setRecord(typeKey, record);

		if (this._hasQueuedRelationships(typeKey, json.id)) {
			this._connectQueuedRelationships(record);
		}

		record.loadData(json);

		return record;
	},

	/**
	 * Returns all records of the given type that are in the cache.
	 *
	 * @method cachedRecordsFor
	 * @param {String} typeKey
	 * @returns {Array} Array of records of the given type
	 */
	cachedRecordsFor: function(typeKey) {
		var records = this.get('_records.' + typeKey) || {};
		var timeout = new Date().getTime() - this.get('cacheTimeout');

		return Em.keys(records).map(function(id) {
			var recordShell = records[id];

			if (recordShell.timestamp >= timeout) {
				return recordShell.record;
			} else {
				return undefined;
			}
		});
	},

	/**
	 * Fetches a record (or records), either from the cache or from the server.
	 * Options can be different types which have different functions:
	 *
	 * ID String - Fetches a single record by ID
	 * ID Enumerable - Fetches many records by the IDs
	 * Object - A query that is passed to the adapter
	 * undefined - Fetches all records of a type
	 *
	 * @method find
	 * @param {String} typeKey
	 * @param {String|String[]|Object} options
	 * @returns {PromiseObject|PromiseArray}
	 */
	find: function(typeKey, options) {
		if (arguments.length > 1 && !options) {
			throw new Ember.Error('A bad `find` call was made to the store.');
		}

		switch (Em.typeOf(options)) {
			case 'string':
			case 'number':
				return this._findSingle(typeKey, options + '');
			case 'array':
				return this._findMany(typeKey, options);
			case 'object':
				return this._findQuery(typeKey, options);
			case 'undefined':
				return this._findAll(typeKey);
			default:
				throw new Ember.Error('A bad `find` call was made to the store.');
		}
	},

	/**
	 * Returns the record directly if the record is cached in the store.
	 * Otherwise returns null.
	 *
	 * @method getRecord
	 * @param {String} typeKey
	 * @param {String} id
	 * @returns {Model}
	 */
	getRecord: function(typeKey, id) {
		var record = this._getRecord(typeKey, id);
		var timeout = new Date().getTime() - this.get('cacheTimeout');

		if (record && record.record) {
			return (record.timestamp >= timeout ? record.record : null);
		} else {
			return null;
		}
	},

	/**
	 * Gets a single record from the adapter as a PromiseObject.
	 *
	 * @param {String} type
	 * @param {String} id
	 * @return {PromiseObject}
	 * @private
	 */
	_findSingle: function(type, id) {
		var record = this.getRecord(type, id);
		var promise;

		if (record) {
			promise = Em.RSVP.Promise.resolve(record);
		} else {
			promise = this.get('adapter').findRecord(type, id).then(function(payload) {
				this.extractPayload(payload);
				return this.getRecord(type, id);
			}.bind(this));
		}

		return EG.ModelPromiseObject.create({
			id: id,
			promise: promise
		});
	},

	/**
	 * Gets many records from the adapter as a PromiseArray.
	 *
	 * @param {String} type
	 * @param {String[]} ids
	 * @returns {PromiseArray}
	 * @private
	 */
	_findMany: function(type, ids) {
		ids = ids || [];
		var set = new Em.Set(ids);

		ids.forEach(function(id) {
			if (this.getRecord(type, id) !== null) {
				set.removeObject(id);
			}
		}, this);

		var promise;

		if (set.length === 0) {
			promise = Em.RSVP.Promise.resolve(ids.map(function(id) {
				return this.getRecord(type, id);
			}, this));
		} else {
			promise = this.get('adapter').findMany(type, set.toArray()).then(function(payload) {
				this.extractPayload(payload);

				return ids.map(function(id) {
					return this.getRecord(type, id);
				}, this).toArray();
			}.bind(this));
		}

		return EG.PromiseArray.create({ promise: promise });
	},

	/**
	 * Gets all of the records of a type from the adapter as a PromiseArray.
	 *
	 * @param {String} type
	 * @returns {PromiseArray}
	 * @private
	 */
	_findAll: function(type) {
		var promise = this.get('adapter').findAll(type).then(function(payload) {
			this.extractPayload(payload);
			return this.cachedRecordsFor(type);
		}.bind(this));

		return EG.PromiseArray.create({ promise: promise });
	},

	/**
	 * Gets records for a query from the adapter as a PromiseArray.
	 *
	 * @param {String} typeKey
	 * @param {Object} options
	 * @returns {PromiseArray}
	 * @private
	 */
	_findQuery: function(typeKey, options) {
		var promise = this.get('adapter').findQuery(typeKey, options).then(function(payload) {
			var ids = payload.meta.ids;
			this.extractPayload(payload);

			return ids.map(function(id) {
				return this.getRecord(typeKey, id);
			}, this);
		}.bind(this));

		return EG.PromiseArray.create({ promise: promise });
	},

	/**
	 * Returns true if the record is cached in the store, false otherwise.
	 *
	 * @method hasRecord
	 * @param {String|Model} typeKey
	 * @param {String} id
	 * @returns {Boolean}
	 */
	hasRecord: function(typeKey, id) {
		return this.getRecord(typeKey, id) !== null;
	},

	/**
	 * @method saveRecord
	 * @param {Model} record
	 * @returns {Promise} Resolves to the saved record
	 */
	saveRecord: function(record) {
		var type = record.typeKey;
		var isNew = record.get('isNew');
		var tempId = record.get('id');

		if (isNew) {
			return this.get('adapter').createRecord(record).then(function(payload) {
				record.set('id', payload.meta.newId);

				this._deleteRecord(type, tempId);
				this._setRecord(type, record);

				this.extractPayload(payload);
				return record;
			}.bind(this));
		} else {
			return this.get('adapter').updateRecord(record).then(function(payload) {
				this.extractPayload(payload);
				return record;
			}.bind(this));
		}
	},

	/**
	 * @method deleteRecord
	 * @param {Model} record
	 * @returns {Promise}
	 */
	deleteRecord: function(record) {
		var type = record.typeKey;
		var id = record.get('id');
		var records = (this.get('_records.' + type) || {});

		return this.get('adapter').deleteRecord(record).then(function(payload) {
			this._deleteRelationshipsForRecord(type, id);
			this.extractPayload(payload);
			this._deleteRecord(type, id);
		}.bind(this));
	},

	/**
	 * @method reloadRecord
	 * @param {Model} record
	 * @returns {Promise} Resolves to the reloaded record
	 */
	reloadRecord: function(record) {
		Em.assert('You can\'t reload record `' + record.typeKey + ':' +
			record.get('id') + '` while it\'s dirty.', !record.get('isDirty'));

		return this.get('adapter').findRecord(record.typeKey, record.get('id')).then(function(payload) {
			this.extractPayload(payload);
			return record;
		}.bind(this));
	},

	/**
	 * Takes a normalized payload from the server and load the
	 * record into the store. This format is called normalized JSON
	 * and allows you to easily load multiple records in at once.
	 * Normalized JSON is a single object that contains keys that are
	 * model type names, and whose values are arrays of JSON records.
	 * In addition, there is a single `meta` key that contains some
	 * extra information that the store may need. For example, say
	 * that the following models were defined:
	 *
	 * ```js
	 * App.Post = EG.Model.extend({
	 *     title: EG.attr({ type: 'string' }),
	 *     tags: EG.hasMany({ relatedType: 'tag', inverse: null })
	 * });
	 *
	 * App.Tag = EG.Model.extend({
	 *     name: EG.attr({ type: 'string' })
	 * });
	 * ```
	 *
	 * A normalized JSON payload for these models might look like this:
	 *
	 * ```js
	 * {
	 *     post: [
	 *         { id: '1', title: 'Introduction To Ember-Graph', tags: [] },
	 *         { id: '2', title: 'Defining Models', tags: ['1', '3'] },
	 *         { id: '3', title: 'Connecting to a REST API', tags: ['2'] }
	 *     ],
	 *     tag: [
	 *         { id: '1', name: 'relationship' },
	 *         { id: '2', name: 'adapter' },
	 *         { id: '3', name: 'store' }
	 *     ],
	 *     meta: {}
	 * }
	 * ```
	 *
	 * Notice that the names of the types are in singular form. Also, the
	 * records contain all attributes and relationships in the top level.
	 * In addition, all IDs (either of records or in relationships) must
	 * be strings, not numbers.
	 *
	 * This format allows records to be easily loaded into the store even
	 * if they weren't specifically requested (side-loading). The store
	 * doesn't care how or where the records come from, as long as they can
	 * be converted to this form.
	 *
	 * @method extractPayload
	 * @param {Object} payload
	 */
	extractPayload: function(payload) {
		Em.changeProperties(function() {
			var reloadDirty = this.get('reloadDirty');

			Em.keys(payload).forEach(function(typeKey) {
				if (typeKey === 'meta') {
					return;
				}

				var type = this.modelForType(typeKey);

				payload[typeKey].forEach(function(json) {
					var record = this.getRecord(typeKey, json.id);

					if (record) {
						if (!record.get('isDirty') || reloadDirty) {
							record.loadData(json);
						}
					} else {
						this._loadRecord(typeKey, json);
					}
				}, this);
			}, this);
		}, this);
	},

	/**
	 * Returns an AttributeType instance for the given type.
	 *
	 * @method attributeTypeFor
	 * @param {String} typeName
	 * @returns {AttributeType}
	 */
	attributeTypeFor: function(typeName) {
		var attributeType = this.get('container').lookup('type:' + typeName);
		Em.assert('Can\'t find an attribute type for the \'' + typeName + '\' type.', !!attributeType);
		return attributeType;
	}
});


})();

(function() {

EG.Store.reopen({

	/**
	 * A boolean for whether or not to reload dirty records. If this is
	 * true, data from the server will be merged with the data on the
	 * client according to the other options defined on this class.
	 * If it's false, calling reload on a dirty record will throw an
	 * error, and any side loaded data from the server will be discarded.
	 *
	 * Note: If this is turned off, no relationship can be reloaded if
	 * either of the records is dirty. So if the server says that
	 * record 1 is connected to record 2, and you reload record 1, which
	 * is clean, Ember-Graph will abort the reload if record 2 is dirty.
	 * This is a particularly annoying corner case that can be mostly
	 * avoided in two ways: either enable reloadDirty, or ensure that
	 * records are changed and then saved or rollback back in the same
	 * 'action'. (Don't let users perform different modifications at
	 * the same time.)
	 *
	 * @property reloadDirty
	 * @for Store
	 * @type {Boolean}
	 */
	reloadDirty: true,

	/**
	 * If reloadDirty is true, this determines which side the store will
	 * settle conflicts for. If true, new client side relationships always
	 * take precedence over server side relationships loaded when the
	 * record is dirty. If false, server side relationships will overwrite
	 * any temporary client side relationships on reload.
	 *
	 * Note: This only affects relationships. Attributes aren't as tricky,
	 * so the server data can be loaded without affecting the client data.
	 * To have the server overwrite client data, use the option below.
	 *
	 * @property sideWithClientOnConflict
	 * @for Store
	 * @type {Boolean}
	 */
	sideWithClientOnConflict: true,

	/**
	 * If reloadDirty is true, this will overwrite client attributes on
	 * reload. Because of the more simplistic nature of attributes, it is
	 * recommended to keep this false. The server data will still be loaded
	 * into the record and can be activated at any time by rolling back
	 * attribute changes on the record.
	 *
	 * @property overwriteClientAttributes
	 * @for Store
	 * @type {Boolean}
	 */
	overwriteClientAttributes: false,

	/**
	 * Stores all of the relationships created so far.
	 *
	 * @type {Object.<String, Relationship>}
	 */
	_relationships: {},

	/**
	 * Holds all of the relationships that are waiting to be connected to a record
	 * when it gets loaded into the store. (relationship ID -> relationship)
	 *
	 * @type {Object.<String, Relationship>}
	 */
	_queuedRelationships: null,

	/**
	 * @param {String} typeKey
	 * @param {String} id
	 * @returns {Boolean}
	 */
	_hasQueuedRelationships: function(typeKey, id) {
		var qid, relationship;
		var queuedRelationships = this.get('_queuedRelationships');

		for (qid in queuedRelationships) {
			if (queuedRelationships.hasOwnProperty(qid)) {
				if (queuedRelationships[qid].get('type2') === typeKey &&
					queuedRelationships[qid].get('object2') === id) {
					return true;
				}
			}
		}

		return false;
	},

	/**
	 * Will connect all queued relationships to the given record.
	 *
	 * @param {Model} record
	 */
	_connectQueuedRelationships: function(record) {
		var queued = this.get('_queuedRelationships');
		var toConnect = this._queuedRelationshipsFor(record.typeKey, record.get('id'));

		toConnect.forEach(function(relationship) {
			record._connectRelationship(relationship);
			relationship.set('object2', record);
			delete queued[relationship.get('id')];
		});

		this.notifyPropertyChange('_queuedRelationships');
	},

	/**
	 * Gets all of the relationships that are queued to be connected to the given record.
	 * Does not deleted the relationships from the queue, just fetches them.
	 *
	 * @param {String} typeKey
	 * @param {String} id
	 * @returns {Relationship[]}
	 * @private
	 */
	_queuedRelationshipsFor: function(typeKey, id) {
		var current, relationships = [];
		var queued = this.get('_queuedRelationships');

		for (var relationshipId in queued) {
			if (queued.hasOwnProperty(relationshipId)) {
				current = queued[relationshipId];
				if (current.get('type2') === typeKey && current.get('object2') === id) {
					relationships.push(current);
				}
			}
		}

		return relationships;
	},

	/**
	 * Creates a new relationship and connects the two records,
	 * queueing the relationship if necessary.
	 *
	 * @param {String} type1
	 * @param {String} relationship1
	 * @param {String} id1
	 * @param {String} type2
	 * @param {String} relationship2
	 * @param {String} id2
	 * @param {String} state The state of the relationship
	 */
	_createRelationship: function(type1, relationship1, id1, type2, relationship2, id2, state) { // jshint ignore:line
		var record1 = this.getRecord(type1, id1);
		var record2 = this.getRecord(type2, id2);

		if (record1 === null && record2 === null) {
			return;
		}

		if (record1 === null) {
			var temp = record1;
			record1 = record2;
			record2 = temp;

			temp = id1;
			id1 = id2;
			id2 = id1;

			temp = relationship1;
			relationship1 = relationship2;
			relationship2 = temp;
		}

		if (relationship1 === null) {
			return;
		}

		if (record1._isLinkedTo(relationship1, id2)) {
			// TODO: Do we need to check both sides, or can we assume consistency?
			return;
		}

		var relationship = EG.Relationship.create({
			object1: record1,
			relationship1: relationship1,
			object2: (record2 === null ? id2 : record2),
			relationship2: relationship2,
			state: state
		});

		this.get('_relationships')[relationship.get('id')] = relationship;

		record1._connectRelationship(relationship);

		if (record2 !== null) {
			record2._connectRelationship(relationship);
		} else {
			this.set('_queuedRelationships.' + relationship.get('id'), relationship);
			this.notifyPropertyChange('_queuedRelationships');
		}
	},

	/**
	 * Deletes the given relationship. Disconnects from both records,
	 * then destroys, all references to the relationship.
	 *
	 * @param {String} id
	 */
	_deleteRelationship: function(id) {
		var relationship = this.get('_relationships')[id];
		if (Em.isNone(relationship)) {
			return;
		}

		var object1 = relationship.get('object1');
		var object2 = relationship.get('object2');

		object1._disconnectRelationship(relationship);
		if (EG.Model.detectInstance(object2)) {
			object2._disconnectRelationship(relationship);
		} else {
			delete this.get('_queuedRelationships')[id];
			this.notifyPropertyChange('_queuedRelationships');
		}

		delete this.get('_relationships')[id];
	},

	/**
	 * @param {String} id
	 * @param {String} state
	 */
	_changeRelationshipState: function(id, state) {
		var relationship = this.get('_relationships')[id];
		if (Em.isNone(relationship) || relationship.get('state') === state) {
			return;
		}

		var object1 = relationship.get('object1');
		var object2 = relationship.get('object2');

		var oldHash = EG.Relationship.stateToHash(relationship.get('state'));
		var newHash = EG.Relationship.stateToHash(state);

		relationship.set('state', state);

		object1.set(newHash + '.' + id, object1.get(oldHash + '.' + id));
		delete object1.get(oldHash)[id];
		object1.notifyPropertyChange(oldHash);
		object1.notifyPropertyChange(newHash);

		if (EG.Model.detectInstance(object2)) {
			object2.set(newHash + '.' + id, object2.get(oldHash + '.' + id));
			delete object2.get(oldHash)[id];
			object2.notifyPropertyChange(oldHash);
			object2.notifyPropertyChange(newHash);
		}
	},

	/**
	 * Gets all relationships related to the given record.
	 *
	 * @param {String} typeKey
	 * @param {String} name
	 * @param {String} id
	 * @returns {Relationship[]}
	 */
	_relationshipsForRecord: function(typeKey, name, id) {
		var rid, relationship, object2;
		var all = [];
		var relationships = this.get('_relationships');

		for (rid in relationships) {
			if (relationships.hasOwnProperty(rid)) {
				relationship = relationships[rid];

				if (relationship.get('type1') === typeKey && relationship.get('id') === id &&
					relationship.get('relationship1') === name) {
					all.push(relationship);
					continue;
				}

				if (relationship.get('type2') === typeKey && relationship.get('relationship2') === name) {
					object2 = relationship.get('object2');

					if (Em.typeOf(object2) === 'string') {
						if (object2 === id) {
							all.push(relationship);
							continue;
						}
					} else if (object2.get('id') === id) {
						all.push(relationship);
						continue;
					}
				}
			}
		}

		return all;
	},

	_deleteRelationshipsForRecord: function(typeKey, id) {
		var current;
		var relationships = this.get('_relationships');
		for (var i in relationships) {
			if (relationships.hasOwnProperty(i)) {
				current = relationships[i];
				if (current.isConnectedTo(typeKey, id)) {
					this._deleteRelationship(Em.get(current, 'id'));
				}
			}
		}
	}
});


})();

(function() {

/**
 * Ember's ObjectProxy combined with the PromiseProxyMixin.
 * Acts as an object and proxies all properties to the
 * given promise when it resolves.
 *
 * @class PromiseObject
 */
EG.PromiseObject = Em.ObjectProxy.extend(Em.PromiseProxyMixin);

/**
 * Ember's ArrayProxy combined with the PromiseProxyMixin.
 * Acts as an array and proxies all properties to the
 * given promise when it resolves.
 *
 * @class PromiseArray
 */
EG.PromiseArray = Em.ArrayProxy.extend(Em.PromiseProxyMixin);

/**
 * Acts just like `PromiseObject` only it's able to hold the
 * ID of a model before it's resolved completely.
 *
 * @class ModelPromiseObject
 * @extends PromiseObject
 */
EG.ModelPromiseObject = EG.PromiseObject.extend({
	__modelId: null,

	id: function(key, value) {
		var content = this.get('content');

		if (arguments.length > 1) {
			if (content && content.set) {
				content.set('id', value);
			} else {
				this.set('__modelId', value);
			}
		}

		if (content && content.get) {
			return content.get('id');
		} else {
			return this.get('__modelId');
		}
	}.property('__modelId', 'content.id')
});

/**
 * Acts just like `PromiseArray` only it's able to hold the
 * IDs of the models before they're resolved completely.
 *
 * @class ModelPromiseArray
 * @extends PromiseArray
 */
EG.ModelPromiseArray = EG.PromiseArray.extend({
	ids: function(key, value) {
		this.set('content', (value || []).map(function(id) {
			return {
				id: id
			};
		}));
	}.property()
});

})();

(function() {

var NEW_STATE = 'new';
var SAVED_STATE = 'saved';
var DELETED_STATE = 'deleted';

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
	init: function() {
		this.set('id', Em.generateGuid(null, 'relationship'));
	},

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
			return (Em.typeOf(object2) === 'string' ? object2 : object2.get('id'));
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

			if (Em.typeOf(object2) === 'string') {
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
		Em.assert('The first object must always be a record.', EG.Model.detectInstance(properties.object1));
		Em.assert('You must include a relationship name for the first object.',
			Em.typeOf(properties.relationship1) === 'string');
		Em.assert('The second object must either be a record, or a permanent ID.',
			EG.Model.detectInstance(properties.object2) || (Em.typeOf(properties.object2) === 'string' &&
			!EG.String.startsWith(properties.object2, EG.Model.temporaryIdPrefix)));
		Em.assert('You must include a relationship name for the second object.',
			Em.typeOf(properties.relationship1) === 'string' || properties.relationship1 === null);
		relationship.setProperties(properties);

		relationship.set('type1', properties.object1.typeKey);

		if (EG.Model.detectInstance(properties.object2)) {
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

})();

(function() {

/**
 * Specifies the details of a custom attribute type.
 * Comes with reasonable defaults that can be used for some extended types.
 *
 * @class AttributeType
 * @constructor
 */
EG.AttributeType = Em.Object.extend({

	/**
	 * The default value to use if a value of this type is missing.
	 * Can be overridden in subclasses.
	 *
	 * @property defaultValue
	 * @type Any
	 * @default null
	 * @final
	 */
	defaultValue: null,

	/**
	 * Converts a value of this type to its JSON form.
	 * The default function returns the value given.
	 *
	 * @method serialize
	 * @param {Any} obj Javascript value
	 * @return {JSON} JSON representation
	 */
	serialize: function(obj) {
		return obj;
	},

	/**
	 * Converts a JSON value to its Javascript form.
	 * The default function returns the value given.
	 *
	 * @method deserialize
	 * @param {JSON} json JSON representation of object
	 * @return {Any} Javascript value
	 */
	deserialize: function(json) {
		return json;
	},

	/**
	 * Determines if two values of this type are equal.
	 * Defaults to using `===`.
	 *
	 * @method isEqual
	 * @param {Any} a Javascript object
	 * @param {Any} b Javascript object
	 * @returns {Boolean} Whether or not the objects are equal or not
	 */
	isEqual: function(a, b) {
		return (a === b);
	}
});

})();

(function() {

/**
 * @class ArrayType
 * @extends AttributeType
 * @constructor
 */
EG.ArrayType = EG.AttributeType.extend({

	/**
	 * If the object is an array, it's returned. Otherwise, `null` is returned.
	 * This doesn't check the individual elements, just the array.
	 *
	 * @method serialize
	 * @param {Array} arr
	 * @returns {Array}
	 */
	serialize: function(arr) {
		if (Em.isNone(obj)) {
			return null;
		}

		obj = (obj.toArray ? obj.toArray() : obj);
		return (Em.isArray(obj) ? obj : null);
	},

	/**
	 * If the object is an array, it's returned. Otherwise, `null` is returned.
	 * This doesn't check the individual elements, just the array.
	 *
	 * @method deserialize
	 * @param {Array} arr
	 * @returns {Array}
	 */
	deserialize: function(arr) {
		return (Em.isArray(arr) ? arr : null);
	},

	/**
	 * Compares two arrays using `Ember.compare`.
	 *
	 * @method isEqual
	 * @param {Array} a
	 * @param {Array} b
	 * @returns {Boolean}
	 */
	isEqual: function(a, b) {
		if (!Em.isArray(a) || !Em.isArray(b)) {
			return false;
		}

		return Em.compare(a.toArray(), b.toArray()) === 0;
	}
});

})();

(function() {

/**
 * @class BooleanType
 * @extends AttributeType
 * @constructor
 */
EG.BooleanType = EG.AttributeType.extend({

	/**
	 * @property defaultValue
	 * @default false
	 * @final
	 */
	defaultValue: false,

	/**
	 * Coerces to a boolean using
	 * {{link-to-method 'BooleanType' 'coerceToBoolean'}}.
	 *
	 * @method serialize
	 * @param {Boolean} bool
	 * @return {Boolean}
	 */
	serialize: function(bool) {
		return this.coerceToBoolean(bool);
	},

	/**
	 * Coerces to a boolean using
	 * {{link-to-method 'BooleanType' 'coerceToBoolean'}}.
	 *
	 * @method deserialize
	 * @param {Boolean} json
	 * @return {Boolean}
	 */
	deserialize: function(json) {
		return this.coerceToBoolean(json);
	},

	/**
	 * Coerces a value to a boolean. `true` and `'true'` resolve to
	 * `true`, everything else resolves to `false`.
	 *
	 * @method coerceToBoolean
	 * @param {Any} obj
	 * @return {Boolean}
	 */
	coerceToBoolean: function(obj) {
		if (Em.typeOf(obj) === 'boolean' && obj == true) { // jshint ignore:line
			return true;
		}

		if (Em.typeOf(obj) === 'string' && obj == 'true') {  // jshint ignore:line
			return true;
		}

		return false;
	}
});

})();

(function() {

/**
 * @class DateType
 * @extends AttributeType
 * @constructor
 */
EG.DateType = EG.AttributeType.extend({

	/**
	 * Converts any Date object, number or string to a timestamp.
	 *
	 * @method serialize
	 * @param {Date|Number|String} date
	 * @return {Number}
	 */
	serialize: function(date) {
		switch (Em.typeOf(date)) {
			case 'date':
				return date.getTime();
			case 'number':
				return date;
			case 'string':
				return new Date(date).getTime();
			default:
				return null;
		}
	},

	/**
	 * Converts any numeric or string timestamp to a Date object.
	 * Everything else gets converted to `null`.
	 *
	 * @method deserialize
	 * @param {Number|String} timestamp
	 * @return {Date}
	 */
	deserialize: function(timestamp) {
		switch (Em.typeOf(timestamp)) {
			case 'number':
			case 'string':
				return new Date(timestamp);
			default:
				return null;
		}
	},

	/**
	 * Converts both arguments to a timestamp, then compares.
	 *
	 * @param {Date} a
	 * @param {Date} b
	 * @return {Boolean}
	 */
	isEqual: function(a, b) {
		var aNone = (a === null);
		var bNone = (b === null);

		if (aNone && bNone) {
			return true;
		} else if ((aNone && !bNone) || (!aNone && bNone)) {
			return false;
		} else {
			return (new Date(a).getTime() === new Date(b).getTime());
		}
	}
});

})();

(function() {

/**
 * Represents an enumeration or multiple choice type. This class cannot be
 * instantiated directly, you must extend the class, overriding both the
 * `defaultValue` and `values` properties. The `values` property must be
 * an array of unique strings (case insensitive). The `defaultValue` must
 * be a string, and the value must also exist in the `values` array.
 *
 * @class EnumType
 */
EG.EnumType = EG.AttributeType.extend({

	/**
	 * The default enum value. Must be overridden in subclasses.
	 *
	 * @property defaultValue
	 * @type String
	 * @final
	 */
	defaultValue: Em.computed(function() {
		throw new Error('You must override the `defaultValue` in an enumeration type.');
	}).property(),

	/**
	 * @property values
	 * @type {Array<String>}
	 * @default []
	 * @final
	 */
	values: [],

	/**
	 * Contains all of the values converted to lower case.
	 *
	 * @property valueSet
	 * @type {Set<String>}
	 * @default []
	 * @final
	 */
	valueSet: Em.computed(function() {
		return new Em.Set(this.get('values').map(function(value) {
			return value.toLocaleLowerCase();
		}));
	}).property('values'),

	/**
	 * Determines if the given option is a valid enum value.
	 *
	 * @property isValidValue
	 * @param {String} option
	 * @return {Boolean}
	 */
	isValidValue: function(option) {
		return this.get('valueSet').contains(option.toLowerCase());
	},

	/**
	 * Converts the given option to a valid enum value.
	 * If the given value isn't valid, it uses the default value.
	 *
	 * @method serialize
	 * @param {String} option
	 * @return {String}
	 */
	serialize: function(option) {
		option = option + '';

		if (this.isValidValue(option)) {
			return option;
		} else {
			var defaultValue = this.get('defaultValue');

			if (this.isValidValue(defaultValue)) {
				return defaultValue;
			} else {
				throw new Error('The default value you provided isn\'t a valid value.');
			}
		}
	},

	/**
	 *
	 * Converts the given option to a valid enum value.
	 * If the given value isn't valid, it uses the default value.
	 *
	 * @method deserialize
	 * @param {String} option
	 * @return {String}
	 */
	deserialize: Em.aliasMethod('serialize'),

	/**
	 * Compares two enum values, case-insensitive.
	 * @param {String} a
	 * @param {String} b
	 * @return {Boolean}
	 */
	isEqual: function(a, b) {
		if (Em.typeOf(a) !== 'string' || Em.typeOf(b) !== 'string') {
			return false;
		} else {
			return ((a + '').toLocaleLowerCase() === (b + '').toLocaleLowerCase());
		}
	}
});

})();

(function() {

/**
 * Will coerce any type to a number (0 being the default). `null` is not a valid value.
 *
 * @class NumberType
 * @extends AttributeType
 * @constructor
 */
EG.NumberType = EG.AttributeType.extend({

	/**
	 * @property defaultValue
	 * @default 0
	 * @final
	 */
	defaultValue: 0,

	/**
	 * Coerces the given value to a number.
	 *
	 * @method serialize
	 * @param {Number} obj Javascript object
	 * @return {Number} JSON representation
	 */
	serialize: function(obj) {
		return this.coerceToNumber(obj);
	},

	/**
	 * Coerces the given value to a number.
	 *
	 * @method deserialize
	 * @param {Number} json JSON representation of object
	 * @return {Number} Javascript object
	 */
	deserialize: function(json) {
		return this.coerceToNumber(json);
	},

	/**
	 * If the object passed is a number (and not NaN), it returns
	 * the object coerced to a number primitive. If the object is
	 * a string, it attempts to parse it (again, no NaN allowed).
	 * Otherwise, the default value is returned.
	 *
	 * @method coerceToNumber
	 * @param {Any} obj
	 * @return {Number}
	 * @protected
	 */
	coerceToNumber: function(obj) {
		if (this.isValidNumber(obj)) {
			return Number(obj).valueOf();
		}

		if (Em.typeOf(obj) === 'string') {
			var parsed = Number(obj).valueOf();
			if (this.isValidNumber(parsed)) {
				return parsed;
			}
		}

		return 0;
	},

	/**
	 * Determines if the given number is an actual number and finite.
	 *
	 * @method isValidNumber
	 * @param {Number} num
	 * @return {Boolean}
	 * @protected
	 */
	isValidNumber: function(num) {
		return (Em.typeOf(num) === 'number' && !isNaN(num) && isFinite(num));
	}
});

})();

(function() {

/**
 * @class ObjectType
 * @extends AttributeType
 * @constructor
 */
EG.ObjectType = EG.AttributeType.extend({

	/**
	 * If the value is a JSON object, it's returned.
	 * Otherwise, it serializes to `null`.
	 *
	 * @method serialize
	 * @param {Object} obj
	 * @return {Object}
	 */
	serialize: function(obj) {
		if (this.isObject(obj)) {
			try {
				JSON.stringify(obj);
				return obj;
			} catch (e) {
				return null;
			}
		} else {
			return null;
		}
	},

	/**
	 * Returns the value if it's an object, `null` otherwise.
	 *
	 * @method deserialize
	 * @param {Object} json
	 * @return {Object}
	 */
	deserialize: function(json) {
		if (this.isObject(json)) {
			return json;
		} else {
			return null;
		}
	},

	/**
	 * Checks for equality using
	 * {{link-to-method 'ObjectType' 'deepCompare'}}.
	 *
	 * @method isEqual
	 * @param {Object} a
	 * @param {Object} b
	 * @return {Boolean}
	 */
	isEqual: function(a, b) {
		if (!this.isObject(a) || !this.isObject(b)) {
			return false;
		}

		return this.deepCompare(a, b);
	},

	/**
	 * Determines if the value is a plain Javascript object.
	 *
	 * @method isObject
	 * @param {Object} obj
	 * @return {Boolean}
	 */
	isObject: function(obj) {
		return !Em.isNone(obj) && Em.typeOf(obj) === 'object' && obj.constructor === Object;
	},

	/**
	 * Performs a deep comparison on the objects, iterating
	 * objects and arrays, and using `===` on primitives.
	 *
	 * @method deepCompare
	 * @param {Object} a
	 * @param {Object} b
	 * @return {Boolean}
	 */
	deepCompare: function(a, b) {
		if (this.isObject(a) && this.isObject(b)) {
			if (!new Em.Set(Em.keys(a)).isEqual(new Em.Set(Em.keys(b)))) {
				return false;
			}

			var keys = Em.keys(a);

			for (var i = 0; i < keys.length; i = i + 1) {
				if (!this.deepCompare(a[keys[i]], b[keys[i]])) {
					return false;
				}
			}

			return true;
		} else if (Em.isArray(a) && Em.isArray(b)) {
			return Em.compare(a, b) === 0;
		} else {
			return (a === b);
		}
	}
});

})();

(function() {

/**
 * @class StringType
 * @extends AttributeType
 * @constructor
 */
EG.StringType = EG.AttributeType.extend({

	/**
	 * Coerces the given value to a string, unless it's `null`,
	 * in which case it returns `null`.
	 *
	 * @method serialize
	 * @param {String} str
	 * @returns {String}
	 */
	serialize: function(str) {
		return (str === null ? null : '' + str);
	},

	/**
	 * Coerces the given value to a string, unless it's `null`,
	 * in which case it returns `null`.
	 *
	 * @method deserialize
	 * @param {String} json
	 * @returns {String}
	 */
	deserialize: function(json) {
		return (json === null ? null : '' + json);
	}
});

})();

(function() {

/**
 * Models are the classes that represent your domain data.
 * Each type of object in your domain should have its own
 * model, with attributes and relationships declared using the
 * [attr](EG.html#method_attr), [hasOne](EG.html#method_hasOne)
 * and [hasMany](EG.html#method_hasMany) functions.
 *
 * To create a model, subclass this class (or any other Model
 * subclass) and place it your app's namespace. The name
 * that you give it is important, since that's how it will be
 * looked up by the container. The usual convention is to use
 * a camel-cased name like `App.PostComment` or `App.ForumAdmin`.
 * For more information on resolving, read the Ember.js entry
 * on the [DefaultResolver](http://emberjs.com/api/classes/Ember.DefaultResolver.html).
 *
 * @class Model
 * @constructor
 * @uses Ember.Evented
 */
EG.Model = Em.Object.extend(Em.Evented, {

	/**
	 * This property is available on every model instance and every
	 * model subclass (after being looked up at least once by the
	 * container). This is the key that you use to refer to the model
	 * in relationships and store methods. Examples:
	 *
	 * ```
	 * App.User => user
	 * App.PostComment => postComment
	 * ```
	 *
	 * @property typeKey
	 * @type String
	 * @final
	 */
	typeKey: null,

	_id: null,

	/**
	 * The ID of the record. The ID can only be changed once, and only if
	 * it's being changed from a temporary ID to a permanent one. Only the
	 * store should change the ID from a temporary one to a permanent one.
	 *
	 * @property id
	 * @type String
	 * @final
	 */
	id: Em.computed(function(key, value) {
		var id = this.get('_id');

		if (arguments.length > 1) {
			var prefix = this.constructor.temporaryIdPrefix;

			if (id === null) {
				this.set('_id', value);
				return value;
			} else if (EG.String.startsWith(id, prefix) && !EG.String.startsWith(value, prefix)) {
				this.set('_id', value);
				return value;
			} else {
				throw new Error('Cannot change the \'id\' property of a model.');
			}
		}

		return id;
	}).property('_id'),

	/**
	 * @property store
	 * @type EmberGraph.Store
	 * @final
	 */
	store: null,

	/**
	 * Loads JSON data from the server into the record. This may be used when
	 * the record is brand new, or when the record is being reloaded. This
	 * should generally only be used by the store or for testing purposes.
	 * However, this can be useful to override to intercept data before it's
	 * loaded into the record;
	 *
	 * @method loadData
	 * @param {Object} json
	 */
	loadData: function(json) {
		json = json || {};
		Em.assert('The record `' + this.typeKey + ':' + this.get('id') + '` was attempted to be reloaded ' +
			'while dirty with `reloadDirty` disabled.', !this.get('isDirty') || this.get('store.reloadDirty'));

		this._loadAttributes(json);
		this._loadRelationships(json);
	},

	/**
	 * Proxies the store's save method for convenience.
	 *
	 * @method save
	 * @return Promise
	 */
	save: function() {
		var _this = this;
		var property = null;

		if (this.get('isNew')) {
			property = 'isCreating';
		} else {
			property = 'isSaving';
		}

		this.set(property, true);
		return this.get('store').saveRecord(this).finally(function() {
			_this.set(property, false);
		});
	},

	/**
	 * Proxies the store's reload method for convenience.
	 *
	 * @method reload
	 * @return Promise
	 */
	reload: function() {
		var _this = this;

		this.set('isReloading', true);
		return this.get('store').reloadRecord(this).finally(function() {
			_this.set('isReloading', false);
		});
	},

	/**
	 * Proxies the store's delete method for convenience.
	 *
	 * @method destroy
	 * @return Promise
	 */
	destroy: function() {
		var _this = this;

		this.set('isDeleting', true);
		return this.get('store').deleteRecord(this).then(function() {
			_this.set('isDeleted', true);
			_this.set('store', null);
		}).finally(function() {
			_this.set('isDeleting', false);
		});
	},

	/**
	 * Determines if the other object is a model that represents the same record.
	 *
	 * @method isEqual
	 * @return Boolean
	 */
	isEqual: function(other) {
		if (!other) {
			return;
		}

		return (this.typeKey === Em.get(other, 'typeKey') && this.get('id') === Em.get(other, 'id'));
	},

	/**
	 * Rolls back changes to both attributes and relationships.
	 *
	 * @method rollback
	 */
	rollback: function() {
		this.rollbackAttributes();
		this.rollbackRelationships();
	}
});

EG.Model.reopenClass({

	/**
	 * The prefix added to generated IDs to show that the prefix wasn't given
	 * by the server and is only temporary until the real one comes in.
	 *
	 * @property temporaryIdPrefix
	 * @type String
	 * @static
	 */
	temporaryIdPrefix: 'EG_TEMP_ID_',

	/**
	 * @method isTemporaryId
	 * @param {String} id
	 * @return Boolean
	 * @static
	 */
	isTemporaryId: function(id) {
		return EG.String.startsWith(id, this.temporaryIdPrefix);
	},

	create: function() {
		Em.assert('You can\'t create a record directly. Use the store.');
	},

	_create: EG.Model.create,

	/**
	 * @method extend
	 * @static
	 */
	extend: function() {
		var args = Array.prototype.slice.call(arguments, 0);
		var options = args.pop() || {};
		var attributes = {};
		var relationships = {};

		// Ember.Mixin doesn't have a `detectInstance` method
		if (!(options instanceof Em.Mixin)) {
			Em.keys(options).forEach(function(key) {
				var value = options[key];

				if (options[key]) {
					if (options[key].isRelationship) {
						relationships[key] = value;
						delete options[key];
					} else if (options[key].isAttribute) {
						attributes[key] = value;
						delete options[key];
					}
				}
			});
		}

		args.push(options);

		var subclass = this._super.apply(this, args);
		subclass._declareAttributes(attributes);
		subclass._declareRelationships(relationships);
		return subclass;
	},

	/**
	 * Determines if the two objects passed in are equal models (or model proxies).
	 *
	 * @param {Model} a
	 * @param {Model} b
	 * @return Boolean
	 * @static
	 */
	isEqual: function(a, b) {
		if (Em.isNone(a) || Em.isNone(b)) {
			return false;
		}

		if (this.detectInstance(a)) {
			return a.isEqual(b);
		}

		if (this.detectInstance(b)) {
			return b.isEqual(a);
		}

		if (this.detectInstance(Em.get(a, 'content'))) {
			return Em.get(a, 'content').isEqual(b);
		}

		if (this.detectInstance(Em.get(b, 'content'))) {
			return Em.get(b, 'content').isEqual(a);
		}

		return false;
	}
});



})();

(function() {

EG.Model.reopen({

	/**
	 * Denotes that the record is currently being deleted, but the server hasn't responded yet.
	 *
	 * @property isDeleting
	 * @type Boolean
	 * @final
	 */
	isDeleting: false,

	/**
	 * Denotes that a record has been deleted and the change persisted to the server.
	 *
	 * @property isDeleted
	 * @type Boolean
	 * @final
	 */
	isDeleted: false,

	/**
	 * Denotes that the record is currently saving its changes to the server, but the server hasn't responded yet.
	 * (This doesn't overlap with `isCreating` at all. This is only true on subsequent saves.)
	 *
	 * @property isSaving
	 * @type Boolean
	 * @final
	 */
	isSaving: false,

	/**
	 * Denotes that the record is being reloaded from the server, but the server hasn't responded yet.
	 *
	 * @property isReloading
	 * @type Boolean
	 * @final
	 */
	isReloading: false,

	/**
	 * Denotes that a record has been loaded into a store and isn't freestanding.
	 *
	 * @property isLoaded
	 * @type Boolean
	 * @final
	 */
	isLoaded: Em.computed(function() {
		return this.get('store') !== null;
	}).property('store'),

	/**
	 * Denotes that the record has attribute or relationship changes that have not been saved to the server yet.
	 *
	 * @property isDirty
	 * @type Boolean
	 * @final
	 */
	isDirty: Em.computed.or('_areAttributesDirty', '_areRelationshipsDirty'),

	/**
	 * Denotes that the record is currently being saved to the server for the first time,
	 * and the server hasn't responded yet.
	 *
	 * @property isCreating
	 * @type Boolean
	 * @final
	 */
	isCreating: false,

	/**
	 * Denotes that a record has just been created and has not been saved to
	 * the server yet. Most likely has a temporary ID if this is true.
	 *
	 * @property isNew
	 * @type Boolean
	 * @final
	 */
	isNew: Em.computed(function() {
		return EG.String.startsWith(this.get('_id'), this.constructor.temporaryIdPrefix);
	}).property('_id'),

	/**
	 * Denotes that the record is currently waiting for the server to respond to an operation.
	 *
	 * @property isInTransit
	 * @type Boolean
	 * @final
	 */
	isInTransit: Em.computed.or('isSaving', 'isDeleting', 'isCreating', 'isReloading')
});

})();

(function() {

var disallowedAttributeNames = new Em.Set(['id', 'type', 'content']);

var createAttribute = function(attributeName, options) {
	var meta = {
		isAttribute: true,
		type: options.type,
		isRequired: !options.hasOwnProperty('defaultValue'),
		defaultValue: options.defaultValue,
		readOnly: options.readOnly === true,

		// These should really only be used internally by the model class
		isEqual: options.isEqual
	};

	var attribute = Em.computed(function(key, value) {
		var meta = this.constructor.metaForAttribute(key);
		var server = this.get('_serverAttributes.' + key);
		var client = this.get('_clientAttributes.' + key);
		var current = (client === undefined ? server : client);

		Em.runInDebug(function() {
			if (arguments.length > 1 && value === undefined) {
				Em.warn('`undefined` is not a valid property value.');
			}
		});

		if (value !== undefined) {
			var isEqual = meta.isEqual || this.get('store').attributeTypeFor(meta.type).isEqual;
			if (isEqual(server, value)) {
				delete this.get('_clientAttributes')[key];
			} else {
				this.set('_clientAttributes.' + key, value);
			}

			// This only notifies observers of the object itself, not the properties.
			// At this point in time, that's only the `_areAttributesDirty` property.
			this.notifyPropertyChange('_clientAttributes');
			return value;
		}

		return current;
	}).property('_clientAttributes.' + attributeName, '_serverAttributes.' + attributeName).meta(meta);

	return (options.readOnly ? attribute.readOnly() : attribute);
};

EG.Model.reopenClass({

	/**
	 * Goes through the subclass and declares an additional property for each attribute.
	 */
	_declareAttributes: function(attributes) {
		var obj = {};

		Em.keys(attributes).forEach(function(attributeName) {
			obj[attributeName] = createAttribute(attributeName, attributes[attributeName].options);
		});

		this.reopen(obj);
	},

	/**
	 * A set of all of the attribute names for this model.
	 *
	 * @property attributes
	 * @for Model
	 * @type Set
	 * @static
	 * @readOnly
	 */
	attributes: Em.computed(function() {
		var attributes = new Em.Set();

		this.eachComputedProperty(function(name, meta) {
			if (meta.isAttribute) {
				Em.assert('`' + name + '` cannot be used as an attribute name.',
					!disallowedAttributeNames.contains(name));

				attributes.addObject(name);
			}
		});

		return attributes;
	}).property(),

	/**
	 * Just a more semantic alias for `metaForProperty`
	 *
	 * @method metaForAttribute
	 * @for Model
	 * @param {String} attributeName
	 * @return {Object}
	 * @static
	 */
	metaForAttribute: Em.aliasMethod('metaForProperty'),

	/**
	 * @method isAttribute
	 * @for Model
	 * @param {String} propertyName
	 * @return {Boolean}
	 * @static
	 */
	isAttribute: function(propertyName) {
		return Em.get(this, 'attributes').contains(propertyName);
	},

	/**
	 * Calls the callback for each attribute defined on the model.
	 *
	 * @method eachAttribute
	 * @for Model
	 * @param {Function} callback Function that takes `name` and `meta` parameters
	 * @param [binding] Object to use as `this`
	 * @static
	 */
	eachAttribute: function(callback, binding) {
		this.eachComputedProperty(function(name, meta) {
			if (meta.isAttribute) {
				callback.call(binding, name, meta);
			}
		});
	}
});

EG.Model.reopen({

	/**
	 * Represents the latest set of properties from the server. The only way these
	 * can be updated is if the server sends over new JSON through an operation,
	 * or a save operation successfully completes, in which case `_clientAttributes`
	 * will be copied into this.
	 */
	_serverAttributes: null,

	/**
	 * Represents the state of the object on the client. These are likely different
	 * from what the server has and are completely temporary until saved.
	 */
	_clientAttributes: null,

	_initializeAttributes: function() {
		this.set('_serverAttributes', Em.Object.create());
		this.set('_clientAttributes', Em.Object.create());
	}.on('init'),

	/**
	 * Watches the client side attributes for changes and detects if there are
	 * any dirty attributes based on how many client attributes differ from
	 * the server attributes.
	 */
	_areAttributesDirty: Em.computed(function() {
		return Em.keys(this.get('_clientAttributes') || {}).length > 0;
	}).property('_clientAttributes'),

	/**
	 * Returns an object that contains every attribute
	 * that has been changed since the last save.
	 *
	 * @method changedAttributes
	 * @for Model
	 * @return {Object} Keys are attribute names, values are arrays with [oldVal, newVal]
	 */
	changedAttributes: function() {
		var diff = {};
		var store = this.get('store');

		this.constructor.eachAttribute(function(name, meta) {
			var server = this.get('_serverAttributes.' + name);
			var client = this.get('_clientAttributes.' + name);

			var type = store.attributeTypeFor(meta.type);
			var isEqual = meta.isEqual || type.isEqual;

			if (client === undefined || isEqual(server, client)) {
				return;
			}

			diff[name] = [server, client];
		}, this);

		return diff;
	},

	/**
	 * Resets all attribute changes to last known server attributes.
	 *
	 * @method rollbackAttributes
	 * @for Model
	 */
	rollbackAttributes: function() {
		this.set('_clientAttributes', Em.Object.create());
	},

	/**
	 * Loads attributes from the server.
	 */
	_loadAttributes: function(json) {
		this.constructor.eachAttribute(function(attributeName, meta) {
			Em.assert('Your JSON is missing the \'' + attributeName + '\' property.',
				!meta.isRequired || json.hasOwnProperty(attributeName));

			var value = (json.hasOwnProperty(attributeName) ? json[attributeName] : meta.defaultValue);

			this.set('_serverAttributes.' + attributeName, value);
			this._synchronizeAttribute(attributeName);
		}, this);
	},

	/**
	 * When an attribute's value is set directly (like in `extractPayload`), this
	 * will synchronize the server and client attributes and fix the dirty state.
	 */
	_synchronizeAttribute: function(name) {
		var server = this.get('_serverAttributes.' + name);
		var client = this.get('_clientAttributes.' + name);

		var meta = this.constructor.metaForAttribute(name);
		var isEqual = meta.isEqual || this.get('store').attributeTypeFor(meta.type).isEqual;
		if (isEqual(server, client)) {
			delete this.get('_clientAttributes')[name];
			this.notifyPropertyChange('_clientAttributes');
		}
	}
});

})();

(function() {

var HAS_ONE_KEY = EG.Model.HAS_ONE_KEY = 'hasOne';
var HAS_MANY_KEY = EG.Model.HAS_MANY_KEY = 'hasMany';

var NEW_STATE = EG.Relationship.NEW_STATE;
var SAVED_STATE = EG.Relationship.SAVED_STATE;
var DELETED_STATE = EG.Relationship.DELETED_STATE;

var disallowedRelationshipNames = new Em.Set(['id', 'type', 'content']);

var createRelationship = function(name, kind, options) {
	Em.assert('Your relationship must specify a relatedType.', Em.typeOf(options.relatedType) === 'string');
	Em.assert('Your relationship must specify an inverse relationship.',
		options.inverse === null || Em.typeOf(options.inverse) === 'string');

	var meta = {
		isRelationship: false,
		kind: kind,
		isRequired: (options.hasOwnProperty('defaultValue') ? false : options.isRequired !== false),
		defaultValue: options.defaultValue || (kind === HAS_MANY_KEY ? [] : null),
		relatedType: options.relatedType,
		inverse: options.inverse,
		readOnly: options.readOnly === true
	};

	Em.assert('The default value for a hasOne relationship must be a string or null, and the default value' +
			'for a hasMany relationship must be an array.',
			(kind === HAS_MANY_KEY && Em.isArray(meta.defaultValue)) ||
			(kind === HAS_ONE_KEY && (meta.defaultValue === null || Em.typeOf(meta.defaultValue) === 'string')));

	if (kind === HAS_MANY_KEY) {
		return Em.computed(function(key) {
			return this._hasManyValue(key.substring(1));
		}).property('_serverRelationships.' + name, '_clientRelationships.' + name).meta(meta).readOnly();
	} else {
		return Em.computed(function(key) {
			return this._hasOneValue(key.substring(1));
		}).property('_serverRelationships.' + name, '_clientRelationships.' + name).meta(meta).readOnly();
	}
};

EG.Model.reopenClass({

	/**
	 * Goes through the subclass and declares an additional property for
	 * each relationship. The properties will be capitalized and then prefixed
	 * with 'loaded'. So rather than 'projects', use 'loadedProjects'.
	 * This will return the relationship as a promise rather than in ID form.
	 */
	_declareRelationships: function(relationships) {
		var obj = {};

		Em.keys(relationships).forEach(function(name) {
			var kind = relationships[name].kind;
			var options = relationships[name].options;
			var relatedType = options.relatedType;

			var relationship;

			if (kind === HAS_MANY_KEY) {
				relationship = function() {
					return this.get('store').find(relatedType, this.get('_' + name).toArray());
				};
			} else {
				relationship = function() {
					var id = this.get('_' + name);
					return (id === null ? null : this.get('store').find(relatedType, id));
				};
			}

			obj['_' + name] = createRelationship(name, kind, options);
			var meta = Em.copy(obj['_' + name].meta(), true);
			meta.isRelationship = true;
			obj[name] = Em.computed(relationship).property('_' + name).meta(meta).readOnly();
		});

		this.reopen(obj);
	},

	/**
	 * A set of all of the relationship names for this model.
	 *
	 * @property relationships
	 * @for Model
	 * @type Set
	 * @static
	 * @readOnly
	 */
	relationships: Em.computed(function() {
		var relationships = new Em.Set();

		this.eachComputedProperty(function(name, meta) {
			if (meta.isRelationship) {
				Em.assert('`' + name + '` cannot be used as a relationship name.',
					!disallowedRelationshipNames.contains(name));
				Em.assert('Relationship names must start with a lowercase letter.', name[0].match(/[a-z]/g));

				relationships.addObject(name);
			}
		});

		return relationships;
	}).property(),

	/**
	 * @method isRelationship
	 * @for Model
	 * @param {String} propertyName
	 * @return {Boolean}
	 * @static
	 */
	isRelationship: function(propertyName) {
		return Em.get(this, 'relationships').contains(propertyName);
	},

	/**
	 * Just a more semantic alias for `metaForProperty`
	 *
	 * @method metaForRelationship
	 * @for Model
	 * @param {String} relationshipName
	 * @return {Object}
	 * @static
	 */
	metaForRelationship: Em.aliasMethod('metaForProperty'),

	/**
	 * Determines the kind (multiplicity) of the given relationship.
	 *
	 * @method relationshipKind
	 * @for Model
	 * @param {String} name
	 * @returns {String} `hasMany` or `hasOne`
	 * @static
	 */
	relationshipKind: function(name) {
		return this.metaForRelationship(name).kind;
	},

	/**
	 * Calls the callback for each relationship defined on the model.
	 *
	 * @method eachRelationship
	 * @for Model
	 * @param {Function} callback Function that takes `name` and `meta` parameters
	 * @param [binding] Object to use as `this`
	 * @static
	 */
	eachRelationship: function(callback, binding) {
		this.eachComputedProperty(function(name, meta) {
			if (meta.isRelationship) {
				callback.call(binding, name, meta);
			}
		});
	}
});

EG.Model.reopen({

	/**
	 * Relationships that have been saved to the server
	 * that are currently connected to this record.
	 *
	 * @type {Object.<String, Relationship>}
	 */
	_serverRelationships: null,

	/**
	 * Relationships that have been saved to the server, but aren't currently
	 * connected to this record and are scheduled for deletion on the next save.
	 *
	 * @type {Object.<String, Relationship>}
	 */
	_deletedRelationships: null,

	/**
	 * Relationships that have been created on the client and haven't been
	 * saved to the server yet. Relationships from here that are disconnected
	 * are deleted completely rather than queued for deletion.
	 *
	 * @type {Object.<String, Relationship>}
	 */
	_clientRelationships: null,

	_initializeRelationships: function() {
		this.set('_serverRelationships', Em.Object.create());
		this.set('_clientRelationships', Em.Object.create());
		this.set('_deletedRelationships', Em.Object.create());
	}.on('init'),

	/**
	 * Determines the value of a hasOne relationship, either the
	 * original value sent from the server, or the current client value.
	 *
	 * @param {String} relationship
	 * @param {Boolean} server True for original value, false for client value
	 * @returns {String}
	 * @private
	 */
	_hasOneValue: function(relationship, server) {
		var id;

		var serverRelationships = this.get('_serverRelationships');
		for (id in serverRelationships) {
			if (serverRelationships.hasOwnProperty(id)) {
				if (serverRelationships[id].relationshipName(this) === relationship) {
					return serverRelationships[id].otherId(this);
				}
			}
		}

		var otherRelationships = this.get((server ? '_deleted' : '_client') + 'Relationships');
		for (id in otherRelationships) {
			if (otherRelationships.hasOwnProperty(id)) {
				if (otherRelationships[id].relationshipName(this) === relationship) {
					return otherRelationships[id].otherId(this);
				}
			}
		}

		return null;
	},

	/**
	 * Determines the value of a hasMany relationship, either the
	 * original value sent from the server, or the current client value.
	 *
	 * @param {String} relationship
	 * @param {Boolean} server True for original value, false for client value
	 * @returns {Set}
	 * @private
	 */
	_hasManyValue: function(relationship, server) {
		var id;
		var found = [];

		var serverRelationships = this.get('_serverRelationships');
		for (id in serverRelationships) {
			if (serverRelationships.hasOwnProperty(id)) {
				if (serverRelationships[id].relationshipName(this) === relationship) {
					found.push(serverRelationships[id].otherId(this));
				}
			}
		}

		var otherRelationships = this.get((server ? '_deleted' : '_client') + 'Relationships');
		for (id in otherRelationships) {
			if (otherRelationships.hasOwnProperty(id)) {
				if (otherRelationships[id].relationshipName(this) === relationship) {
					found.push(otherRelationships[id].otherId(this));
				}
			}
		}

		return new Em.Set(found);
	},

	/**
	 * Watches the client side attributes for changes and detects if there are
	 * any dirty attributes based on how many client attributes differ from
	 * the server attributes.
	 */
	_areRelationshipsDirty: Em.computed(function() {
		var client = Em.keys(this.get('_clientRelationships')).length > 0;
		var deleted = Em.keys(this.get('_deletedRelationships')).length > 0;

		return client || deleted;
	}).property('_clientRelationships', '_deletedRelationships'),

	/**
	 * Gets all relationships currently linked to this record.
	 *
	 * @returns {Relationship[]}
	 * @private
	 */
	_getAllRelationships: function() {
		var id;
		var all = [];

		var serverRelationships = this.get('_serverRelationships');
		for (id in serverRelationships) {
			if (serverRelationships.hasOwnProperty(id)) {
				all.push(serverRelationships[id]);
			}
		}

		var clientRelationships = this.get('_clientRelationships');
		for (id in clientRelationships) {
			if (clientRelationships.hasOwnProperty(id)) {
				all.push(clientRelationships[id]);
			}
		}

		var deletedRelationships = this.get('_deletedRelationships');
		for (id in deletedRelationships) {
			if (deletedRelationships.hasOwnProperty(id)) {
				all.push(deletedRelationships[id]);
			}
		}

		return all;
	},

	/**
	 * Loads relationships from the server. Completely replaces
	 * the current relationships with the given ones.
	 *
	 * TODO: Clean this shit up yo...
	 *
	 * @param json The JSON with properties to load
	 * @private
	 */
	_loadRelationships: function(json) {
		var store = this.get('store');
		var sideWithClient = store.get('sideWithClientOnConflict');

		this.constructor.eachRelationship(function(name, meta) {
			if (meta.isRequired && !json.hasOwnProperty(name)) {
				throw new Error('You left out the required \'' + name + '\' relationship.');
			}

			var value = json[name] || meta.defaultValue;

			if (meta.kind === HAS_MANY_KEY) {
				value = value.map(function(id) {
					if (Em.typeOf(id) === 'string') {
						return id;
					} else if (EG.Model.detectInstance(id)) {
						return id.get('id');
					} else {
						throw new Error('When creating records, relationships must be either records or IDs.');
					}
				});
			} else {
				if (EG.Model.detectInstance(value)) {
					value = value.get('id');
				} else if (Em.typeOf(value) !== 'string' && value !== null) {
					throw new Error('When creating records, relationships must be either records or IDs.');
				}
			}

			// Delete ALL server relationships with this name
			var client = this._relationshipsForName(name).filter(function(relationship) {
				// If a DELETED relationship is the same as one given by the server
				// it's considered a conflict and has to be dealt with accordingly
				var state = relationship.get('state');
				if (state === DELETED_STATE) {
					var otherId = relationship.otherId(this);

					if (meta.kind === HAS_MANY_KEY) {
						if (new Em.Set(value).contains(otherId)) {
							if (sideWithClient) {
								// Leave it alone
							} else {
								store._changeRelationshipState(relationship.get('id'), SAVED_STATE);
							}
						}
					} else {
						if (value === otherId) {
							if (sideWithClient) {
								// Leave it alone
							} else {
								store._changeRelationshipState(relationship.get('id'), SAVED_STATE);
							}
						}
					}

					return false;
				}

				if (state === SAVED_STATE) {
					store._deleteRelationship(relationship.get('id'));
					return false;
				} else {
					return true;
				}
			}, this);

			if (meta.kind === HAS_MANY_KEY) {
				var given = new Em.Set(value);

				// Update client side relationships that have been saved
				client.forEach(function(relationship) {
					if (given.contains(relationship.otherId(this))) {
						store._changeRelationshipState(relationship.get('id'), SAVED_STATE);
					}
				}, this);

				var current = this._hasManyValue(name);
				// These are OK for now, because they're not in conflict
				var clientNotOnServer = current.without(given);
				// These have to be created
				var serverNotInClient = given.without(current);
				serverNotInClient.forEach(function(id) {
					var addState = SAVED_STATE;
					var conflict = this._hasOneConflict(name, id);
					if (conflict !== null) {
						switch (conflict.get('state')) {
							case DELETED_STATE:
							case SAVED_STATE:
								// Delete it because the server says that relationship no longer exists.
								// It is now occupied by another relationship
								store._deleteRelationship(conflict.get('id'));
								break;
							case NEW_STATE:
								if (sideWithClient) {
									// We have to side with the client, so leave it alone, add ours as deleted
									addState = DELETED_STATE;
								} else {
									// We have to side with the server, so delete it
									store._deleteRelationship(conflict.get('id'));
								}
								break;
						}
					}

					store._createRelationship(this.typeKey, name, this.get('id'),
						meta.relatedType, meta.inverse, id, addState);
				}, this);
			} else {
				// There should only be one relationship in there
				Em.assert('An unknown relationship error occurred.', client.length <= 1);

				var conflict = this._hasOneConflict(name, value);

				// Update client side relationships that have been saved
				if (client.length === 1) {
					if (client[0].otherId(this) === value) {
						store._changeRelationshipState(client[0].get('id'), SAVED_STATE);
					} else {
						// The server is in conflict with the client
						if (sideWithClient) {
							if (value !== null) {
								if (conflict !== null) { // jshint ignore:line
									switch (conflict.get('state')) {
										case DELETED_STATE:
										case SAVED_STATE:
											// Delete it because the server says that relationship no longer exists.
											// It is now occupied by another relationship
											store._deleteRelationship(conflict.get('id'));
											break;
										case NEW_STATE:
											// We have to side with the client, so leave it alone
											break;
									}
								}

								// Add the server relationship as deleted
								store._createRelationship(this.typeKey, name, this.get('id'),
									meta.relatedType, meta.inverse, value, DELETED_STATE);
							}
						} else {
							// Delete the client side relationship
							store._deleteRelationship(client[0].get('id'));
							if (value !== null) {
								if (conflict !== null) { // jshint ignore:line
									// Delete it because the server says that relationship no longer exists.
									// It is now occupied by another relationship
									store._deleteRelationship(conflict.get('id'));
								}

								store._createRelationship(this.typeKey, name, this.get('id'),
									meta.relatedType, meta.inverse, value, SAVED_STATE);
							}
						}
					}
				} else if (client.length === 0) {
					// We can simply create the server relationship
					if (value !== null) {
						if (conflict !== null) { // jshint ignore:line
							// Delete it because the server says that relationship no longer exists.
							// It is now occupied by another relationship
							store._deleteRelationship(conflict.get('id'));
						}

						store._createRelationship(this.typeKey, name, this.get('id'),
							meta.relatedType, meta.inverse, value, SAVED_STATE);
					}
				} else {
					// TODO: This should really never happen in production.
					// What should we do? Can we guarantee this never happens?
				}
			}
		}, this);
	},

	/**
	 * This method is used to determine if adding a relationship will create
	 * a conflict on the other side of the relationship with a hasOne
	 * relationship. If there is a conflict on the other record, this will
	 * return the relationship that is in conflict.
	 *
	 * @param {String} relationship Relationship on this side that goes to the other record
	 * @param {String} id ID of the other record
	 * @returns {Relationship}
	 * @private
	 */
	_hasOneConflict: function(relationship, id) {
		if (id === null) {
			return null;
		}

		var meta = this.constructor.metaForRelationship(relationship);
		if (meta.inverse === null) {
			return null;
		}

		var model = this.get('store').modelForType(meta.relatedType);
		var otherMeta = model.metaForRelationship(meta.inverse);
		if (otherMeta.kind !== HAS_ONE_KEY) {
			return null;
		}

		// We need to detect unloaded records too
		var record = this.get('store').getRecord(meta.relatedType, id);
		if (record) {
			var current = record._hasOneValue(meta.inverse);
			if (current === null || current === this.get('id')) {
				return null;
			}

			return record._findLinkTo(meta.inverse, current);
		} else {
			var relationships = this.get('store')._relationshipsForRecord(meta.relatedType, meta.inverse, id);
			if (relationships.length === 0) {
				return null;
			}

			// It's a hasOne, so relationships can only have one NEW or SAVED relationship
			relationships = relationships.filter(function(relationship) {
				var state = relationship.get('state');
				return (state === SAVED_STATE || state === NEW_STATE);
			});

			Em.assert('An unknown relationship error occurred', relationships.length <= 1);

			return (relationships.length > 0 ? relationships[0] : null);
		}
	},

	/**
	 * Returns an object that contains every relationship
	 * that has been changed since the last save.
	 *
	 * @method changedRelationships
	 * @for Model
	 * @return {Object} Keys are relationship names, values are arrays with [oldVal, newVal]
	 */
	changedRelationships: function() {
		var changed = {};

		this.constructor.eachRelationship(function(name, meta) {
			var oldVal, newVal;

			if (meta.kind === HAS_MANY_KEY) {
				oldVal = this._hasManyValue(name, true);
				newVal = this._hasManyValue(name, false);

				if (!oldVal.isEqual(newVal)) {
					changed[name] = [oldVal, newVal];
				}
			} else {
				oldVal = this._hasOneValue(name, true);
				newVal = this._hasOneValue(name, false);

				if (oldVal !== newVal) {
					changed[name] = [oldVal, newVal];
				}
			}
		}, this);

		return changed;
	},

	/**
	 * Resets all attribute changes to last known server attributes.
	 *
	 * @method rollbackRelationships
	 * @for Model
	 */
	rollbackRelationships: function() {
		var store = this.get('store');

		this._getAllRelationships().forEach(function(relationship) {
			switch (relationship.get('state')) {
				case NEW_STATE:
					store._deleteRelationship(relationship.get('id'));
					break;
				case SAVED_STATE:
					// NOP
					break;
				case DELETED_STATE:
					store._changeRelationshipState(relationship.get('id'), SAVED_STATE);
					break;
			}
		}, this);
	},

	/**
	 * A convenience method to add an item to a hasMany relationship. This will
	 * ensure that all of the proper observers are notified of the change.
	 *
	 * @method addToRelationship
	 * @for Model
	 * @param {String} relationshipName
	 * @param {String|Record} id
	 */
	addToRelationship: function(relationshipName, id) {
		if (EG.Model.detectInstance(id)) {
			id = id.get('id');
		}

		var store = this.get('store');
		var meta = this.constructor.metaForRelationship(relationshipName);
		Em.assert('Cannot modify a read-only relationship', meta.readOnly === false);
		if (meta.readOnly) {
			return;
		}

		var link = this._findLinkTo(relationshipName, id);
		if (link && (link.get('state') === NEW_STATE || link.get('state') === SAVED_STATE)) {
			return;
		}

		if (link && link.get('state') === DELETED_STATE) {
			this.get('store')._changeRelationshipState(link.get('id'), SAVED_STATE);
			return;
		}

		var conflict = this._hasOneConflict(relationshipName, id);
		if (conflict !== null) {
			switch (conflict.get('state')) {
				case DELETED_STATE:
					// NOP
					break;
				case SAVED_STATE:
					store._changeRelationshipState(conflict.get('id'), DELETED_STATE);
					break;
				case NEW_STATE:
					store._deleteRelationship(conflict.get('id'));
					break;
			}
		}

		store._createRelationship(this.typeKey, relationshipName,
			this.get('id'), meta.relatedType, meta.inverse, id, NEW_STATE);
	},

	/**
	 * A convenience method to remove an item from a hasMany relationship. This will
	 * ensure that all of the proper observers are notified of the change.
	 *
	 * @method removeFromRelationship
	 * @for Model
	 * @param {String} relationshipName
	 * @param {String|Record} id
	 */
	removeFromRelationship: function(relationshipName, id) {
		if (EG.Model.detectInstance(id)) {
			id = id.get('id');
		}

		var meta = this.constructor.metaForRelationship(relationshipName);
		Em.assert('Cannot modify a read-only relationship', meta.readOnly === false);
		if (meta.readOnly) {
			return;
		}

		var r = this._findLinkTo(relationshipName, id);

		if (r !== null) {
			switch (r.get('state')) {
				case NEW_STATE:
					this.get('store')._deleteRelationship(r.get('id'));
					break;
				case SAVED_STATE:
					this.get('store')._changeRelationshipState(r.get('id'), DELETED_STATE);
					break;
				case DELETED_STATE:
					// NOP?
					break;
			}
		}
	},

	/**
	 * Sets the value of a hasOne relationship to the given ID.
	 *
	 * @method setHasOneRelationship
	 * @for Model
	 * @param {String} relationshipName
	 * @param {String|Record} id
	 */
	setHasOneRelationship: function(relationshipName, id) {
		if (EG.Model.detectInstance(id)) {
			id = id.get('id');
		}

		var meta = this.constructor.metaForRelationship(relationshipName);
		Em.assert('Cannot modify a read-only relationship', meta.readOnly === false);
		if (meta.readOnly) {
			return;
		}

		var link = this._findLinkTo(relationshipName, id);
		if (link && (link.get('state') === NEW_STATE || link.get('state') === SAVED_STATE)) {
			return;
		}

		if (link && link.get('state') === DELETED_STATE) {
			this.get('store')._changeRelationshipState(link.get('id'), SAVED_STATE);
			return;
		}

		if (id === null) {
			return;
		}

		if (id === null) {
			this.clearHasOneRelationship(relationshipName);
			return;
		}

		this.clearHasOneRelationship(relationshipName, true);

		var store = this.get('store');
		var conflict = this._hasOneConflict(relationshipName, id);
		if (conflict !== null) {
			switch (conflict.get('state')) {
				case DELETED_STATE:
					// NOP
					break;
				case SAVED_STATE:
					store._changeRelationshipState(conflict.get('id'), DELETED_STATE);
					break;
				case NEW_STATE:
					store._deleteRelationship(conflict.get('id'));
					break;
			}
		}

		store._createRelationship(this.typeKey, relationshipName,
			this.get('id'), meta.relatedType, meta.inverse, id, NEW_STATE);
	},

	/**
	 * Sets the value of a hasOne relationship to `null`.
	 *
	 * @method clearHasOneRelationship
	 * @for Model
	 * @param {String} relationshipName
	 */
	clearHasOneRelationship: function(relationshipName) {
		var meta = this.constructor.metaForRelationship(relationshipName);
		Em.assert('Cannot modify a read-only relationship', meta.readOnly === false);
		if (meta.readOnly) {
			return;
		}

		var current = this._hasOneValue(relationshipName);

		if (current !== null) {
			var r = this._findLinkTo(relationshipName, current);

			if (r !== null) {
				switch (r.get('state')) {
					case NEW_STATE:
						this.get('store')._deleteRelationship(r.get('id'));
						break;
					case SAVED_STATE:
						this.get('store')._changeRelationshipState(r.get('id'), DELETED_STATE);
						break;
					case DELETED_STATE:
						// NOP?
						break;
				}
			}
		}
	},

	/**
	 * If this record is linked to the given record via the given ID, this returns
	 * the relationship that links the two. If they aren't linked, it returns null.
	 *
	 * @param {String} relationship
	 * @param {String} id
	 * @returns {Relationship}
	 * @private
	 */
	_findLinkTo: function(relationship, id) {
		var relationships = this._getAllRelationships();
		for (var i = 0; i < relationships.length; i = i + 1) {
			if (relationships[i].relationshipName(this) === relationship && relationships[i].otherId(this) === id) {
				return relationships[i];
			}
		}

		return null;
	},

	/**
	 * Determines if this record is linked to the given ID via the given relationship.
	 * This will search all relationships: saved, deleted and new
	 *
	 * @param {String} relationship
	 * @param {String} id
	 * @returns {Boolean}
	 */
	_isLinkedTo: function(relationship, id) {
		return this._findLinkTo(relationship, id) !== null;
	},

	/**
	 * Given a relationship name, returns all current relationships associated with that name.
	 *
	 * @param {String} relationship
	 * @returns {Relationship[]}
	 * @private
	 */
	_relationshipsForName: function(relationship) {
		var current = this._getAllRelationships();

		return current.filter(function(r) {
			return (r.relationshipName(this) === relationship);
		}, this);
	},

	/**
	 * Connects the given relationship blindly. Will not check to see if the
	 * relationship is already connected, that should have done beforehand.
	 * Relies on the relationship state to find the relationship.
	 *
	 * @param {Relationship} relationship
	 * @returns {Object} The objects to alert of changes, along with the corresponding property
	 */
	_connectRelationship: function(relationship) {
		var hash = EG.Relationship.stateToHash(relationship.get('state'));
		this.set(hash + '.' + relationship.get('id'), relationship);
		this.notifyPropertyChange(hash);
	},

	/**
	 * Disconnects the relationship from this record.
	 * Relies on the relationship state to find the relationship.
	 *
	 * @param {Relationship} relationship
	 * @returns {Object} The object to alert of changes, along with the corresponding property
	 */
	_disconnectRelationship: function(relationship) {
		var hash = EG.Relationship.stateToHash(relationship.get('state'));
		delete this.get(hash)[relationship.get('id')];
		this.notifyPropertyChange(hash);
	}
});

})();

(function() {

/**
 * Declares an attribute on a model. The options determine the type and behavior
 * of the attributes. Bold options are required:
 *
 * - **`type`**: The type of the attribute. `string`, `boolean`, `number`, `date`, `array`
 * and `object` are the built in types. New types can be declared by extending `AttributeType`.
 * - `defaultValue`: The value that gets used if the attribute is missing from the loaded data.
 * If omitted, the attribute is required and will error if missing.
 * - `readOnly`: Set to `true` to make the attribute read-only. Defaults to `false`.
 * - `isEqual`: Function that will compare two different instances of the attribute. Should take
 * two arguments and return `true` if the given attributes are equal. Defaults to the function
 * declared in the `AttributeType` subclass.
 *
 * The option values are all available as property metadata, as well the `isAttribute` property
 * which is always `true`, and the `isRequired` property.
 *
 * Like other Ember properties, `undefined` is _not_ a valid attribute value.
 *
 * @method attr
 * @for EG
 * @category top-level
 * @param {Object} options
 * @return {Ember.ComputedProperty}
 */
EG.attr = function(options) {
	return {
		isAttribute: true,
		options: options
	};
};

/**
 * Declares a *-to-many relationship on a model. The options determine
 * the type and behavior of the relationship. Bold options are required:
 *
 * - **`relatedType`**: The type of the related models.
 * - **`inverse`**: The relationship on the related models that reciprocates this relationship.
 * - `isRequired`: `true` if the relationship can be left out of the JSON. Defaults to `false`.
 * - `defaultValue`: The value that gets used if the relationship is missing from the loaded data.
 * The default is an empty array.
 * - `readOnly`: Set to `true` to make the relationship read-only. Defaults to `false`.
 *
 * The option values are all available as property metadata, as well the `isRelationship` property
 * which is always `true`, and the `kind` property which is always `hasMany`.
 *
 * @method hasMany
 * @for EG
 * @category top-level
 * @param {Object} options
 * @return {Ember.ComputedProperty}
 */
EG.hasMany = function(options) {
	return {
		isRelationship: true,
		kind: EG.Model.HAS_MANY_KEY,
		options: options
	};
};

/**
 * Declares a *-to-one relationship on a model. The options determine
 * the type and behavior of the relationship. Bold options are required:
 *
 * - **`relatedType`**: The type of the related models.
 * - **`inverse`**: The relationship on the related model that reciprocates this relationship.
 * - `isRequired`: `true` if the relationship can be left out of the JSON. Defaults to `false`.
 * - `defaultValue`: The value that gets used if the relationship is missing from the loaded data.
 * The default is `null`.
 * - `readOnly`: Set to `true` to make the relationship read-only. Defaults to `false`.
 *
 * The option values are all available as property metadata, as well the `isRelationship` property
 * which is always `true`, and the `kind` property which is always `hasOne`.
 *
 * @method hasOne
 * @for EG
 * @category top-level
 * @param {Object} options
 * @return {Ember.ComputedProperty}
 */
EG.hasOne = function(options) {
	return {
		isRelationship: true,
		kind: EG.Model.HAS_ONE_KEY,
		options: options
	};
};


})();