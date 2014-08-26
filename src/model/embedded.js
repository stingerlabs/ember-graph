///**
//* @class EmbeddedModel
//* @extends CoreModel
//*/
//EG.EmbeddedModel = EG.CoreModel.extend({
//
//	/**
//	 * @property parent
//	 * @type Model
//	 * @final
//	 */
//	parent: null
//
//});
//
//EG.EmbeddedModel.reopenClass({
//
//	extend: function() {
//		var mixins, properties;
//
//		if (arguments.length === 0 || (arguments[arguments.length - 1] instanceof Em.Mixin)) {
//			mixins = Array.prototype.slice.call(arguments);
//			properties = {};
//		} else {
//			mixins = Array.prototype.slice.call(arguments, 0, arguments.length);
//			properties = arguments[arguments.length - 1];
//		}
//
//		var attributes = {};
//
//		EG.values(properties, function(name, value) {
//			if (!value.isAttribute || value.isEmbedded) {
//				if (value.isRelationship) {
//					throw new Em.Error('Relationships can\'t be declared on an embedded model.');
//				}
//
//				if (value.isEmbedded) {
//					throw new Em.Error('Embedded models can\'t be nested.');
//				}
//
//				return;
//			}
//
//			attributes[name] = value;
//			delete properties[name];
//		});
//
//		var Class = this._super.apply(this, mixins.concat([properties]));
//		Class.declareAttributes(attributes);
//		return Class;
//	},
//
//	declareAttributes: function(attributes) {
//
//	},
//
//	createAttributeType: function() {
//
//	}
//
//});
//
