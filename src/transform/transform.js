Eg.Transform = Em.Object.extend({
	/**
	 * @param obj Javascript object
	 * @returns JSON representation
	 * @method serialize
	 * @static
	 */
	serialize: Em.required(),

	/**
	 * @param json JSON representation of object
	 * @returns Javascript object
	 * @method deserialize
	 * @static
	 */
	deserialize: Em.required()
});

Eg._typeTransformations = {};

/**
 * Inform Ember-Graph about a type transform to be used when (de)serializing.
 * This will override an old transform if a transform with the same name is given.
 *
 * @param {String} typeName The name of the type
 * @param {Eg.Transform} transform A subclass of Eg.Transform
 */
Eg.registerTypeTransform = function(typeName, transform) {
	var instance = transform.create();

	if (!(instance instanceof Eg.Transform)) {
		throw new Error('Transform must be a subclass of `Eg.Transform`.');
	}

	Eg._typeTransformations[typeName] = transform;
};

Eg.typeTransformFor = function(typeName) {
	Eg.debug.assert('There is no type transform for the \'' + typeName + '\' type.',
		Eg._typeTransformations[typeName] instanceof Eg.Transform);

	return Eg._typeTransformations[typeName];
};