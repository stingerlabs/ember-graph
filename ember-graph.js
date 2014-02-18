(function() {

window.EmberGraph = window.Eg = window.EG = Em.Namespace.create({
	// Neuter will take care of inserting the version number from bower.json
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
			name: 'store',

			initialize: function(container, App) {
				App.register('store:main', App.Store || EG.Store, { singleton: true });

				App.register('adapter:rest', EG.RESTAdapter, { singleton: true });
				App.register('adapter:fixture', EG.FixtureAdapter, { singleton: true });
				App.register('serializer:json', EG.JSONSerializer, { singleton: true });

				container.lookup('store:main');
			}
		});

		Application.initializer({
			name: 'injectStore',
			before: 'store',

			initialize: function(container, App) {
				App.inject('controller', 'store', 'store:main');
				App.inject('route', 'store', 'store:main');
				App.inject('adapter', 'store', 'store:main');
				App.inject('serializer', 'store', 'store:main');
				// TODO: Use this to inject store into other items (adapters, serializers, models)
			}
		});
	});
}

})();

(function() {

Eg.util = {
	generateGUID: function() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random()*16|0; // jshint ignore:line
			var v = (c == 'x' ? r : (r&0x3|0x8)); // jshint ignore:line
			return v.toString(16);
		});
	},

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

Eg.String = {
	startsWith: function(string, prefix) {
		return string.indexOf(prefix) === 0;
	},

	endsWith: function(string, suffix) {
		return string.indexOf(suffix, this.length - suffix.length) >= 0;
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
		return Eg.String.startsWith(this, prefix);
	};

	String.prototype.endsWith = String.prototype.endsWith || function(suffix) {
		return Eg.String.endsWith(this, suffix);
	};

	String.prototype.capitalize = String.prototype.capitalize || function() {
		return Eg.String.capitalize(this);
	};

	String.prototype.decapitalize = String.prototype.decapitalize || function() {
		return Eg.String.decapitalize(this);
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

Eg.String.pluralize = function(str) {
	return apply(str, pluralRules);
};

Eg.String.singularize = function(str) {
	return apply(str, singularRules);
};

if (Em.EXTEND_PROTOTYPES === true || Em.EXTEND_PROTOTYPES.String) {
	String.prototype.pluralize = String.prototype.pluralize || function() {
		return Eg.String.pluralize(this);
	};

	String.prototype.singularize = String.prototype.singularize || function() {
		return Eg.String.singularize(this);
	};
}

})();

