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