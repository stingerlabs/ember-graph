import Ember from 'ember';
import Model from 'ember-graph/model/model';

/**
 * Declares an attribute on a model. The options determine the type and behavior
 * of the attributes. Bold options are required:
 *
 * - **`type`**: The type of the attribute. `string`, `boolean`, `number`, `date`, `array`
 * and `object` are the built in types. New types can be declared by extending `AttributeType`.
 * - `defaultValue`: The value that gets used if the attribute is missing from the loaded data.
 * This can be a function if the value needs to be computed or you need to return different
 * instances of an object each time.
 * If omitted, the attribute is required and will error if missing.
 * - `readOnly`: Set to `true` to make the attribute read-only (except for new records). Defaults to `false`.
 * - `isEqual`: Function that will compare two different instances of the attribute. Should take
 * two arguments and return `true` if the given attributes are equal. Defaults to the function
 * declared in the `AttributeType` subclass. **deprecated**
 * - `serverOnly`: This marks the attribute as a server-only attribute. This can be used when
 * an attribute is required for the model, but cannot be created on the client side. Ember-Graph
 * will allow the attribute to remain uninitialized until the record is persisted to the server.
 * This automatically makes the attribute read only.
 *
 * The option values are all available as property metadata, as well the `isAttribute` property
 * which is always `true`, and the `isRequired` property. However, the `defaultValue` property
 * should not be used directly; use the `getDefaultValue()` method instead.
 *
 * Like other Ember properties, `undefined` is _not_ a valid attribute value.
 *
 * As a shorthand, the `options` parameter may be a single string type. So this
 *
 * ```js
 * EmberGraph.attr({
 *     type: 'string'
 * })
 * ```
 *
 * can be turned into this
 *
 * ```js
 * EmberGraph.attr('string')
 * ```
 *
 * @method attr
 * @param {Object} options
 * @return {Object} Property descriptor used by model during initialization
 * @namespace EmberGraph
 */
var attr = function(options) {
	let optionsObject = options;

	if (Ember.typeOf(optionsObject) === 'string') {
		optionsObject = { type: optionsObject };
	}

	Ember.deprecate('The `isEqual` method on attributes is deprecated. ' +
			'Please use a custom attribute type instead.', !optionsObject.isEqual);

	return {
		isAttribute: true,
		options: optionsObject
	};
};

/**
 * Declares a *-to-many relationship on a model. The options determine
 * the type and behavior of the relationship. Bold options are required:
 *
 * - **`relatedType`**: The type of the related models.
 * - **`inverse`**: The relationship on the related models that reciprocates this relationship.
 * - `isRequired`: `false` if the relationship can be left out of the JSON. Defaults to `true`.
 * - `defaultValue`: The value that gets used if the relationship is missing from the loaded data.
 * The default is an empty array. This can be a function if the value needs to be computed or
 * you need to return different instances of an object each time.
 * - `readOnly`: Set to `true` to make the relationship read-only (except for new records). Defaults to `false`.
 * - `serverOnly`: This marks the relationship as a server-only relationship. This can be used when
 * a relationship is required for the model, but cannot be created on the client side. Ember-Graph
 * will allow the relationship to remain uninitialized until the record is persisted to the server.
 * This automatically makes the relationship read only.
 *
 * The option values are all available as property metadata, as well the `isRelationship` property
 * which is always `true`, and the `kind` property which is always `hasMany`. However, the
 * `defaultValue` property should not be used directly; use the `getDefaultValue()` method instead.
 *
 * @method hasMany
 * @param {Object} options
 * @return {Object} Property descriptor used by model during initialization
 * @namespace EmberGraph
 */
var hasMany = function(options) {
	return {
		isRelationship: true,
		kind: Model.HAS_MANY_KEY,
		options: options
	};
};

/**
 * Declares a *-to-one relationship on a model. The options determine
 * the type and behavior of the relationship. Bold options are required:
 *
 * - **`relatedType`**: The type of the related models.
 * - **`inverse`**: The relationship on the related model that reciprocates this relationship.
 * - `isRequired`: `false` if the relationship can be left out of the JSON. Defaults to `true`.
 * - `defaultValue`: The value that gets used if the relationship is missing from the loaded data.
 * The default is `null`. This can be a function if the value needs to be computed or you need
 * to return different instances of an object each time.
 * - `readOnly`: Set to `true` to make the relationship read-only (except for new records). Defaults to `false`.
 * - `serverOnly`: This marks the relationship as a server-only relationship. This can be used when
 * a relationship is required for the model, but cannot be created on the client side. Ember-Graph
 * will allow the relationship to remain uninitialized until the record is persisted to the server.
 * This automatically makes the relationship read only.
 *
 * The option values are all available as property metadata, as well the `isRelationship` property
 * which is always `true`, and the `kind` property which is always `hasOne`. However, the
 * `defaultValue` property should not be used directly; use the `getDefaultValue()` method instead.
 *
 * @method hasOne
 * @param {Object} options
 * @return {Object} Property descriptor used by model during initialization
 * @namespace EmberGraph
 */
var hasOne = function(options) {
	return {
		isRelationship: true,
		kind: Model.HAS_ONE_KEY,
		options: options
	};
};

export {
	attr,
	hasMany,
	hasOne
};