(function() {

Eg.debug = function(fn) {
	fn();
};

Eg.debug(function() {
	window.DEBUG_MODE = true;
});

Eg.debug.assert = function(message, test) {
	if (typeof message !== 'string') {
		test = message;
		message = 'Assertion failed.';
	}

	if (typeof test === 'function') {
		test = test();
	}

	if (!test) {
		throw new Error(message);
	}
};

Eg.debug.warn = function(message) {
	console.warn(message);
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
Eg.Serializer = Em.Object.extend({

	/**
	 * The application's container.
	 */
	container: null,

	/**
	 * The store that the records will be loaded into.
	 * This can be used for fetching models and their metadata.
	 */
	store: null,

	/**
	 * Converts a record to JSON for sending over the wire.
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
			json.id = record.get('id');
		}

		record.constructor.eachAttribute(function(name, meta) {
			var type = Eg.AttributeType.attributeTypeForName(meta.type);
			json[name] = type.serialize(record.get(name));
		}, this);

		if (Em.get(record.constructor, 'relationships').length > 0) {
			json.links = {};
		}

		record.constructor.eachRelationship(function(name, meta) {
			var val = record.get('_' + name);

			if (meta.kind === Eg.Model.HAS_MANY_KEY) {
				json.links[name] = val.filter(function(id) {
					return (!Eg.Model.isTemporaryId(id));
				});
			} else {
				if (val === null || Eg.Model.isTemporaryId(val)) {
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
	 * @param {Object} payload
	 * @param {Object} options Any options that were passed by the adapter
	 * @returns {Object} Normalized JSON Payload
	 */
	deserialize: function(payload, options) {
		var json = this._extract(payload);

		Em.keys(json).forEach(function(typeKey) {
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

			var typeKey = key.singularize();
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
				throw new Error('Your JSON was missing an ID.');
			}

			var model = this.get('store').modelForType(typeKey);
			var record = { id: json.id + '' };

			Eg.debug(function() {
				var attributes = Em.get(model, 'attributes');
				var givenAttributes = new Em.Set(Em.keys(json));
				givenAttributes.removeObjects(['id', 'links']);
				var extra = givenAttributes.withoutAll(attributes);

				if (extra.length > 0) {
					throw new Error('Your JSON contained extra attributes: ' + extra.toArray().join(','));
				}

				model.eachAttribute(function(name, meta) {
					if (!json.hasOwnProperty(name) && meta.isRequired) {
						throw new Error('Your JSON is missing the required `' + name + '` attribute.');
					}
				});
			});

			Em.keys(json).forEach(function(attribute) {
				if (attribute === 'id' || attribute === 'links') {
					return;
				}

				var meta = model.metaForAttribute(attribute);
				var type = Eg.AttributeType.attributeTypeForName(meta.type);
				record[attribute] = type.deserialize(json[attribute]);
			});

			Eg.debug(function() {
				var relationships = Em.get(model, 'relationships');
				var givenRelationships = new Em.Set(Em.keys(json.links));
				var extra = givenRelationships.withoutAll(relationships);

				if (extra.length > 0) {
					throw new Error('Your JSON contained extra relationships: ' + extra.toArray().join(','));
				}

				model.eachRelationship(function(name, meta) {
					if (!json.links.hasOwnProperty(name) && meta.isRequired) {
						throw new Error('Your JSON is missing the required `' + name + '` relationship.');
					}
				});
			});

			Em.keys(json.links).forEach(function(relationship) {
				var meta = model.metaForRelationship(relationship);

				if (meta.kind === Eg.Model.HAS_MANY_KEY) {
					record[relationship] = json.links[relationship].map(function(id) {
						return '' + id;
					});
				} else {
					record[relationship] = '' + json.links[relationship];
				}
			});

			return record;
		} catch (e) {
			Eg.debug.warn(e);
			return null;
		}
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
 * The JSON cannot contain any other keys. The value of each key will be the
 * records of that type that were returned by the server. The records must be
 * in normalized JSON form which means that they must contain an `id` field,
 * and they must contain the required attributes and relationships to
 * create a record of that type.
 *
 * Example:
 * {
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
	 * Should be overridden with a serializer instance. This class will
	 * proxy to the serializer for the serialize methods of this class.
	 */
	serializer: null,

	/**
	 * Observer method to set the store property on the serializer.
	 * @private
	 */
	_serializerDidChange: function() {
		var serializer = this.get('serializer');
		var container = this.get('container');

		if (serializer) {
			serializer.set('store', this.get('store'));
			serializer.set('container', container);
		}
	}.observes('serializer').on('init'),

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
	 * @param {String[]} ids The IDs of records of this type that the store already has
	 * @returns {Promise} A promise that resolves to normalized JSON
	 */
	findAll: function(typeKey, ids) {
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
	 * @param {String[]} ids The IDs of records of this type that the store already has
	 * @returns {Promise} A promise that resolves to normalized JSON
	 */
	findQuery: function(typeKey, query, ids) {
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
 * @class FixtureAdapter
 */
Eg.FixtureAdapter = Eg.Adapter.extend({
	// TODO: Refactor this into a base class called 'SynchronousAdapter'
	// Then make two subclasses, fixture and localStorage

	/**
	 * Gets a record from the appropriate fixtures array.
	 *
	 * @param {String} typeKey
	 * @param {String} id
	 * @return {Object}
	 * @private
	 */
	_getRecord: function(typeKey, id) {
		var model = this.get('store').modelForType(typeKey);
		model.FIXTURES = model.FIXTURES || [];

		for (var i = 0; i < model.FIXTURES.length; i+=1) {
			if (model.FIXTURES[i].id === id) {
				return model.FIXTURES[i];
			}
		}

		return null;
	},

	/**
	 * Gets all fixtures of the specified type.
	 *
	 * @param {String} typeKey
	 * @returns {Array}
	 * @private
	 */
	_getRecords: function(typeKey) {
		return this.get('store').modelForType(typeKey).FIXTURES || [];
	},

	/**
	 * Puts a record in the appropriate fixtures array.
	 *
	 * @param {String} typeKey
	 * @param {Object} json
	 * @private
	 */
	_setRecord: function(typeKey, json) {
		var model = this.get('store').modelForType(typeKey);
		model.FIXTURES = model.FIXTURES || [];

		for (var i = 0; i < model.FIXTURES.length; i+=1) {
			if (model.FIXTURES[i].id === json.id) {
				model.FIXTURES[i] = json;
				return;
			}
		}

		model.FIXTURES.push(json);
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
		record.set('id', Eg.util.generateGUID());
		var json = this.serialize(record);
		this._setRecord(record.typeKey, json);
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
		json[typeKey] = [this._getRecord(typeKey, id)].filter(removeEmpty);
		return Em.RSVP.Promise.resolve(json);
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
		json[typeKey] = ids.map(function(id) {
			return this._getRecord(typeKey, id);
		}, this).filter(removeEmpty);
		return Em.RSVP.Promise.resolve(json);
	},

	/**
	 * The same as find, only it should load all records of the given type.
	 * The promise can return any type of enumerable containing the records.
	 *
	 * @param {String} typeKey
	 * @param {String[]} ids The IDs of records of this type that the store already has
	 * @returns {Promise} A promise that resolves to normalized JSON
	 */
	findAll: function(typeKey, ids) {
		var json = {};
		json[typeKey] = this._getRecords(typeKey);
		return Em.RSVP.Promise.resolve(json);
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
	 * @param {String[]} ids The IDs of records of this type that the store already has
	 * @returns {Promise} A promise that resolves to normalized JSON
	 */
	findQuery: function(typeKey, query, ids) {
		throw new Error('The fixture adapter doesn\'t implement `findQuery`.');
	},

	/**
	 * Update the given record.
	 *
	 * @param {Model} record The model to save
	 * @returns {Promise} A promise that resolves to normalized JSON
	 */
	updateRecord: function(record) {
		var json = this.serialize(record);
		this._setRecord(record.typeKey, json);
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
	},

	/**
	 * Proxies to the serializer of this class.
	 */
	serialize: function(record, options) {
		var json = {};

		json.id = record.get('id');

		record.constructor.eachAttribute(function(name, meta) {
			json[name] = record.get(name);
		});

		record.constructor.eachRelationship(function(name, meta) {
			json[name] = record.get('_' + name);

			if (meta.kind === Eg.Model.HAS_MANY_KEY) {
				json[name] = json[name].toArray();
			}
		});

		return json;
	}
});

})();

(function() {

EG.RESTAdapter = EG.Adapter.extend();

})();

(function() {

/**
 * The store is used to manage all records in the application.
 * Ideally, there should only be one store for an application.
 *
 * @type {Store}
 */
Eg.Store = Em.Object.extend({

	/**
	 * The adapter to use if an application adapter is not found.
	 *
	 * @type {String}
	 */
	defaultAdapter: 'rest',

	/**
	 * The application's container.
	 */
	container: null,

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
	 *
	 * @type {Adapter}
	 * @private
	 */
	adapter: function() {
		var container = this.get('container');
		var adapter = container.lookup('adapter:application') ||
			 container.lookup('adapter:' + this.get('defaultAdapter'));

		Em.assert('A valid adapter could not be found.', EG.Adapter.detectInstance(adapter));

		return adapter;
	}.property(),

	/**
	 * Initializes all of the variables properly
	 */
	init: function() {
		this.set('_records', {});
		this.set('_types', {});
		this.set('_queuedRelationships', {});

		// TODO: This is bad. We need to fix it.
		EG.Relationship.deleteAllRelationships();
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
	 * Creates a new subclass of Model.
	 *
	 * @param {String} typeKey The name of the new type
	 * @param {String} [parentKey] The parent type, if inheriting from a custom type
	 * @param {Array} [mixins] The mixins to create the type with
	 * @param {Object} options The attributes and relationships of the type
	 * @returns {Model}
	 */
	createModel: function(typeKey, parentKey, mixins, options) {
		throw new Error('`createModel` is deprecated.');
	},

	/**
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
	 * If it contains no ID, the store assumes that it's new.
	 *
	 * @param {String} typeKey
	 * @param {Object} json
	 * @returns {Model}
	 */
	createRecord: function(typeKey, json) {
		json = json || {};

		var record = this.modelForType(typeKey)._create();
		record.set('store', this);
		record.set('id', Eg.Model.temporaryIdPrefix + Eg.util.generateGUID());

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
	 * @param {String} typeKey
	 * @returns {Array} Array of records of the given type
	 * @private
	 */
	_recordsForType: function(typeKey) {
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
	 * @param {String} typeKey
	 * @param {String|String[]|Object} options
	 * @returns {PromiseObject|PromiseArray}
	 */
	find: function(typeKey, options) {
		if (typeof options === 'string') {
			return this._findSingle(typeKey, options);
		} else if (Em.isArray(options)) {
			return this._findMany(typeKey, options);
		} else if (typeof options === 'object') {
			return this._findQuery(typeKey, options);
		} else {
			return this._findAll(typeKey);
		}
	},

	/**
	 * Returns the record directly if the record is cached in the store.
	 * Otherwise returns null.
	 *
	 * @param {String} typeKey
	 * @param {String} id
	 * @returns {Model}
	 * @private
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

		return Eg.PromiseObject.create({ promise: promise });
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

		return Eg.PromiseArray.create({ promise: promise });
	},

	/**
	 * Gets all of the records of a type from the adapter as a PromiseArray.
	 *
	 * @param {String} type
	 * @returns {PromiseArray}
	 * @private
	 */
	_findAll: function(type) {
		var ids = this._recordsForType(type).mapBy('id');
		var promise = this.get('adapter').findAll(type, ids).then(function(payload) {
			this.extractPayload(payload);
			return this._recordsForType(type);
		}.bind(this));

		return Eg.PromiseArray.create({ promise: promise });
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
		var currentIds = this._recordsForType(typeKey).mapBy('id');
		var promise = this.get('adapter').findQuery(typeKey, options, currentIds).then(function(payload) {
			var ids = payload.ids;
			delete payload.ids;
			this.extractPayload(payload);

			return ids.map(function(id) {
				return this.getRecord(typeKey, id);
			}, this);
		}.bind(this));

		return Eg.PromiseArray.create({ promise: promise });
	},

	/**
	 * Returns true if the record is cached in the store, false otherwise.
	 *
	 * @param {String|Model} type
	 * @param {String} id
	 * @returns {Boolean}
	 */
	hasRecord: function(type, id) {
		return this.getRecord(type, id) !== null;
	},

	/**
	 * @param {Model} record
	 * @returns {Promise} The saved record
	 */
	saveRecord: function(record) {
		var _this = this;
		var type = record.typeKey;
		var isNew = record.get('isNew');
		var tempId = record.get('id');

		record.set('isSaving', true);

		if (isNew) {
			return this.get('adapter').createRecord(record).then(function(payload) {
				record.set('id', payload.id);
				record.set('isSaving', false);
				delete payload.id;

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
	 * @param {Model} record
	 * @returns {Promise} Nothing on success, catch for error
	 */
	deleteRecord: function(record) {
		var type = record.typeKey;
		var id = record.get('id');
		var records = (this.get('_records.' + type) || {});

		record.set('isSaving', true);
		record.set('isDeleted', true);

		return this.get('adapter').deleteRecord(record).then(function(payload) {
			this.extractPayload(payload);
			record.set('isSaving', false);
			delete this.get('_records.' + type)[id];
		}.bind(this));
	},

	/**
	 * @param {Model} record
	 * @returns {Promise} The reloaded record
	 */
	reloadRecord: function(record) {
		Eg.debug.assert('You can\'t reload record `' + record.typeKey + ':' +
			record.get('id') + '` while it\'s dirty.', !record.get('isDirty'));
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
	 * @param {Object} payload Normalized JSON
	 */
	extractPayload: function(payload) {
		var reloadDirty = this.get('reloadDirty');

		Em.keys(payload).forEach(function(typeKey) {
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
	}
});


})();

(function() {

Eg.Store.reopen({

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
	 * @type {Boolean}
	 */
	overwriteClientAttributes: false,

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
	 * @private
	 */
	_hasQueuedRelationships: function(typeKey, id) {
		var queued = Eg.util.values(this.get('_queuedRelationships'));

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
	 * @private
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
		return Eg.util.values(this.get('_queuedRelationships')).filter(function(relationship) {
			return (relationship.get('type2') === typeKey && relationship.get('object2') === id);
		});
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

		var relationship = Eg.Relationship.create({
			object1: record1,
			relationship1: relationship1,
			object2: (record2 === null ? id2 : record2),
			relationship2: relationship2,
			state: state
		});

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
		var relationship = Eg.Relationship.getRelationship(id);
		if (Em.isNone(relationship)) {
			return;
		}

		var object1 = relationship.get('object1');
		var object2 = relationship.get('object2');

		object1._disconnectRelationship(relationship);
		if (object2 instanceof Eg.Model) {
			object2._disconnectRelationship(relationship);
		} else {
			delete this.get('_queuedRelationships')[id];
			this.notifyPropertyChange('_queuedRelationships');
		}

		Eg.Relationship.deleteRelationship(id);
	},

	_changeRelationshipState: function(id, state) {
		var relationship = Eg.Relationship.getRelationship(id);
		if (Em.isNone(relationship) || relationship.get('state') === state) {
			return;
		}

		var object1 = relationship.get('object1');
		var object2 = relationship.get('object2');

		var oldHash = Eg.Relationship.stateToHash(relationship.get('state'));
		var newHash = Eg.Relationship.stateToHash(state);

		relationship.set('state', state);

		object1.set(newHash + '.' + id, object1.get(oldHash + '.' + id));
		delete object1.get(oldHash)[id];
		object1.notifyPropertyChange(oldHash);
		object1.notifyPropertyChange(newHash);

		if (object2 instanceof Eg.Model) {
			object2.set(newHash + '.' + id, object2.get(oldHash + '.' + id));
			delete object2.get(oldHash)[id];
			object2.notifyPropertyChange(oldHash);
			object2.notifyPropertyChange(newHash);
		}
	}
});


})();

(function() {

/**
 * @class {PromiseObject}
 */
Eg.PromiseObject = Em.ObjectProxy.extend(Em.PromiseProxyMixin);

/**
 * @class {PromiseArray}
 */
Eg.PromiseArray = Em.ArrayProxy.extend(Em.PromiseProxyMixin);

})();

(function() {

var NEW_STATE = 'new';
var SAVED_STATE = 'saved';
var DELETED_STATE = 'deleted';

var nextRelationshipId = 0;
var allRelationships = {};

/**
 * A class used internally by Ember-Graph to keep the object-graph up-to-date.
 *
 * @class {Relationship}
 */
Eg.Relationship = Em.Object.extend({

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
	oneWay: function() {
		return this.get('relationship2') === null;
	}.property('relationship2'),

	/**
	 * Initializes the relationship with a unique ID.
	 */
	init: function() {
		this.set('id', nextRelationshipId + '');
		nextRelationshipId = nextRelationshipId + 1;
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
		Eg.debug.assert(record instanceof Eg.Model);

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
		Eg.debug.assert(record instanceof Eg.Model);

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
	}
});

Eg.Relationship.reopenClass({

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

		Eg.debug.assert('Possible state values are new, deleted or saved.',
			properties.state === NEW_STATE || properties.state === DELETED_STATE || properties.state === SAVED_STATE);
		Eg.debug.assert('The first object must always be a record.', properties.object1 instanceof Eg.Model);
		Eg.debug.assert('You must include a relationship name for the first object.',
			typeof properties.relationship1 === 'string');
		Eg.debug.assert('The second object must either be a record, or a permanent ID.',
			properties.object2 instanceof Eg.Model || (typeof properties.object2 === 'string' &&
			!Eg.String.startsWith(properties.object2, Eg.Model.temporaryIdPrefix)));
		Eg.debug.assert('You must include a relationship name for the second object.',
			typeof properties.relationship1 === 'string' || properties.relationship1 === null);
		relationship.setProperties(properties);

		relationship.set('type1', properties.object1.typeKey);

		if (properties.object2 instanceof Eg.Model) {
			relationship.set('type2', properties.object2.typeKey);
		} else {
			relationship.set('type2',
				properties.object1.constructor.metaForRelationship(properties.relationship1).relatedType);
		}

		allRelationships[relationship.get('id')] = relationship;

		return relationship;
	},

	/**
	 * @param {String} id
	 * @returns {Relationship|undefined}
	 */
	getRelationship: function(id) {
		return allRelationships[id];
	},

	/**
	 * Removes the relationship from the list of tracked relationships.
	 * Doesn't disconnect it from anything. Just removes the reference
	 * from this class so `getRelationship` will no longer find it.
	 *
	 * @param {String} id
	 */
	deleteRelationship: function(id) {
		delete allRelationships[id];
	},

	// TODO: These can't be static. This has to move to the store
	deleteAllRelationships: function() {
		allRelationships = {};
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
				Eg.debug.assert('The given state was invalid.');
				return '';
		}
	},

	/**
	 * Gets all relationships related to the given record.
	 *
	 * @param {String} typeKey
	 * @param {String} name
	 * @param {String} id
	 * @returns {Boolean}
	 */
	relationshipsForRecord: function(typeKey, name, id) {
		return Eg.util.values(allRelationships).filter(function(relationship) {
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
	}
});

})();

(function() {

/**
 * Specifies the details of a custom attribute type.
 *
 * @class {AttributeType}
 */
Eg.AttributeType = Em.Object.extend({

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

Eg.AttributeType.reopenClass({

	/**
	 * @type {Object.<String, AttributeType>}
	 */
	_types: {},

	registerAttributeType: function(name, type) {
		var instance = (type instanceof Eg.AttributeType ? type : type.create());
		Eg.debug.assert('', instance instanceof Eg.AttributeType);
		this._types[name] = instance;
	},

	attributeTypeForName: function(name) {
		Eg.debug.assert('The attribute type \'' + name + '\' doesn\'t exist.', !!this._types[name]);
		return this._types[name];
	}
});

})();

(function() {

/**
 * Will coerce any type to a boolean (`null` being the default). `null` is not a valid value.
 */
Eg.BooleanType = Eg.AttributeType.extend({

	/**
	 * The default value to use if a value of this type is missing.
	 */
	defaultValue: false,

	/**
	 * @param {*} obj Javascript object
	 * @returns {Object} JSON representation
	 */
	serialize: function(obj) {
		return !!obj;
	},

	/**
	 * @param {Object} json JSON representation of object
	 * @returns {*} Javascript object
	 */
	deserialize: function(json) {
		return !!json;
	},

	/**
	 * @param {*} obj Javascript object
	 * @returns {Boolean} Whether or not the object is a valid value for this type
	 */
	isValid: function(obj) {
		return (typeof obj === 'boolean');
	}
});

Eg.AttributeType.registerAttributeType('boolean', Eg.BooleanType);

})();

(function() {

/**
 * When serializing, will coerce to a timestamp. Numbers, dates and strings are are converted to dates,
 * then timestamps. Everything else serializes to null.
 *
 * When deserializing, numbers and strings are converted to dates, everything is is converted to null.
 */
Eg.DateType = Eg.AttributeType.extend({

	/**
	 * @param {*} obj Javascript object
	 * @returns {Object} JSON representation
	 */
	serialize: function(obj) {
		if (obj instanceof Date) {
			return obj.getTime();
		} else if (typeof obj === 'number') {
			return obj;
		} else if (typeof obj === 'string') {
			return new Date(obj).getTime();
		} else {
			return null;
		}
	},

	/**
	 * @param {Object} json JSON representation of object
	 * @returns {*} Javascript object
	 */
	deserialize: function(json) {
		if (typeof obj === 'number' || typeof obj === 'string') {
			return new Date(obj);
		} else {
			return null;
		}
	},

	/**
	 * @param {*} obj Javascript object
	 * @returns {Boolean} Whether or not the object is a valid value for this type
	 */
	isValid: function(obj) {
		return (obj === null || obj instanceof Date);
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

Eg.AttributeType.registerAttributeType('date', Eg.DateType);

})();

(function() {

/**
 * Will coerce any type to a number (0 being the default). `null` is not a valid value.
 */
Eg.NumberType = Eg.AttributeType.extend({

	/**
	 * The default value to use if a value of this type is missing.
	 */
	defaultValue: 0,

	/**
	 * @param {*} obj Javascript object
	 * @returns {Object} JSON representation
	 */
	serialize: function(obj) {
		return Number(obj) || 0;
	},

	/**
	 * @param {Object} json JSON representation of object
	 * @returns {*} Javascript object
	 */
	deserialize: function(json) {
		return Number(json) || 0;
	},

	/**
	 * @param {*} obj Javascript object
	 * @returns {Boolean} Whether or not the object is a valid value for this type
	 */
	isValid: function(obj) {
		return (typeof obj === 'number');
	}
});

Eg.AttributeType.registerAttributeType('number', Eg.NumberType);

})();

(function() {

Eg.StringType = Eg.AttributeType.extend({

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
		return (obj === null || typeof obj === 'string');
	}
});

Eg.AttributeType.registerAttributeType('string', Eg.StringType);

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
Eg.ObjectType = Eg.AttributeType.extend({

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

Eg.AttributeType.registerAttributeType('object', Eg.ObjectType);

})();

(function() {

/**
 * Will coerce any value to a JSON array (`null` is a valid value).
 * Ember enumerables are converted to arrays using `toArray()`
 */
Eg.ArrayType = Eg.AttributeType.extend({

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
		if (!Em.isArray(a) || !Em.isArray(b)) {
			return false;
		}

		return Em.compare(a.toArray(), b.toArray()) === 0;
	}
});

Eg.AttributeType.registerAttributeType('array', Eg.ArrayType);

})();

(function() {

/**
 * Models act as classes for data. The model class should be
 * extended for each type of object that your object model
 * contains.
 *
 * @class {Model}
 */
Eg.Model = Em.Object.extend({

	/**
	 * Should be overridden in all subclasses with a name for this
	 * particular class. The name should be a unique string that
	 * will be referenced throughout the application. Refrain from
	 * special characters. Stick with lowercase letters.
	 *
	 * @type {String}
	 */
	typeKey: null,

	/**
	 * @type {String}
	 */
	_id: null,

	/**
	 * The ID of the record. The ID can only be changed once, and only if
	 * it's being changed from a temporary ID to a permanent one. Only the
	 * store should change the ID from a temporary one to a permanent one.
	 *
	 * @type {String}
	 */
	id: function(key, value) {
		var id = this.get('_id');

		if (arguments.length > 1) {
			var prefix = this.constructor.temporaryIdPrefix;

			if (id === null) {
				this.set('_id', value);
				return value;
			} else if (Eg.String.startsWith(id, prefix) && !Eg.String.startsWith(value, prefix)) {
				this.set('_id', value);
				return value;
			} else {
				throw new Error('Cannot change the \'id\' property of a model.');
			}
		}

		return id;
	}.property('_id'),

	/**
	 * @type {Object}
	 */
	store: null,

	/**
	 * Denotes that a record has been deleted. If `isDirty` is also true,
	 * the change hasn't been persisted to the server yet.
	 *
	 * @type {Boolean}
	 */
	isDeleted: null,

	/**
	 * Denotes that the record is currently saving its changes
	 * to the server, but the server hasn't responded yet.
	 *
	 * @type {Boolean}
	 */
	isSaving: null,

	/**
	 * Denotes that the record is being reloaded from the server,
	 * and will likely change when the server responds.
	 *
	 * @type {Boolean}
	 */
	isReloading: null,

	/**
	 * Denotes that a record has been loaded into a store and isn't freestanding.
	 *
	 * @type {Boolean}
	 */
	isLoaded: function() {
		return this.get('store') !== null;
	}.property('store'),

	/**
	 * Denotes that the record has changes that have not been saved to the server yet.
	 *
	 * @type {Boolean}
	 */
	isDirty: function() {
		var isDeleted = this.get('isDeleted');
		var isSaving = this.get('isSaving');

		if (isDeleted && !isSaving) {
			return false;
		}

		var deleting = isDeleted && isSaving;
		return this.get('_areAttributesDirty') || this.get('_areRelationshipsDirty') || deleting;
	}.property('_areAttributesDirty', '_areRelationshipsDirty', 'isDeleted', 'isSaving'),

	/**
	 * Denotes that a record has just been created and has not been saved to
	 * the server yet. Most likely has a temporary ID if this is true.
	 *
	 * @type {Boolean}
	 */
	isNew: function() {
		return Eg.String.startsWith(this.get('_id'), this.constructor.temporaryIdPrefix);
	}.property('_id'),

	/**
	 * Sets up the instance variables of this class.
	 */
	init: function() {
		this.set('_id', null);
		this.set('store', null);

		this.set('_serverAttributes', {});
		this.set('_clientAttributes', {});

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
		Eg.debug.assert('The record `' + this.typeKey + ':' + this.get('id') + '` was attempted to be reloaded ' +
			'while dirty with `reloadDirty` disabled.', !this.get('isDirty') || this.get('store.reloadDirty'));

		this._loadAttributes(json);
		this._loadRelationships(json);
	},

	/**
	 * Proxies the store's save method for convenience.
	 */
	save: function() {
		return this.get('store').saveRecord(this);
	},

	/**
	 * Proxies the store's reload method for convenience.
	 */
	reload: function() {
		return this.get('store').reloadRecord(this);
	},

	/**
	 * Proxies the store's delete method for convenience.
	 */
	destroy: function() {
		return this.get('store').deleteRecord(this);
	}
});

Eg.Model.reopenClass({

	/**
	 * The prefix added to generated IDs to show that the prefix wasn't given
	 * by the server and is only temporary until the real one comes in.
	 *
	 * @type {String}
	 * @constant
	 * @static
	 */
	temporaryIdPrefix: 'EG_TEMP_ID_',

	/**
	 * @returns {Boolean}
	 */
	isTemporaryId: function(id) {
		return Eg.String.startsWith(id, this.temporaryIdPrefix);
	},

	create: function() {
		Eg.debug.assert('You can\'t create a record directly. Use the store.');
	},

	_create: Eg.Model.create,

	extend: function() {
		var args = Array.prototype.slice.call(arguments, 0);
		var options = args.pop() || {};
		var relationships = {};

		if (!(options instanceof Em.Mixin)) {
			Em.keys(options).forEach(function(key) {
				var value = options[key];

				if (options[key] && options[key].isRelationship) {
					relationships[key] = value;
					delete options[key];
				}
			});
		}

		args.push(options);

		var subclass = this._super.apply(this, args);
		subclass._declareRelationships(relationships);
		return subclass;
	}
});



})();

(function() {

var disallowedAttributeNames = new Em.Set(['id', 'type', 'content']);

/**
 * Possible options:
 * type: Type of the attribute. Required.
 * isRequired: Whether or not the property can be omitted from the server. Defaults to false. Uses defaultValue.
 * defaultValue: Value if not present when created. If omitted, uses the default value for the property type.
 * isEqual: Function to compare two instances of the property. Defaults to using the type comparison function.
 * readOnly: True if the attribute should be immutable. Defaults to false.
 * isValid: A function that returns whether the value is valid or not. Defaults to using the type validity function.
 *
 * @param options
 * @returns {Em.ComputedProperty}
 */
Eg.attr = function(options) {
	var typeTransform = Eg.AttributeType.attributeTypeForName(options.type);

	var meta = {
		isAttribute: true,
		type: options.type,
		typeTransform: typeTransform,
		isRequired: options.hasOwnProperty('isRequired') ? options.isRequired : !options.hasOwnProperty('defaultValue'),
		defaultValue: options.defaultValue || typeTransform.get('defaultValue'),
		isEqual: options.isEqual || typeTransform.isEqual,
		readOnly: options.readOnly === true,
		isValid: options.isValid || typeTransform.isValid
	};

	var attribute = function(key, value) {
		var server = this.get('_serverAttributes.' + key);
		var client = this.get('_clientAttributes.' + key);
		var current = (client === undefined ? server : client);

		Eg.debug(function() {
			if (arguments.length > 1 && value === undefined) {
				Eg.debug.warn('`undefined` is not a valid property value.');
			}
		});

		if (value !== undefined) {
			if (!meta.isValid(value)) {
				Eg.debug.warn('The value \'' + value + '\' wasn\'t valid for the \'' + key + '\' property.');
				return current;
			}

			if (meta.isEqual(server, value)) {
				delete this.get('_clientAttributes')[key];
				this.notifyPropertyChange('_clientAttributes');
				return server;
			} else {
				this.set('_clientAttributes.' + key, value);
				this.notifyPropertyChange('_clientAttributes');
				return value;
			}
		}

		return current;
	}.property('_clientAttributes', '_serverAttributes').meta(meta);

	return (options.readOnly ? attribute.readOnly() : attribute);
};

/**
 * @class Model
 */
Eg.Model.reopenClass({

	/**
	 * @static
	 * @type {Set}
	 */
	attributes: function() {
		var attributes = new Em.Set();

		this.eachComputedProperty(function(name, meta) {
			if (meta.isAttribute) {
				Eg.debug.assert('The ' + name + ' cannot be used as an attribute name.',
					!disallowedAttributeNames.contains(name));

				attributes.addObject(name);
			}
		});

		return attributes;
	}.property(),

	/**
	 * Just a more semantic alias for `metaForProperty`
	 * @alias metaForProperty
	 */
	metaForAttribute: Em.aliasMethod('metaForProperty'),

	/**
	 * @param name Name of property
	 * @returns {Boolean} True if attribute, false otherwise
	 * @static
	 */
	isAttribute: function(name) {
		return Em.get(this, 'attributes').contains(name);
	},

	/**
	 * Calls the callback for each attribute defined on the model.
	 *
	 * @param {Function} callback Function that takes `name` and `meta` parameters
	 * @param {*} [binding] Object to use as `this`
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

Eg.Model.reopen({

	/**
	 * Represents the latest set of properties from the server. The only way these
	 * can be updated is if the server sends over new JSON through an operation,
	 * or a save operation successfully completes, in which case `_clientAttributes`
	 * will be copied into this.
	 *
	 * @private
	 */
	_serverAttributes: null,

	/**
	 * Represents the state of the object on the client. These are likely different
	 * from what the server has and are completely temporary until saved.
	 *
	 * @private
	 */
	_clientAttributes: null,

	/**
	 * Watches the client side attributes for changes and detects if there are
	 * any dirty attributes based on how many client attributes differ from
	 * the server attributes.
	 */
	_areAttributesDirty: function() {
		return Em.keys(this.get('_clientAttributes') || {}).length > 0;
	}.property('_clientAttributes'),

	/**
	 * @returns {Object} Keys are attribute names, values are arrays with [oldVal, newVal]
	 */
	changedAttributes: function() {
		var diff = {};

		this.constructor.eachAttribute(function(name, meta) {
			var server = this.get('_serverAttributes.' + name);
			var client = this.get('_clientAttributes.' + name);

			if (client === undefined) {
				return;
			}

			diff[name] = [server, client];
		}, this);

		return diff;
	},

	/**
	 * Resets all attribute changes to last known server attributes.
	 */
	rollbackAttributes: function() {
		this.set('_clientAttributes', {});
	},

	/**
	 * Loads attributes from the server.
	 *
	 * @param {Object} json The JSON with properties to load
	 * @private
	 */
	_loadAttributes: function(json) {
		this.constructor.eachAttribute(function(name, meta) {
			Eg.debug.assert('Your JSON is missing the \'' + name + '\' property.',
				!meta.isRequired || json.hasOwnProperty(name));

			var value = (json.hasOwnProperty(name) ? json[name] : meta.defaultValue);

			// TODO: Do we want a way to accept non-valid value from the server?
			if (meta.isValid(value)) {
				this.set('_serverAttributes.' + name, value);
			} else {
				Eg.debug.assert('Your value for the \'' + name + '\' property is inValid.');
				this.set('_serverAttributes.' + name, meta.defaultValue);
			}
		}, this);

		this.notifyPropertyChange('_serverAttributes');
	}
});

})();

(function() {

var BELONGS_TO_KEY = Eg.Model.BELONGS_TO_KEY = 'belongsTo';
var HAS_MANY_KEY = Eg.Model.HAS_MANY_KEY = 'hasMany';

var NEW_STATE = Eg.Relationship.NEW_STATE;
var SAVED_STATE = Eg.Relationship.SAVED_STATE;
var DELETED_STATE = Eg.Relationship.DELETED_STATE;

var disallowedRelationshipNames = new Em.Set(['id', 'type', 'content']);

Eg.hasMany = function(options) {
	return {
		isRelationship: true,
		kind: HAS_MANY_KEY,
		options: options
	};
};

Eg.belongsTo = function(options) {
	return {
		isRelationship: true,
		kind: BELONGS_TO_KEY,
		options: options
	};
};

var createRelationship = function(kind, options) {
	Eg.debug.assert('Your relationship must specify a relatedType.', typeof options.relatedType === 'string');
	Eg.debug.assert('Your relationship must specify an inverse relationship.',
		options.inverse === null || typeof options.inverse === 'string');

	var meta = {
		isRelationship: false,
		kind: kind,
		isRequired: options.isRequired !== false,
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
			return this._belongsToValue(key.substring(1));
		};
	}

	// TODO: We can't rely on prototype extension, so no .property
	return relationship.property('_serverRelationships', '_clientRelationships').meta(meta).readOnly();
};

Eg.Model.reopenClass({

	/**
	 * Goes through the subclass and declares an additional property for
	 * each relationship. The properties will be capitalized and then prefixed
	 * with 'loaded'. So rather than 'projects', use 'loadedProjects'.
	 * This will return the relationship as a promise rather than in ID form.
	 *
	 * @static
	 * @private
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
					return this.get('store').find(relatedType, this.get('_' + name));
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
	 * @static
	 */
	relationships: function() {
		var relationships = new Em.Set();

		this.eachComputedProperty(function(name, meta) {
			if (meta.isRelationship) {
				Eg.debug.assert('The ' + name + ' cannot be used as a relationship name.',
					!disallowedRelationshipNames.contains(name));
				Eg.debug.assert('Relationship names must start with a lowercase letter.', name[0].match(/[a-z]/g));

				relationships.addObject(name);
			}
		});

		return relationships;
	}.property(),

	/**
	 * Just a more semantic alias for `metaForProperty`
	 * @alias metaForProperty
	 * @static
	 */
	metaForRelationship: Em.aliasMethod('metaForProperty'),

	/**
	 * @param name The name of the relationships
	 * @returns {String} HAS_MANY_KEY or BELONGS_TO_KEY
	 * @static
	 */
	relationshipKind: function(name) {
		return this.metaForRelationship(name).kind;
	},

	/**
	 * Calls the callback for each relationship defined on the model.
	 *
	 * @param {Function} callback Function that takes `name` and `meta` parameters
	 * @param {*} [binding] Object to use as `this`
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

Eg.Model.reopen({

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
	 * Determines the value of a belongsTo relationship, either the
	 * original value sent from the server, or the current client value.
	 *
	 * @param {String} relationship
	 * @param {Boolean} server True for original value, false for client value
	 * @returns {String}
	 * @private
	 */
	_belongsToValue: function(relationship, server) {
		var serverRelationships = Eg.util.values(this.get('_serverRelationships'));
		var otherRelationships = Eg.util.values(this.get((server ? '_deleted' : '_client') + 'Relationships'));
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
		var serverRelationships = Eg.util.values(this.get('_serverRelationships'));
		var otherRelationships = Eg.util.values(this.get((server ? '_deleted' : '_client') + 'Relationships'));
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
	_areRelationshipsDirty: function() {
		var client = Em.keys(this.get('_clientRelationships')).length > 0;
		var deleted = Em.keys(this.get('_deletedRelationships')).length > 0;

		return client || deleted;
	}.property('_clientRelationships', '_deletedRelationships'),

	/**
	 * Gets all relationships currently linked to this record.
	 *
	 * @returns {Relationship[]}
	 * @private
	 */
	_getAllRelationships: function() {
		var server = Eg.util.values(this.get('_serverRelationships'));
		var client = Eg.util.values(this.get('_clientRelationships'));
		var deleted = Eg.util.values(this.get('_deletedRelationships'));

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
		var store = this.get('store');
		var sideWithClient = store.get('sideWithClientOnConflict');

		this.constructor.eachRelationship(function(name, meta) {
			if (meta.isRequired && !json.hasOwnProperty(name)) {
				throw new Error('You left out the required \'' + name + '\' relationship.');
			}

			var value = json[name] || meta.defaultValue;

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
					var conflict = this._belongsToConflict(name, id);
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
				Eg.debug.assert('An unknown relationship error occurred.', client.length <= 1);

				var conflict = this._belongsToConflict(name, value);

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
	 * a conflict on the other side of the relationship with a belongsTo
	 * relationship. If there is a conflict on the other record, this will
	 * return the relationship that is in conflict.
	 *
	 * @param {String} relationship Relationship on this side that goes to the other record
	 * @param {String} id ID of the other record
	 * @returns {Relationship}
	 * @private
	 */
	_belongsToConflict: function(relationship, id) {
		if (id === null) {
			return null;
		}

		var meta = this.constructor.metaForRelationship(relationship);
		if (meta.inverse === null) {
			return null;
		}

		var model = this.get('store').modelForType(meta.relatedType);
		var otherMeta = model.metaForRelationship(meta.inverse);
		if (otherMeta.kind !== BELONGS_TO_KEY) {
			return null;
		}

		// We need to detect unloaded records too
		var record = this.get('store').getRecord(meta.relatedType, id);
		if (record) {
			var current = record._belongsToValue(meta.inverse);
			if (current === null || current === this.get('id')) {
				return null;
			}

			return record._findLinkTo(meta.inverse, current);
		} else {
			var relationships = Eg.Relationship.relationshipsForRecord(meta.relatedType, meta.inverse, id);
			if (relationships.length === 0) {
				return null;
			}

			// It's a belongsTo, so relationships can only have one NEW or SAVED relationship
			relationships = relationships.filter(function(relationship) {
				 var state = relationship.get('state');
				return (state === SAVED_STATE || state === NEW_STATE);
			});

			Eg.debug.assert('An unknown relationship error occurred', relationships.length <= 1);

			return (relationships.length > 0 ? relationships[0] : null);
		}
	},

	/**
	 * @returns {Object} Keys are relationship names, values are arrays with [oldVal, newVal]
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
				oldVal = this._belongsToValue(name, true);
				newVal = this._belongsToValue(name, false);

				if (oldVal !== newVal) {
					changed[name] = [oldVal, newVal];
				}
			}
		}, this);

		return changed;
	},

	/**
	 * Resets all relationship changes to last known server relationships.
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
	 * @param {String} relationship The relationship to modify
	 * @param {String} id The ID to add to the relationship
	 */
	addToRelationship: function(relationship, id) {
		var store = this.get('store');
		var meta = this.constructor.metaForRelationship(relationship);
		Eg.debug.assert('Cannot modify a read-only relationship', meta.readOnly === false);
		if (meta.readOnly) {
			return;
		}

		var link = this._findLinkTo(relationship, id);
		if (link && (link.get('state') === NEW_STATE || link.get('state') === SAVED_STATE)) {
			return;
		}

		if (link && link.get('state') === DELETED_STATE) {
			this.get('store')._changeRelationshipState(link.get('id'), SAVED_STATE);
			return;
		}

		var conflict = this._belongsToConflict(relationship, id);
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

		store._createRelationship(this.typeKey, relationship,
			this.get('id'), meta.relatedType, meta.inverse, id, NEW_STATE);
	},

	/**
	 * A convenience method to remove an item from a hasMany relationship. This will
	 * ensure that all of the proper observers are notified of the change.
	 *
	 * @param {String} relationship The relationship to modify
	 * @param {String} id The ID to add to the relationship
	 */
	removeFromRelationship: function(relationship, id) {
		var meta = this.constructor.metaForRelationship(relationship);
		Eg.debug.assert('Cannot modify a read-only relationship', meta.readOnly === false);
		if (meta.readOnly) {
			return;
		}

		var r = this._findLinkTo(relationship, id);

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
	 * Sets the value of a belongsTo relationship to the given ID.
	 *
	 * @param {String} relationship
	 * @param {String} id
	 */
	setBelongsTo: function(relationship, id) {
		var meta = this.constructor.metaForRelationship(relationship);
		Eg.debug.assert('Cannot modify a read-only relationship', meta.readOnly === false);
		if (meta.readOnly) {
			return;
		}

		var link = this._findLinkTo(relationship, id);
		if (link && (link.get('state') === NEW_STATE || link.get('state') === SAVED_STATE)) {
			return;
		}

		if (link && link.get('state') === DELETED_STATE) {
			this.get('store')._changeRelationshipState(link.get('id'), SAVED_STATE);
			return;
		}

		this.clearBelongsTo(relationship);

		if (id === null) {
			return;
		}

		if (id === null) {
			this.clearBelongsTo(relationship);
			return;
		}

		var store = this.get('store');
		var conflict = this._belongsToConflict(relationship, id);
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

		store._createRelationship(this.typeKey, relationship,
			this.get('id'), meta.relatedType, meta.inverse, id, NEW_STATE);
	},

	/**
	 * Sets the value of a belongsTo relationship to `null`.
	 * @param {String} relationship
	 */
	clearBelongsTo: function(relationship) {
		var meta = this.constructor.metaForRelationship(relationship);
		Eg.debug.assert('Cannot modify a read-only relationship', meta.readOnly === false);
		if (meta.readOnly) {
			return;
		}

		var current = this._belongsToValue(relationship);

		if (current !== null) {
			var r = this._findLinkTo(relationship, current);

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
	 * @private
	 */
	_connectRelationship: function(relationship) {
		var hash = Eg.Relationship.stateToHash(relationship.get('state'));
		this.set(hash + '.' + relationship.get('id'), relationship);
		this.notifyPropertyChange(hash);
	},

	/**
	 * Disconnects the relationship from this record.
	 * Relies on the relationship state to find the relationship.
	 *
	 * @param {Relationship} relationship
	 * @private
	 */
	_disconnectRelationship: function(relationship) {
		var hash = Eg.Relationship.stateToHash(relationship.get('state'));
		delete this.get(hash)[relationship.get('id')];
		this.notifyPropertyChange(hash);
	}
});

})();