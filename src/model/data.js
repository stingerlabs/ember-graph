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
 * @param {Object} options
 * @return {Ember.ComputedProperty}
 */
EG.hasMany = function(options) {
	return {
		isRelationship: true,
		kind: HAS_MANY_KEY,
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
 * @param {Object} options
 * @return {Ember.ComputedProperty}
 */
EG.hasOne = function(options) {
	return {
		isRelationship: true,
		kind: HAS_ONE_KEY,
		options: options
	};
};
