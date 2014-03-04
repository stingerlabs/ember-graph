/**
 * @class {PromiseObject}
 */
EG.PromiseObject = Em.ObjectProxy.extend(Em.PromiseProxyMixin);

/**
 * @class {PromiseArray}
 */
EG.PromiseArray = Em.ArrayProxy.extend(Em.PromiseProxyMixin);