/**
 * Ember's ObjectProxy combined with the PromiseProxyMixin.
 * Acts as an object and proxies all properties to the
 * given promise when it resolves.
 *
 * @class PromiseObject
 * @extends ObjectProxy
 * @uses PromiseProxyMixin
 * @constructor
 */
EG.PromiseObject = Em.ObjectProxy.extend(Em.PromiseProxyMixin);

/**
 * Ember's ArrayProxy combined with the PromiseProxyMixin.
 * Acts as an array and proxies all properties to the
 * given promise when it resolves.
 *
 * @class PromiseArray
 * @extends ArrayProxy
 * @uses PromiseProxyMixin
 * @constructor
 */
EG.PromiseArray = Em.ArrayProxy.extend(Em.PromiseProxyMixin);

/**
 * Acts just like `PromiseObject` only it's able to hold the
 * ID and typeKey of a model before it's resolved completely.
 *
 * ```js
 * var user = EG.ModelPromiseObject.create({
 *     promise: this.store.find('user', '52'),
 *     id: '52',
 *     typeKey: 'user'
 * });
 *
 * user.get('isPending'); // true
 * user.get('id'); // '52'
 * user.get('typeKey'); // 'user'
 * ```
 *
 * @class ModelPromiseObject
 * @extends PromiseObject
 * @constructor
 */
EG.ModelPromiseObject = EG.PromiseObject.extend({
	__modelId: null,
	__modelTypeKey: null,

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
	}.property('__modelId', 'content.id'),

	typeKey: function(key, value) {
		var content = this.get('content');

		if (arguments.length > 1) {
			if (content && content.set) {
				content.set('typeKey', value);
			} else {
				this.set('__modelTypeKey', value);
			}
		}

		if (content && content.get) {
			return content.get('typeKey');
		} else {
			return this.get('__modelTypeKey');
		}
	}.property('__modelTypeKey', 'content.typeKey'),

	getModel: function() {
		return this.get('content');
	},

	destroy: function() {
		var model = this.getModel();

		if (model && typeof model.destroy === 'function') {
			return model.destroy();
		} else {
			return Em.RSVP.Promise.reject('Can\'t destroy a record that is still loading.');
		}
	}
});