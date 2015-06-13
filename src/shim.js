import EmberGraph from 'ember-graph';

// Data Adapter
import DataAdapter from 'ember-graph/util/data_adapter';
EmberGraph.DataAdapter = DataAdapter;

// Array polyfills
import {
	some,
	reduce,
	mapBy
} from 'ember-graph/util/array';
EmberGraph.ArrayPolyfills = {
	some: some,
	reduce: reduce,
	mapBy: mapBy
};

// EmberGraph namespace methods
import {
	abstractMethod,
	abstractProperty,
	generateUUID,
	arrayContentsEqual,
	groupRecords,
	values,
	deprecateMethod,
	deprecateProperty
} from 'ember-graph/util/util';
EmberGraph.abstractMethod = abstractMethod;
EmberGraph.abstractProperty = abstractProperty;
EmberGraph.generateUUID = generateUUID;
EmberGraph.arrayContentsEqual = arrayContentsEqual;
EmberGraph.groupRecords = groupRecords;
EmberGraph.values = values;
EmberGraph.deprecateMethod = deprecateMethod;
EmberGraph.deprecateProperty = deprecateProperty;

import {
	attr,
	hasOne,
	hasMany
} from 'ember-graph/model/schema';
EmberGraph.attr = attr;
EmberGraph.hasOne = hasOne;
EmberGraph.hasMany = hasMany;

// Set
import EmberGraphSet from 'ember-graph/util/set';
EmberGraph.Set = EmberGraphSet;

// String polyfills
import {
	startsWith,
	endsWith,
	capitalize,
	decapitalize
} from 'ember-graph/util/string';
import {
	pluralize,
	singularize
} from 'ember-graph/util/inflector';
EmberGraph.String = {
	startsWith: startsWith,
	endsWith: endsWith,
	capitalize: capitalize,
	decapitalize: decapitalize,
	pluralize: pluralize,
	singularize: singularize
};

// Promise proxy objects
import {
	PromiseObject,
	PromiseArray,
	ModelPromiseObject
} from 'ember-graph/data/promise_object';
EmberGraph.PromiseObject = PromiseObject;
EmberGraph.PromiseArray = PromiseArray;
EmberGraph.ModelPromiseObject = ModelPromiseObject;

// Serializers
import Serializer from 'ember-graph/serializer/serializer';
EmberGraph.Serializer = Serializer;
import JSONSerializer from 'ember-graph/serializer/json';
EmberGraph.JSONSerializer = JSONSerializer;
import EmberGraphSerializer from 'ember-graph/serializer/ember_graph';
EmberGraph.EmberGraphSerializer = EmberGraphSerializer;

// Adapters
import Adapter from 'ember-graph/adapter/adapter';
EmberGraph.Adapter = Adapter;
import EmberGraphAdapter from 'ember-graph/adapter/ember_graph/adapter';
EmberGraph.EmberGraphAdapter = EmberGraphAdapter;
import LocalStorageAdapter from 'ember-graph/adapter/local_storage';
EmberGraph.LocalStorageAdapter = LocalStorageAdapter;
import MemoryAdapter from 'ember-graph/adapter/memory';
EmberGraph.MemoryAdapter = MemoryAdapter;
import RESTAdapter from 'ember-graph/adapter/rest';
EmberGraph.RESTAdapter = RESTAdapter;

// Store
import Store from 'ember-graph/store/store';
EmberGraph.Store = Store;

// Attribute Types
import AttributeType from 'ember-graph/attribute_type/type';
EmberGraph.AttributeType = AttributeType;
import ArrayType from 'ember-graph/attribute_type/array';
EmberGraph.ArrayType = ArrayType;
import BooleanType from 'ember-graph/attribute_type/boolean';
EmberGraph.BooleanType = BooleanType;
import DateType from 'ember-graph/attribute_type/date';
EmberGraph.DateType = DateType;
import EnumType from 'ember-graph/attribute_type/enum';
EmberGraph.EnumType = EnumType;
import NumberType from 'ember-graph/attribute_type/number';
EmberGraph.NumberType = NumberType;
import ObjectType from 'ember-graph/attribute_type/object';
EmberGraph.ObjectType = ObjectType;
import StringType from 'ember-graph/attribute_type/string';
EmberGraph.StringType = StringType;

// Model
import Model from 'ember-graph/model/model';
EmberGraph.Model = Model;

// Testing shims
import Relationship from 'ember-graph/relationship/relationship';
EmberGraph.Relationship = Relationship;
import RelationshipStore from 'ember-graph/relationship/relationship_store';
EmberGraph.RelationshipStore = RelationshipStore;
import RecordCache from 'ember-graph/store/record_cache';
EmberGraph.RecordCache = RecordCache;
import RecordRequestCache from 'ember-graph/store/record_request_cache';
EmberGraph.RecordRequestCache = RecordRequestCache;

// Inflector
import {
	overridePluralRule,
	overrideSingularRule
} from 'ember-graph/util/inflector';
EmberGraph.Inflector = { singularize, pluralize, overridePluralRule, overrideSingularRule };