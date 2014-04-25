(function() {

/**
 * @module ember-graph
 * @main ember-graph
 */
window.EmberGraph = window.EG = Em.Namespace.create({
	/**
	 * Neuter will take care of inserting the version number from bower.json
	 *
	 * @property VERSION
	 * @for EG
	 * @category top-level
	 * @type String
	 * @static
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

EG.util = {
	generateGUID: function() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random()*16|0; // jshint ignore:line
			var v = (c == 'x' ? r : (r&0x3|0x8)); // jshint ignore:line
			return v.toString(16);
		});
	},

	/**
	 * @deprecated
	 */
	values: function(obj) {
		return Em.keys(obj).map(function(key) {
			return obj[key];
		});
	}
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

/*
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

EG.debug = function(fn) {
	fn();
};

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
 * @class {Serializer}
 */
EG.Serializer = Em.Object.extend({

	/**
	 * The store that the records will be loaded into.
	 * This can be used for fetching models and their metadata.
	 */
	store: null,

	/**
	 * Converts a record to JSON for sending over the wire.
	 *
	 * Current options:
	 * includeId: true to include the ID in the JSON, should default to false
	 *
	 * @param {Model} record The record to serialize
	 * @param {Object} options Any options that were passed by the adapter
	 * @returns {Object} JSON representation of record
	 */
	serialize: function(record, options) {
		throw methodMissing('serialize');
	},

	/**
	 * Converts a payload from the server into one or more records to
	 * be loaded into the store. The method should use the options
	 * object to obtain any information it needs to correctly form
	 * the records. This method should return an enumerable of records
	 * no matter how many records the server sent back.
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
		throw methodMissing('deserialize');
	}
});


})();

(function() {

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

})();

(function() {

var missingMethod = function(method) {
	return new Error('Your adapter failed to implement the \'' + method + '\' method.');
};

/**
 * An interface for an adapter. And adapter is used to communicated with
 * the server. The adapter is never called directly, its methods are
 * called by the store to perform its operations.
 *
 * The adapter should return normalized JSON from its operations. Normalized JSON
 * is a single object whose keys are the type names of the records being returned.
 * The JSON may also contain a `meta` key. The value of each key will be the
 * records of that type that were returned by the server. The records must be
 * in normalized JSON form which means that they must contain an `id` field,
 * and they must contain the required attributes and relationships to
 * create a record of that type.
 *
 * Example:
 * {
 *     meta: {},
 *     user: [{ id: 3, posts: [1,2] }],
 *     post: [{ id: 1 }, { id: 2 }]
 * }
 *
 * @class {Adapter}
 */
EG.Adapter = Em.Object.extend({

	/**
	 * The application's container.
	 */
	container: null,

	/**
	 * The store that this adapter belongs to.
	 * This might be needed to get models and their metadata.
	 */
	store: null,

	/**
	 * The serializer to use if an application serializer is not found.
	 */
	defaultSerializer: 'json',

	/**
	 * This class will proxy to the serializer for the serialize methods of this class.
	 */
	serializer: Em.computed(function() {
		var container = this.get('container');
		var serializer = container.lookup('serializer:application') ||
			container.lookup('serializer:' + this.get('defaultSerializer'));

		

		return serializer;
	}).property().readOnly(),

	/**
	 * Persists a record to the server. This method returns normalized JSON
	 * as the other methods do, but the normalized JSON must contain one
	 * extra field. It must contain an `id` field that represents the
	 * permanent ID of the record that was created. This helps distinguish
	 * it from any other records of that same type that may have been
	 * returned from the server.
	 *
	 * @param {Model} record The record to persist
	 * @returns {Promise} A promise that resolves to normalized JSON
	 */
	createRecord: function(record) {
		throw missingMethod('createRecord');
	},

	/**
	 * Fetch a record from the server.
	 *
	 * @param {String|} typeKey
	 * @param {String} id The ID of the record to fetch
	 * @returns {Promise} A promise that resolves to normalized JSON
	 */
	findRecord: function(typeKey, id) {
		throw missingMethod('findRecord');
	},

	/**
	 * The same as find, only it should load several records. The
	 * promise can return any type of enumerable containing the records.
	 *
	 * @param {String} typeKey
	 * @param {String[]} ids Enumerable of IDs
	 * @returns {Promise} A promise that resolves to normalized JSON
	 */
	findMany: function(typeKey, ids) {
		throw missingMethod('findMany');
	},

	/**
	 * The same as find, only it should load all records of the given type.
	 * The promise can return any type of enumerable containing the records.
	 *
	 * @param {String} typeKey
	 * @returns {Promise} A promise that resolves to normalized JSON
	 */
	findAll: function(typeKey) {
		throw missingMethod('findAll');
	},

	/**
	 * This method returns normalized JSON as the other methods do, but
	 * the normalized JSON must contain one extra field. It must contain
	 * an `ids` field that represents the IDs of the records that matched
	 * the query. This helps distinguish them from any other records of
	 * that same type that may have been returned from the server.
	 *
	 * @param {String} typeKey
	 * @param {Object} query The query parameters that were passed into `find` earlier
	 * @returns {Promise} A promise that resolves to normalized JSON
	 */
	findQuery: function(typeKey, query) {
		throw missingMethod('findQuery');
	},

	/**
	 * Update the given record.
	 *
	 * @param {Model} record The model to save
	 * @returns {Promise} A promise that resolves to normalized JSON
	 */
	updateRecord: function(record) {
		throw missingMethod('updateRecord');
	},

	/**
	 * Update the given record.
	 *
	 * @param {Model} record The model to save
	 * @returns {Promise} A promise that resolves to normalized JSON
	 */
	deleteRecord: function(record) {
		throw missingMethod('deleteRecord');
	},

	/**
	 * Proxies to the serializer of this class.
	 */
	serialize: function(record, options) {
		return this.get('serializer').serialize(record, options);
	},

	/**
	 * Proxies to the serializer of this class.
	 */
	deserialize: function(payload, options) {
		return this.get('serializer').deserialize(payload, options);
	}
});


})();

(function() {

var removeEmpty = function(item) {
	return !Em.isEmpty(item);
};

/**
 * @class SynchronousAdapter
 */
EG.SynchronousAdapter = EG.Adapter.extend({
	/**
	 * @param {String} typeKey
	 * @param {String} id
	 * @return {Object} Serialized JSON Object
	 * @protected
	 */
	_getRecord: Em.required(),

	/**
	 * @param {String} typeKey
	 * @returns {Object[]} Serialized JSON Objects
	 * @protected
	 */
	_getRecords: Em.required(),

	/**
	 * @param {Model} record
	 * @protected
	 */
	_setRecord: Em.required(),

	/**
	 * @param {String} typeKey
	 * @param {String} id
	 * @protected
	 */
	_deleteRecord: Em.required(),

	/**
	 * Persists a record to the server. This method returns normalized JSON
	 * as the other methods do, but the normalized JSON must contain one
	 * extra field. It must contain an `id` field that represents the
	 * permanent ID of the record that was created. This helps distinguish
	 * it from any other records of that same type that may have been
	 * returned from the server.
	 *
	 * @param {Model} record The record to persist
	 * @returns {Promise} A promise that resolves to normalized JSON
	 */
	createRecord: function(record) {
		record.set('id', EG.util.generateGUID());
		this._setRecord(record);
		// TODO: Must return a payload
		return Em.RSVP.Promise.resolve({});
	},

	/**
	 * Fetch a record from the server.
	 *
	 * @param {String|} typeKey
	 * @param {String} id The ID of the record to fetch
	 * @returns {Promise} A promise that resolves to normalized JSON
	 */
	findRecord: function(typeKey, id) {
		var json = {};
		json[EG.String.pluralize(typeKey)] = [this._getRecord(typeKey, id)].filter(removeEmpty);
		return Em.RSVP.Promise.resolve(this.deserialize(json));
	},

	/**
	 * The same as find, only it should load several records. The
	 * promise can return any type of enumerable containing the records.
	 *
	 * @param {String} typeKey
	 * @param {String[]} ids Enumerable of IDs
	 * @returns {Promise} A promise that resolves to normalized JSON
	 */
	findMany: function(typeKey, ids) {
		var json = {};
		json[EG.String.pluralize(typeKey)] = ids.map(function(id) {
			return this._getRecord(typeKey, id);
		}, this).filter(removeEmpty);
		return Em.RSVP.Promise.resolve(this.deserialize(json));
	},

	/**
	 * The same as find, only it should load all records of the given type.
	 * The promise can return any type of enumerable containing the records.
	 *
	 * @param {String} typeKey
	 * @returns {Promise} A promise that resolves to normalized JSON
	 */
	findAll: function(typeKey) {
		var json = {};
		json[EG.String.pluralize(typeKey)] = this._getRecords(typeKey);
		return Em.RSVP.Promise.resolve(this.deserialize(json));
	},

	/**
	 * This method returns normalized JSON as the other methods do, but
	 * the normalized JSON must contain one extra field. It must contain
	 * an `ids` field that represents the IDs of the records that matched
	 * the query. This helps distinguish them from any other records of
	 * that same type that may have been returned from the server.
	 *
	 * @param {String} typeKey
	 * @param {Object} query The query parameters that were passed into `find` earlier
	 * @returns {Promise} A promise that resolves to normalized JSON
	 */
	findQuery: function(typeKey, query) {
		throw new Error('Your adapter doesn\'t implement `findQuery`.');
	},

	/**
	 * Update the given record.
	 *
	 * @param {Model} record The model to save
	 * @returns {Promise} A promise that resolves to normalized JSON
	 */
	updateRecord: function(record) {
		this._setRecord(record);
		return Em.RSVP.Promise.resolve({});
	},

	/**
	 * Update the given record.
	 *
	 * @param {Model} record The model to save
	 * @returns {Promise} A promise that resolves to normalized JSON
	 */
	deleteRecord: function(record) {
		this._deleteRecord(record.typeKey, record.get('id'));
		return Em.RSVP.Promise.resolve({});
	}
});

})();

(function() {

/**
 * @class FixtureAdapter
 */
EG.FixtureAdapter = EG.SynchronousAdapter.extend({

	/**
	 * Gets a record from the appropriate fixtures array.
	 *
	 * @param {String} typeKey
	 * @param {String} id
	 * @return {Object} Serialized JSON Object
	 * @private
	 */
	_getRecord: function(typeKey, id) {
		var model = this.get('store').modelForType(typeKey);
		model.FIXTURES = model.FIXTURES || [];

		for (var i = 0; i < model.FIXTURES.length; i+=1) {
			if (model.FIXTURES[i].id === id) {
				return this._fixtureToJson(typeKey, model.FIXTURES[i]);
			}
		}

		return null;
	},

	/**
	 * Gets all fixtures of the specified type.
	 *
	 * @param {String} typeKey
	 * @returns {Object[]} Serialized JSON Objects
	 * @private
	 */
	_getRecords: function(typeKey) {
		return (this.get('store').modelForType(typeKey).FIXTURES || []).map(function(fixture) {
			return this._fixtureToJson(typeKey, fixture);
		}, this);
	},

	/**
	 * Puts a record in the appropriate fixtures array.
	 *
	 * @param {Model} record
	 * @private
	 */
	_setRecord: function(record) {
		var fixture = this._recordToFixture(record);
		var model = record.constructor;
		model.FIXTURES = model.FIXTURES || [];

		for (var i = 0; i < model.FIXTURES.length; i+=1) {
			if (model.FIXTURES[i].id === fixture.id) {
				model.FIXTURES[i] = fixture;
				return;
			}
		}

		model.FIXTURES.push(fixture);
	},

	/**
	 * Deletes a record from the appropriate fixtures array.
	 *
	 * @param {String} typeKey
	 * @param {String} id
	 * @private
	 */
	_deleteRecord: function(typeKey, id) {
		var model = this.get('store').modelForType(typeKey);
		model.FIXTURES = model.FIXTURES || [];

		for (var i = 0; i < model.FIXTURES.length; i+=1) {
			if (model.FIXTURES[i].id === id) {
				model.FIXTURES.splice(i, 1);
				return;
			}
		}
	},

	/**
	 * We want users to be able to store their fixture data in a deserialized form,
	 * in our case, the format that the store expects from the adapter. This means
	 * that when we serialize a fixture to JSON, we have to replicate the work that
	 * the serializer would normally do with a record.
	 *
	 * TODO: Fix issues with missing attributes and relationships.
	 *
	 * @param typeKey
	 * @param fixture
	 * @returns {{id: (*|fixture.id), links: {}}}
	 * @private
	 */
	_fixtureToJson: function(typeKey, fixture) {
		var model = this.get('store').modelForType(typeKey);
		var json = {
			id: fixture.id,
			links: {}
		};

		model.eachAttribute(function(name, meta) {
			var type = this.get('store').attributeTypeFor(meta.type);
			json[name] = (fixture[name] === undefined ? meta.defaultValue: type.serialize(fixture[name]));
		}, this);

		model.eachRelationship(function(name, meta) {
			var val = fixture[name];

			if (meta.kind === EG.Model.HAS_MANY_KEY) {
				if (val === undefined) {
					json.links[name] = meta.defaultValue;
				} else {
					json.links[name] = val.filter(function(id) {
						return (!EG.Model.isTemporaryId(id));
					});
				}
			} else {
				if (val === undefined) {
					json.links[name] = meta.defaultValue;
				} else {
					json.links[name] = val;
				}
			}
		});

		return json;
	},

	_recordToFixture: function(record) {
		var fixture = {
			id: record.get('id')
		};

		record.constructor.eachAttribute(function(name, meta) {
			fixture[name] = record.get(name);
		});

		record.constructor.eachRelationship(function(name, meta) {
			fixture[name] = record.get('_' + name);

			if (fixture[name] && fixture[name].toArray) {
				fixture[name] = fixture[name].toArray();
			}
		});

		return fixture;
	}
});

})();

(function() {

/**
 * @class LocalStorageAdapter
 */
EG.LocalStorageAdapter = EG.SynchronousAdapter.extend({

	/**
	 * If you would like to bootstrap the local storage with fixture data,
	 * put the type key of the model you would like to bootstrap in this
	 * array. For instance, if you put 'user' in the array, upon initialization,
	 * the adapter will check if it has been initialized before. If it
	 * hasn't, it will load User.FIXTURES into the local storage.
	 * This is useful for debugging purposes when you want to use fixture
	 * data, but still want the ability for changes to persist page loads.
	 *
	 * To reload the newest version of your fixture data, delete the
	 * `ember-graph.models.initialized` key in the local storage.
	 *
	 * @type {String[]}
	 */
	fixtures: [],

	init: function() {
		

		if (!JSON.parse(localStorage['ember-graph.models.initialized'] || 'false')) {
			var store = this.get('store');
			var adapter = EG.FixtureAdapter.create({ store: store });
			this.get('fixtures').forEach(function(typeKey) {
				(store.modelForType(typeKey).FIXTURES || []).forEach(function(fixture) {
					var id = fixture.id;
					var json = JSON.stringify(adapter._getRecord(typeKey, id));
					localStorage['ember-graph.models.' + typeKey + '.' + id] = json;
				}, this);
			}, this);
		}

		localStorage['ember-graph.models.initialized'] = 'true';

		return this._super();
	},

	/**
	 * @param {String} typeKey
	 * @param {String} id
	 * @return {Object} Serialized JSON Object
	 * @private
	 */
	_getRecord: function(typeKey, id) {
		var recordString = localStorage['ember-graph.models.' + typeKey + '.' + id];

		if (typeof recordString === 'string') {
			return JSON.parse(recordString);
		} else {
			return null;
		}
	},

	/**
	 * @param {String} typeKey
	 * @returns {Object[]} Serialized JSON Objects
	 * @private
	 */
	_getRecords: function(typeKey) {
		return Em.keys(localStorage).filter(function(key) {
			return EG.String.startsWith(key, 'ember-graph.models.' + typeKey);
		}).map(function(key) {
			var parts = (/ember-graph\.models\.(.+)\.(.+)/g).exec(key);
			return this._getRecord(parts[1], parts[2]);
		}, this);
	},

	/**
	 * @param {Model} record
	 * @private
	 */
	_setRecord: function(record) {
		var json = this.serialize(record, { includeId: true });
		localStorage['ember-graph.models.' + record.typeKey + '.' + json.id] = JSON.stringify(json);
	},

	/**
	 * @param {String} typeKey
	 * @param {String} id
	 * @private
	 */
	_deleteRecord: function(typeKey, id) {
		delete localStorage['ember-graph.models.' + typeKey + '.' + id];
	}
});

})();

(function() {

EG.RESTAdapter = EG.Adapter.extend({

	/**
	 * Persists a record to the server. This method returns normalized JSON
	 * as the other methods do, but the normalized JSON must contain one
	 * extra field. It must contain an `id` field that represents the
	 * permanent ID of the record that was created. This helps distinguish
	 * it from any other records of that same type that may have been
	 * returned from the server.
	 *
	 * @param {Model} record The record to persist
	 * @returns {Promise} A promise that resolves to normalized JSON
	 */
	createRecord: function(record) {
		var url = this._buildUrl(record.typeKey, null);
		var json = this.serialize(record, { includeId: false });

		return this._ajax(url, 'POST', {}, json).then(function(payload) {
			return this.deserialize(payload, { isCreatedRecord: true });
		}.bind(this));
	},

	/**
	 * Fetch a record from the server.
	 *
	 * @param {String|} typeKey
	 * @param {String} id The ID of the record to fetch
	 * @returns {Promise} A promise that resolves to normalized JSON
	 */
	findRecord: function(typeKey, id) {
		var url = this._buildUrl(typeKey, id);

		return this._ajax(url, 'GET').then(function(payload) {
			return this.deserialize(payload);
		}.bind(this));
	},

	/**
	 * The same as find, only it should load several records. The
	 * promise can return any type of enumerable containing the records.
	 *
	 * @param {String} typeKey
	 * @param {String[]} ids Enumerable of IDs
	 * @returns {Promise} A promise that resolves to normalized JSON
	 */
	findMany: function(typeKey, ids) {
		var url = this._buildUrl(typeKey, ids.join());

		return this._ajax(url, 'GET').then(function(payload) {
			return this.deserialize(payload);
		}.bind(this));
	},

	/**
	 * The same as find, only it should load all records of the given type.
	 * The promise can return any type of enumerable containing the records.
	 *
	 * @param {String} typeKey
	 * @returns {Promise} A promise that resolves to normalized JSON
	 */
	findAll: function(typeKey) {
		var url = this._buildUrl(typeKey, null);

		return this._ajax(url, 'GET').then(function(payload) {
			return this.deserialize(payload);
		}.bind(this));
	},

	/**
	 * This method returns normalized JSON as the other methods do, but
	 * the normalized JSON must contain one extra field. It must contain
	 * an `ids` field that represents the IDs of the records that matched
	 * the query. This helps distinguish them from any other records of
	 * that same type that may have been returned from the server.
	 *
	 * @param {String} typeKey
	 * @param {Object} query The query parameters that were passed into `find` earlier
	 * @returns {Promise} A promise that resolves to normalized JSON
	 */
	findQuery: function(typeKey, query) {
		var options = {};

		Em.keys(query).forEach(function(key) {
			options[key] = '' + query[key];
		});

		var url = this._buildUrl(typeKey, null, options);

		return this._ajax(url, 'GET').then(function(payload) {
			return this.deserialize(payload, { isQuery: true });
		}.bind(this));
	},

	/**
	 * Update the given record.
	 *
	 * @param {Model} record The model to save
	 * @returns {Promise} A promise that resolves to normalized JSON
	 */
	updateRecord: function(record) {
		var url = this._buildUrl(record.typeKey, record.get('id'));
		var json = this.serialize(record, { includeId: true });

		return this._ajax(url, 'PUT', {}, json).then(function(payload) {
			return this.deserialize(payload);
		}.bind(this));
	},

	/**
	 * Update the given record.
	 *
	 * @param {Model} record The model to save
	 * @returns {Promise} A promise that resolves to normalized JSON
	 */
	deleteRecord: function(record) {
		var url = this._buildUrl(record.typeKey, record.get('id'));

		return this._ajax(url, 'DELETE').then(function(payload) {
			return this.deserialize(payload) || {};
		}.bind(this));
	},

	/**
	 * This function will build the URL that the request will be posted to.
	 * If an ID is provided, it will used the singular version of the
	 * typeKey given (`/user/52`). If no ID is provided, it uses the plural
	 * version of the typeKey given (`/users`). Either way, it appends the
	 * options passed in as query parameters. The options must be strings,
	 * but they don't have to be escaped, this function will do that.
	 *
	 * @param {String} typeKey
	 * @param {String} id
	 * @param {Object.<String,String>} [options]
	 * @returns {String}
	 * @private
	 */
	_buildUrl: function(typeKey, id, options) {
		var url = this.get('prefix') + '/';

		if (id) {
			url += (typeKey + '/' + id);
		} else {
			url += EG.String.pluralize(typeKey);
		}

		if (options) {
			Em.keys(options).forEach(function(key, index) {
				url += ((index === 0) ? '?' : '&') + key + '=' + encodeURIComponent(options[key]);
			});
		}

		return url;
	},

	/**
	 * This hook is called by the adapter when forming the URL for requests.
	 * The adapter normally makes requests to the current location. So the URL
	 * looks like `/user/6`. If you want to add a different host, or a prefix,
	 * override this hook.
	 *
	 * Warning: Do NOT put a trailing slash. The adapter won't check for
	 * mistakes, so just don't do it.
	 *
	 * @private
	 */
	prefix: Em.computed(function() {
		return '';
	}).property(),

	/**
	 * This method sends the request to the server.
	 * The response is processed in the Ember run-loop.
	 *
	 * @param {String} url
	 * @param {String} verb GET, POST, PUT or DELETE
	 * @param {Object.<String, String>} [headers]
	 * @param {String} [body]
	 * @returns {Promise}
	 * @private
	 */
	_ajax: function(url, verb, headers, body) {
		return new Em.RSVP.Promise(function(resolve, reject) {
			$.ajax({
				cache: false,
				contentType: 'application/json',
				data: (body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body))),
				headers: headers || {},
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
		record.set('id', EG.Model.temporaryIdPrefix + EG.util.generateGUID());

		this._setRecord(typeKey, record);

		record._loadData(json);

		return record;
	},

	/**
	 * Loads an already created record into the store. This method
	 * should probably only be used by the store or adapter.
	 *
	 * @param typeKey
	 * @param json
	 */
	_loadRecord: function(typeKey, json) {
		var record = this.modelForType(typeKey)._create();
		record.set('store', this);
		record.set('id', json.id);

		this._setRecord(typeKey, record);

		if (this._hasQueuedRelationships(typeKey, json.id)) {
			this._connectQueuedRelationships(record);
		}

		record._loadData(json);

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

		return EG.PromiseObject.create({ promise: promise });
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

		record.set('isSaving', true);

		if (isNew) {
			return this.get('adapter').createRecord(record).then(function(payload) {
				record.set('id', payload.meta.newId);
				record.set('isSaving', false);

				this._deleteRecord(type, tempId);
				this._setRecord(type, record);

				this.extractPayload(payload);
				return record;
			}.bind(this));
		} else {
			return this.get('adapter').updateRecord(record).then(function(payload) {
				this.extractPayload(payload);
				record.set('isSaving', false);
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

		record.set('isSaving', true);
		record.set('isDeleted', true);

		return this.get('adapter').deleteRecord(record).then(function(payload) {
			this._deleteRelationshipsForRecord(type, id);
			this.extractPayload(payload);
			record.set('isSaving', false);
			this._deleteRecord(type, id);
		}.bind(this));
	},

	/**
	 * @method reloadRecord
	 * @param {Model} record
	 * @returns {Promise} Resolves to the reloaded record
	 */
	reloadRecord: function(record) {
		
		record.set('isReloading', true);

		return this.get('adapter').find(record.typeKey, record.get('id')).then(function(payload) {
			this.extractPayload(payload);
			record.set('isReloading', false);
			return record;
		}.bind(this));
	},

	/**
	 * Takes a normalized JSON payload and loads it into the store.
	 *
	 * @method extractPayload
	 * @param {Object} payload
	 */
	extractPayload: function(payload) {
		var reloadDirty = this.get('reloadDirty');

		try {
			this.beginPropertyChanges();

			Em.keys(payload).forEach(function(typeKey) {
				if (typeKey === 'meta') {
					return;
				}

				var type = this.modelForType(typeKey);

				payload[typeKey].forEach(function(json) {
					var record = this.getRecord(typeKey, json.id);

					if (record) {
						if (!record.get('isDirty') || reloadDirty) {
							record._loadData(json);
						}
					} else {
						this._loadRecord(typeKey, json);
					}
				}, this);
			}, this);
		} finally {
			this.endPropertyChanges();
		}
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
		var queued = EG.util.values(this.get('_queuedRelationships'));

		for (var i = 0; i < queued.length; i = i + 1) {
			if (queued[i].get('type2') === typeKey && queued[i].get('object2') === id) {
				return true;
			}
		}

		return false;
	},

	/**
	 * Will connect all queued relationships to the given record.
	 *
	 * @param {Model} record
	 * @returns {Object[]} The objects to alert of changes, along with the corresponding properties
	 */
	_connectQueuedRelationships: function(record) {
		var alerts = [];
		var queued = this.get('_queuedRelationships');
		var toConnect = this._queuedRelationshipsFor(record.typeKey, record.get('id'));

		toConnect.forEach(function(relationship) {
			alerts.push(record._connectRelationship(relationship));
			relationship.set('object2', record);
			delete queued[relationship.get('id')];
		});

		this.notifyPropertyChange('_queuedRelationships');

		return alerts;
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
	 * @returns {Object[]} The objects to alert of changes, along with the corresponding properties
	 */
	_createRelationship: function(type1, relationship1, id1, type2, relationship2, id2, state) { // jshint ignore:line
		var alerts = [];
		var record1 = this.getRecord(type1, id1);
		var record2 = this.getRecord(type2, id2);

		if (record1 === null && record2 === null) {
			return alerts;
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
			return alerts;
		}

		if (record1._isLinkedTo(relationship1, id2)) {
			// TODO: Do we need to check both sides, or can we assume consistency?
			return alerts;
		}

		var relationship = EG.Relationship.create({
			object1: record1,
			relationship1: relationship1,
			object2: (record2 === null ? id2 : record2),
			relationship2: relationship2,
			state: state
		});

		this.get('_relationships')[relationship.get('id')] = relationship;

		alerts.push(record1._connectRelationship(relationship));

		if (record2 !== null) {
			alerts.push(record2._connectRelationship(relationship));
		} else {
			this.set('_queuedRelationships.' + relationship.get('id'), relationship);
			this.notifyPropertyChange('_queuedRelationships');
		}

		return alerts;
	},

	/**
	 * Deletes the given relationship. Disconnects from both records,
	 * then destroys, all references to the relationship.
	 *
	 * @param {String} id
	 * @returns {Object[]} The objects to alert of changes, along with the corresponding properties
	 */
	_deleteRelationship: function(id) {
		var alerts = [];

		var relationship = this.get('_relationships')[id];
		if (Em.isNone(relationship)) {
			return alerts;
		}

		var object1 = relationship.get('object1');
		var object2 = relationship.get('object2');

		alerts.push(object1._disconnectRelationship(relationship));
		if (object2 instanceof EG.Model) {
			alerts.push(object2._disconnectRelationship(relationship));
		} else {
			delete this.get('_queuedRelationships')[id];
			this.notifyPropertyChange('_queuedRelationships');
		}

		delete this.get('_relationships')[id];

		return alerts;
	},

	/**
	 * @param {String} id
	 * @param {String} state
	 *
	 * @returns {Object[]} The objects to alert of changes, along with the corresponding properties
	 */
	_changeRelationshipState: function(id, state) {
		var alerts = [];

		var relationship = this.get('_relationships')[id];
		if (Em.isNone(relationship) || relationship.get('state') === state) {
			return alerts;
		}

		var object1 = relationship.get('object1');
		var object2 = relationship.get('object2');

		var oldHash = EG.Relationship.stateToHash(relationship.get('state'));
		var newHash = EG.Relationship.stateToHash(state);

		relationship.set('state', state);

		object1.set(newHash + '.' + id, object1.get(oldHash + '.' + id));
		delete object1.get(oldHash)[id];
		alerts.push({ record: object1, property: oldHash });
		alerts.push({ record: object1, property: newHash });

		if (object2 instanceof EG.Model) {
			object2.set(newHash + '.' + id, object2.get(oldHash + '.' + id));
			delete object2.get(oldHash)[id];
			alerts.push({ record: object2, property: oldHash });
			alerts.push({ record: object2, property: newHash });
		}

		return alerts;
	},

	/**
	 * Gets all relationships related to the given record.
	 *
	 * @param {String} typeKey
	 * @param {String} name
	 * @param {String} id
	 * @returns {Boolean}
	 */
	_relationshipsForRecord: function(typeKey, name, id) {
		return EG.util.values(this.get('_relationships')).filter(function(relationship) {
			if (relationship.get('type1') === typeKey && relationship.get('id') === id &&
				relationship.get('relationship1') === name) {
				return true;
			}

			if (relationship.get('type2') === typeKey && relationship.get('relationship2') === name) {
				var object2 = relationship.get('object2');

				if (typeof object2 === 'string') {
					if (object2 === id) {
						return true;
					}
				} else if (object2.get('id') === id) {
					return true;
				}
			}

			return false;
		});
	},

	_deleteRelationshipsForRecord: function(typeKey, id) {
		var alerts = [];
		var relationships = EG.util.values(this.get('_relationships'));

		relationships.forEach(function(relationship) {
			if (relationship.isConnectedTo(typeKey, id)) {
				alerts = alerts.concat(this._deleteRelationship(Em.get(relationship, 'id')));
			}
		}, this);

		alerts.forEach(function(alert) {
			Em.tryInvoke(alert.record, 'notifyPropertyChange', [alert.property]);
		});
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

})();

(function() {

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
				
				return '';
		}
	}
});

})();

(function() {

/**
 * Specifies the details of a custom attribute type.
 *
 * @class {AttributeType}
 */
EG.AttributeType = Em.Object.extend({

	/**
	 * The default value to use if a value of this type is missing.
	 */
	defaultValue: null,

	/**
	 * @param {*} obj Javascript object
	 * @returns {Object} JSON representation
	 */
	serialize: function(obj) {
		return obj;
	},

	/**
	 * @param {Object} json JSON representation of object
	 * @returns {*} Javascript object
	 */
	deserialize: function(json) {
		return json;
	},

	/**
	 * @param {*} obj Javascript object
	 * @returns {Boolean} Whether or not the object is a valid value for this type
	 */
	isValid: function(obj) {
		return true;
	},

	/**
	 * @param {*} a Javascript Object
	 * @param {*} b Javascript Object
	 * @returns {Boolean} Whether or not the objects are equal or not
	 */
	isEqual: function(a, b) {
		return (a === b);
	}
});

})();

(function() {

/**
 * Will coerce any value to a JSON array (`null` is a valid value).
 * Ember enumerables are converted to arrays using `toArray()`
 */
EG.ArrayType = EG.AttributeType.extend({

	/**
	 * @param {*} obj Javascript object
	 * @returns {Object} JSON representation
	 */
	serialize: function(obj) {
		if (Em.isNone(obj)) {
			return null;
		}

		obj = (obj.toArray ? obj.toArray() : obj);
		return (Em.isArray(obj) ? obj : null);
	},

	/**
	 * @param {Object} json JSON representation of object
	 * @returns {*} Javascript object
	 */
	deserialize: function(json) {
		return (Em.isArray(json) ? json : null);
	},

	/**
	 * @param {*} obj Javascript object
	 * @returns {Boolean} Whether or not the object is a valid value for this type
	 */
	isValid: function(obj) {
		try {
			JSON.stringify(obj);
			return Em.isArray(obj);
		} catch (e) {
			return false;
		}
	},

	/**
	 * @param {*} a Javascript Object
	 * @param {*} b Javascript Object
	 * @returns {Boolean} Whether or not the objects are equal or not
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
 * Will coerce any type to a boolean (`null` being the default). `null` is not a valid value.
 */
EG.BooleanType = EG.AttributeType.extend({

	/**
	 * The default value to use if a value of this type is missing.
	 */
	defaultValue: false,

	/**
	 * @param {*} obj Javascript object
	 * @returns {Object} JSON representation
	 */
	serialize: function(obj) {
		return this._coerceToBoolean(obj);
	},

	/**
	 * @param {Object} json JSON representation of object
	 * @returns {*} Javascript object
	 */
	deserialize: function(json) {
		return this._coerceToBoolean(json);
	},

	/**
	 * The only things that equal true are: true (primitive or object) and 'true' (string).
	 * Everything else is false.
	 *
	 * @param obj
	 * @private
	 */
	_coerceToBoolean: function(obj) {
		if (Em.typeOf(obj) === 'boolean' && obj == true) { // jshint ignore:line
			return true;
		}

		if (Em.typeOf(obj) === 'string' && obj == 'true') {  // jshint ignore:line
			return true;
		}

		return false;
	},

	/**
	 * @param {*} obj Javascript object
	 * @returns {Boolean} Whether or not the object is a valid value for this type
	 */
	isValid: function(obj) {
		return (Em.typeOf(obj) === 'boolean');
	}
});

})();

(function() {

/**
 * When serializing, will coerce to a timestamp. Numbers, dates and strings are are converted to dates,
 * then timestamps. Everything else serializes to null.
 *
 * When deserializing, numbers and strings are converted to dates, everything is is converted to null.
 */
EG.DateType = EG.AttributeType.extend({

	/**
	 * @param {*} obj Javascript object
	 * @returns {Object} JSON representation
	 */
	serialize: function(obj) {
		switch (Em.typeOf(obj)) {
			case 'date':
				return obj.getTime();
			case 'number':
				return obj;
			case 'string':
				return new Date(obj).getTime();
			default:
				return null;
		}
	},

	/**
	 * @param {Object} json JSON representation of object
	 * @returns {*} Javascript object
	 */
	deserialize: function(json) {
		switch (Em.typeOf(json)) {
			case 'number':
			case 'string':
				return new Date(json);
			default:
				return null;
		}
	},

	/**
	 * @param {*} obj Javascript object
	 * @returns {Boolean} Whether or not the object is a valid value for this type
	 */
	isValid: function(obj) {
		return (obj === null || Em.typeOf(obj) === 'date');
	},

	/**
	 * @param {*} a Javascript Object
	 * @param {*} b Javascript Object
	 * @returns {Boolean} Whether or not the objects are equal or not
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
 * Will coerce any type to a number (0 being the default). `null` is not a valid value.
 */
EG.NumberType = EG.AttributeType.extend({

	/**
	 * The default value to use if a value of this type is missing.
	 */
	defaultValue: 0,

	/**
	 * Will
	 *
	 * @param {*} obj Javascript object
	 * @returns {Object} JSON representation
	 */
	serialize: function(obj) {
		return this._coerceToNumber(obj);
	},

	/**
	 * @param {Object} json JSON representation of object
	 * @returns {*} Javascript object
	 */
	deserialize: function(json) {
		return this._coerceToNumber(json);
	},

	/**
	 * If the object passed is a number (and not NaN), it returns
	 * the object coerced to a number primitive. If the object is
	 * a string, it attempts to parse it (again, no NaN allowed).
	 * Otherwise, the default value (0) is returned.
	 *
	 * @param obj
	 * @returns {*}
	 * @private
	 */
	_coerceToNumber: function(obj) {
		if (this.isValid(obj)) {
			return Number(obj);
		}

		if (Em.typeOf(obj) === 'string') {
			var parsed = Number(obj);
			if (this.isValid(parsed)) {
				return parsed;
			}
		}

		return 0;
	},

	/**
	 * @param {*} obj Javascript object
	 * @returns {Boolean} Whether or not the object is a valid value for this type
	 */
	isValid: function(obj) {
		return (Em.typeOf(obj) === 'number' && !isNaN(obj) && isFinite(obj));
	}
});

})();

(function() {

var isObject = function(obj) {
	return !Em.isNone(obj) && typeof obj === 'object' && obj.constructor === Object;
};

var deepCompare = function(a, b) {
	if (isObject(a) && isObject(b)) {
		if (!new Em.Set(Em.keys(a)).isEqual(new Em.Set(Em.keys(b)))) {
			return false;
		}

		var keys = Em.keys(a);

		for (var i = 0; i < keys.length; i = i + 1) {
			if (!deepCompare(a[keys[i]], b[keys[i]])) {
				return false;
			}
		}

		return true;
	} else if (Em.isArray(a) && Em.isArray(b)) {
		return Em.compare(a, b) === 0;
	} else {
		return (a === b);
	}
};

/**
 * Will coerce any value to a JSON object (`null` is a valid value).
 * If JSON.stringify fails because the object is circular, it uses null instead.
 */
EG.ObjectType = EG.AttributeType.extend({

	/**
	 * @param {*} obj Javascript object
	 * @returns {Object} JSON representation
	 */
	serialize: function(obj) {
		if (isObject(obj)) {
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
	 * @param {Object} json JSON representation of object
	 * @returns {*} Javascript object
	 */
	deserialize: function(json) {
		if (isObject(json)) {
			return json;
		} else {
			return null;
		}
	},

	/**
	 * @param {*} obj Javascript object
	 * @returns {Boolean} Whether or not the object is a valid value for this type
	 */
	isValid: function(obj) {
		try {
			JSON.stringify(obj);
			return isObject(obj);
		} catch (e) {
			return false;
		}
	},

	/**
	 * @param {*} a Javascript Object
	 * @param {*} b Javascript Object
	 * @returns {Boolean} Whether or not the objects are equal or not
	 */
	isEqual: function(a, b) {
		if (!isObject(a) || !isObject(b)) {
			return false;
		}

		return deepCompare(a, b);
	}
});

})();

(function() {

EG.StringType = EG.AttributeType.extend({

	/**
	 * @param {*} obj Javascript object
	 * @returns {Object} JSON representation
	 */
	serialize: function(obj) {
		return (obj === null ? null : '' + obj);
	},

	/**
	 * @param {Object} json JSON representation of object
	 * @returns {*} Javascript object
	 */
	deserialize: function(json) {
		return (json === null ? null : '' + json);
	},

	/**
	 * @param {*} obj Javascript object
	 * @returns {Boolean} Whether or not the object is a valid value for this type
	 */
	isValid: function(obj) {
		return (obj === null || Em.typeOf(obj) === 'string');
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
 * @extends Ember.Object
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
	 * Denotes that a record has been deleted. If `isDirty` is also true,
	 * the change hasn't been persisted to the server yet.
	 *
	 * @property isDeleted
	 * @type Boolean
	 * @final
	 */
	isDeleted: null,

	/**
	 * Denotes that the record is currently saving its changes
	 * to the server, but the server hasn't responded yet.
	 *
	 * @property isSaving
	 * @type Boolean
	 * @final
	 */
	isSaving: null,

	/**
	 * Denotes that the record is being reloaded from the server,
	 * and will likely change when the server responds.
	 *
	 * @property isReloading
	 * @type Boolean
	 * @final
	 */
	isReloading: null,

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
	 * Denotes that the record has changes that have not been saved to the server yet.
	 *
	 * @property isDirty
	 * @type Boolean
	 * @final
	 */
	isDirty: Em.computed(function() {
		var isDeleted = this.get('isDeleted');
		var isSaving = this.get('isSaving');

		if (isDeleted && !isSaving) {
			return false;
		}

		var deleting = isDeleted && isSaving;
		return this.get('_areAttributesDirty') || this.get('_areRelationshipsDirty') || deleting;
	}).property('_areAttributesDirty', '_areRelationshipsDirty', 'isDeleted', 'isSaving'),

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
	 * Sets up the instance variables of this class.
	 *
	 * @method init
	 */
	init: function() {
		this._super();

		this.set('_id', null);
		this.set('store', null);

		this.set('_serverAttributes', Em.Object.create());
		this.set('_clientAttributes', Em.Object.create());

		this.set('_serverRelationships', {});
		this.set('_clientRelationships', {});
		this.set('_deletedRelationships', {});

		this.set('isDeleted', false);
		this.set('isSaving', false);
		this.set('isReloading', false);
	},

	/**
	 * Loads JSON data from the server into the record. This may be used when
	 * the record is brand new, or when the record is being reloaded. This
	 * should generally only be used by the store or for testing purposes.
	 * If called directly in production, this will have unintended consequences.
	 */
	_loadData: function(json) {
		json = json || {};
		

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
		return this.get('store').saveRecord(this);
	},

	/**
	 * Proxies the store's reload method for convenience.
	 *
	 * @method reload
	 * @return Promise
	 */
	reload: function() {
		return this.get('store').reloadRecord(this);
	},

	/**
	 * Proxies the store's delete method for convenience.
	 *
	 * @method destroy
	 * @return Promise
	 */
	destroy: function() {
		return this.get('store').deleteRecord(this);
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

var disallowedAttributeNames = new Em.Set(['id', 'type', 'content']);

var createAttribute = function(attributeName, options) {
	var meta = {
		isAttribute: true,
		type: options.type,
		isRequired: !options.hasOwnProperty('defaultValue'),
		defaultValue: options.defaultValue,
		readOnly: options.readOnly === true,

		// These should really only be used internally by the model class
		isEqual: options.isEqual,
		isValid: options.isValid
	};

	var attribute = Em.computed(function(key, value) {
		var server = this.get('_serverAttributes.' + key);
		var client = this.get('_clientAttributes.' + key);
		var current = (client === undefined ? server : client);

		EG.debug(function() {
			if (arguments.length > 1 && value === undefined) {
				
			}
		});

		if (value !== undefined) {
			var isValid = meta.isValid || this.get('store').attributeTypeFor(meta.type).isValid;
			if (!isValid(value)) {
				
				return current;
			}

			var isEqual = meta.isEqual || this.get('store').attributeTypeFor(meta.type).isEqual;
			if (isEqual(server, value)) {
				this.set('_clientAttributes.' + key, undefined);
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

			if (client === undefined || type.isEqual(server, client)) {
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
			

			var value = (json.hasOwnProperty(attributeName) ? json[attributeName] : meta.defaultValue);

			// TODO: Do we want a way to accept non-valid value from the server?
			var isValid = meta.isValid || this.get('store').attributeTypeFor(meta.type).isValid;
			if (isValid(value)) {
				this.set('_serverAttributes.' + attributeName, value);
			} else {
				
				this.set('_serverAttributes.' + attributeName, meta.defaultValue);
			}
		}, this);
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

var createRelationship = function(kind, options) {
	
	

	var meta = {
		isRelationship: false,
		kind: kind,
		isRequired: (options.hasOwnProperty('defaultValue') ? false : options.isRequired !== false),
		defaultValue: options.defaultValue || (kind === HAS_MANY_KEY ? [] : null),
		relatedType: options.relatedType,
		inverse: options.inverse,
		readOnly: options.readOnly === true
	};

	

	var relationship;

	if (kind === HAS_MANY_KEY) {
		relationship = function(key) {
			return this._hasManyValue(key.substring(1));
		};
	} else {
		relationship = function(key) {
			return this._hasOneValue(key.substring(1));
		};
	}

	return Em.computed(relationship).property('_serverRelationships', '_clientRelationships').meta(meta).readOnly();
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

			obj['_' + name] = createRelationship(kind, options);
			var meta = Em.copy(obj['_' + name].meta(), true);
			meta.isRelationship = true;
			obj[name] = relationship.property('_' + name).meta(meta).readOnly();
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
	},

	/**
	 * Alerts the records and properties in the given array.
	 */
	_notifyProperties: function(properties) {
		properties.forEach(function(property) {
			try {
				var obj = property.record;
				var name = property.property;

				if (obj.constructor.isRelationship && obj.constructor.isRelationship(name)) {
					obj.notifyPropertyChange('_' + name);
				} else {
					obj.notifyPropertyChange(name);
				}
			} catch (e) {
				
			}
		}, this);
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
		var serverRelationships = EG.util.values(this.get('_serverRelationships'));
		var otherRelationships = EG.util.values(this.get((server ? '_deleted' : '_client') + 'Relationships'));
		var current = serverRelationships.concat(otherRelationships);

		for (var i = 0; i < current.length; i = i + 1) {
			if (current[i].relationshipName(this) === relationship) {
				return current[i].otherId(this);
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
		var serverRelationships = EG.util.values(this.get('_serverRelationships'));
		var otherRelationships = EG.util.values(this.get((server ? '_deleted' : '_client') + 'Relationships'));
		var current = serverRelationships.concat(otherRelationships);

		var found = [];
		for (var i = 0; i < current.length; i = i + 1) {
			if (current[i].relationshipName(this) === relationship) {
				found.push(current[i].otherId(this));
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
		var server = EG.util.values(this.get('_serverRelationships'));
		var client = EG.util.values(this.get('_clientRelationships'));
		var deleted = EG.util.values(this.get('_deletedRelationships'));

		return server.concat(client.concat(deleted));
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
		var alerts = [];
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
								alerts = alerts.concat(
									store._changeRelationshipState(relationship.get('id'), SAVED_STATE));
							}
						}
					} else {
						if (value === otherId) {
							if (sideWithClient) {
								// Leave it alone
							} else {
								alerts = alerts.concat(
									store._changeRelationshipState(relationship.get('id'), SAVED_STATE));
							}
						}
					}

					return false;
				}

				if (state === SAVED_STATE) {
					alerts = alerts.concat(store._deleteRelationship(relationship.get('id')));
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
						alerts = alerts.concat(store._changeRelationshipState(relationship.get('id'), SAVED_STATE));
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
								alerts = alerts.concat(store._deleteRelationship(conflict.get('id')));
								break;
							case NEW_STATE:
								if (sideWithClient) {
									// We have to side with the client, so leave it alone, add ours as deleted
									addState = DELETED_STATE;
								} else {
									// We have to side with the server, so delete it
									alerts = alerts.concat(store._deleteRelationship(conflict.get('id')));
								}
								break;
						}
					}

					alerts = alerts.concat(store._createRelationship(this.typeKey, name, this.get('id'),
						meta.relatedType, meta.inverse, id, addState));
				}, this);
			} else {
				// There should only be one relationship in there
				

				var conflict = this._hasOneConflict(name, value);

				// Update client side relationships that have been saved
				if (client.length === 1) {
					if (client[0].otherId(this) === value) {
						alerts = alerts.concat(store._changeRelationshipState(client[0].get('id'), SAVED_STATE));
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
											alerts = alerts.concat(store._deleteRelationship(conflict.get('id')));
											break;
										case NEW_STATE:
											// We have to side with the client, so leave it alone
											break;
									}
								}

								// Add the server relationship as deleted
								alerts = alerts.concat(store._createRelationship(this.typeKey, name, this.get('id'),
									meta.relatedType, meta.inverse, value, DELETED_STATE));
							}
						} else {
							// Delete the client side relationship
							alerts = alerts.concat(store._deleteRelationship(client[0].get('id')));
							if (value !== null) {
								if (conflict !== null) { // jshint ignore:line
									// Delete it because the server says that relationship no longer exists.
									// It is now occupied by another relationship
									alerts = alerts.concat(store._deleteRelationship(conflict.get('id')));
								}

								alerts = alerts.concat(store._createRelationship(this.typeKey, name, this.get('id'),
									meta.relatedType, meta.inverse, value, SAVED_STATE));
							}
						}
					}
				} else if (client.length === 0) {
					// We can simply create the server relationship
					if (value !== null) {
						if (conflict !== null) { // jshint ignore:line
							// Delete it because the server says that relationship no longer exists.
							// It is now occupied by another relationship
							alerts = alerts.concat(store._deleteRelationship(conflict.get('id')));
						}

						alerts = alerts.concat(store._createRelationship(this.typeKey, name, this.get('id'),
							meta.relatedType, meta.inverse, value, SAVED_STATE));
					}
				} else {
					// TODO: This should really never happen in production.
					// What should we do? Can we guarantee this never happens?
				}
			}
		}, this);

		this.constructor._notifyProperties(alerts);
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
		var alerts = [];
		var store = this.get('store');

		this._getAllRelationships().forEach(function(relationship) {
			switch (relationship.get('state')) {
				case NEW_STATE:
					alerts = alerts.concat(store._deleteRelationship(relationship.get('id')));
					break;
				case SAVED_STATE:
					// NOP
					break;
				case DELETED_STATE:
					alerts = alerts.concat(store._changeRelationshipState(relationship.get('id'), SAVED_STATE));
					break;
			}
		}, this);

		this.constructor._notifyProperties(alerts);
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

		var alerts = [];
		var store = this.get('store');
		var meta = this.constructor.metaForRelationship(relationshipName);
		
		if (meta.readOnly) {
			return;
		}

		var link = this._findLinkTo(relationshipName, id);
		if (link && (link.get('state') === NEW_STATE || link.get('state') === SAVED_STATE)) {
			return;
		}

		if (link && link.get('state') === DELETED_STATE) {
			alerts = alerts.concat(this.get('store')._changeRelationshipState(link.get('id'), SAVED_STATE));
			this.constructor._notifyProperties(alerts);
			return;
		}

		var conflict = this._hasOneConflict(relationshipName, id);
		if (conflict !== null) {
			switch (conflict.get('state')) {
				case DELETED_STATE:
					// NOP
					break;
				case SAVED_STATE:
					alerts = alerts.concat(store._changeRelationshipState(conflict.get('id'), DELETED_STATE));
					break;
				case NEW_STATE:
					alerts = alerts.concat(store._deleteRelationship(conflict.get('id')));
					break;
			}
		}

		alerts = alerts.concat(store._createRelationship(this.typeKey, relationshipName,
			this.get('id'), meta.relatedType, meta.inverse, id, NEW_STATE));

		this.constructor._notifyProperties(alerts);
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
		
		if (meta.readOnly) {
			return;
		}

		var r = this._findLinkTo(relationshipName, id);

		if (r !== null) {
			switch (r.get('state')) {
				case NEW_STATE:
					this.constructor._notifyProperties(this.get('store')._deleteRelationship(r.get('id')));
					break;
				case SAVED_STATE:
					this.constructor._notifyProperties(
						this.get('store')._changeRelationshipState(r.get('id'), DELETED_STATE));
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

		var alerts = [];
		var meta = this.constructor.metaForRelationship(relationshipName);
		
		if (meta.readOnly) {
			return;
		}

		var link = this._findLinkTo(relationshipName, id);
		if (link && (link.get('state') === NEW_STATE || link.get('state') === SAVED_STATE)) {
			return;
		}

		if (link && link.get('state') === DELETED_STATE) {
			alerts = alerts.concat(this.get('store')._changeRelationshipState(link.get('id'), SAVED_STATE));
			this.constructor._notifyProperties(alerts);
			return;
		}

		if (id === null) {
			return;
		}

		if (id === null) {
			this.clearHasOneRelationship(relationshipName);
			return;
		}

		alerts = alerts.concat(this.clearHasOneRelationship(relationshipName, true));

		var store = this.get('store');
		var conflict = this._hasOneConflict(relationshipName, id);
		if (conflict !== null) {
			switch (conflict.get('state')) {
				case DELETED_STATE:
					// NOP
					break;
				case SAVED_STATE:
					alerts = alerts.concat(store._changeRelationshipState(conflict.get('id'), DELETED_STATE));
					break;
				case NEW_STATE:
					alerts = alerts.concat(store._deleteRelationship(conflict.get('id')));
					break;
			}
		}

		alerts = alerts.concat(store._createRelationship(this.typeKey, relationshipName,
			this.get('id'), meta.relatedType, meta.inverse, id, NEW_STATE));

		this.constructor._notifyProperties(alerts);
	},

	/**
	 * Sets the value of a hasOne relationship to `null`.
	 *
	 * @method clearHasOneRelationship
	 * @for Model
	 * @param {String} relationshipName
	 */
	clearHasOneRelationship: function(relationshipName, suppressNotifications) {
		var alerts = [];
		var meta = this.constructor.metaForRelationship(relationshipName);
		
		if (meta.readOnly) {
			return [];
		}

		var current = this._hasOneValue(relationshipName);

		if (current !== null) {
			var r = this._findLinkTo(relationshipName, current);

			if (r !== null) {
				switch (r.get('state')) {
					case NEW_STATE:
						alerts = alerts.concat(this.get('store')._deleteRelationship(r.get('id')));
						break;
					case SAVED_STATE:
						alerts = alerts.concat(this.get('store')._changeRelationshipState(r.get('id'), DELETED_STATE));
						break;
					case DELETED_STATE:
						// NOP?
						break;
				}
			}
		}

		if (suppressNotifications) {
			return alerts;
		} else {
			this.constructor._notifyProperties(alerts);
			return [];
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
		return { record: this, property: hash };
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
		return { record: this, property: hash };
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
 * - `isValid`: Function that determines if a value is valid or not. It's used during serialization
 * and deserialization, as well as when changing the value. The function should take a single
 * argument and return `true` or `false` depending on validity of the value.
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