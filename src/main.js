/**
 * @module ember-graph
 * @main ember-graph
 */
window.EmberGraph = window.EG = Em.Namespace.create({
	/**
	 * @property VERSION
	 * @namespace EmberGraph
	 * @type String
	 * @static
	 * @final
	 */
	VERSION: '<%= version %>'
});

if (Em.libraries) {
	Em.libraries.register('Ember Graph', EG.VERSION);
}

require('initialization');

require('util/array');
require('util/util');
require('util/set');
require('util/string');
require('util/inflector');

require('relationship/relationship');
require('relationship/relationship_store');

require('serializer/serializer');
require('serializer/json');
require('serializer/**/*');

require('adapter/adapter');
require('adapter/ember_graph/adapter');
require('adapter/ember_graph/**/*');
require('adapter/**/*');

require('store/record_cache');
require('store/store');
require('store/relationship');

require('data/promise_object');

require('attribute_type/type');
require('attribute_type/**/*');

require('model/model');
require('model/**/*');