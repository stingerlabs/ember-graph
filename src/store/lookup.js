import Ember from 'ember';

import { deprecateMethod } from 'ember-graph/util/util';

export default {

	/**
	 * Stores the models used so far. This not ony caches them so we don't
	 * have to hit the container, but it also let's use know that the
	 * typeKey has been property injected into them.
	 *
	 * @property modelCache
	 * @type {Object}
	 * @final
	 * @private
	 */
	modelCache: {},

	/**
	 * Stores attribute types as they're looked up in the container.
	 * @property attributeTypeCache
	 * @type {Object}
	 * @final
	 * @private
	 */
	attributeTypeCache: {},

	/**
	 * Stores adapters as they're looked up in the container.
	 *
	 * @property adapterCache
	 * @type Object
	 * @final
	 * @private
	 */
	adapterCache: {},

	/**
	 * Stores serializers as they're looked up in the container.
	 *
	 * @property adapterCache
	 * @type Object
	 * @final
	 * @private
	 */
	serializerCache: {},

	initializeLookupCaches: Ember.on('init', function() {
		this.setProperties({
			modelCache: {},
			attributeTypeCache: {},
			adapterCache: {},
			serializerCache: {}
		});
	}),

	modelForType: deprecateMethod('`modelForType` deprecated in favor of `modelFor`', 'modelFor'),

	/**
	 * Looks up the model for the specified typeKey. The `typeKey` property
	 * isn't available on the class or its instances until the type is
	 * looked up with this method for the first time.
	 *
	 * @method modelFor
	 * @param {String} typeKey
	 * @return {Class}
	 */
	modelFor: function(typeKey) {
		var modelCache = this.get('modelCache');

		if (!modelCache[typeKey]) {
			var model = this.get('container').lookupFactory('model:' + typeKey);
			if (!model) {
				throw new Ember.Error('Cannot find model class with typeKey: ' + typeKey);
			}

			model.reopen({ typeKey: typeKey });
			model.reopenClass({ typeKey: typeKey });
			modelCache[typeKey] = model;
		}

		return modelCache[typeKey];
	},

	/**
	 * Returns an `AttributeType` instance for the given named type.
	 *
	 * @method attributeTypeFor
	 * @param {String} typeName
	 * @return {AttributeType}
	 */
	attributeTypeFor: function(typeName) {
		var attributeTypeCache = this.get('attributeTypeCache');

		if (!attributeTypeCache[typeName]) {
			attributeTypeCache[typeName] = this.get('container').lookup('type:' + typeName);

			if (!attributeTypeCache[typeName]) {
				throw new Ember.Error('Cannot find attribute type with name: ' + typeName);
			}
		}

		return attributeTypeCache[typeName];
	},

	/**
	 * Gets the adapter for the specified type. First, it looks for a type-specific
	 * adapter. If one isn't found, it looks for the application adapter. If that
	 * isn't found, it uses the default {{link-to-class 'RESTAdapter'}}.
	 *
	 * Note that this method will cache the results, so your adapter configuration
	 * must be finalized before the app starts up.
	 *
	 * @method adapterFor
	 * @param {String} typeKey
	 * @return {Adapter}
	 * @protected
	 */
	adapterFor: function(typeKey) {
		var adapterCache = this.get('adapterCache');

		if (!adapterCache[typeKey]) {
			var container = this.get('container');

			adapterCache[typeKey] = container.lookup('adapter:' + typeKey) ||
			container.lookup('adapter:application') ||
			container.lookup('adapter:rest');
		}

		return adapterCache[typeKey];
	},

	/**
	 * Gets the serializer for the specified type. First, it looks for a type-specific
	 * serializer. If one isn't found, it looks for the application serializer. If that
	 * isn't found, it uses the default {{link-to-class 'JSONSerializer'}}.
	 *
	 * Note that this method will cache the results, so your serializer configuration
	 * must be finalized before the app starts up.
	 *
	 * @method serializerFor
	 * @param {String} typeKey
	 * @return {Serializer}
	 * @protected
	 */
	serializerFor: function(typeKey) {
		var serializerCache = this.get('serializerCache');

		if (!serializerCache[typeKey]) {
			var container = this.get('container');

			serializerCache[typeKey] =
					container.lookup('serializer:' + (typeKey || 'application')) ||
					container.lookup('serializer:application') ||
					container.lookup('serializer:json');
		}

		return serializerCache[typeKey];
	}

};