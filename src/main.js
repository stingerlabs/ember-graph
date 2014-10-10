/**
 * @module ember-graph
 * @main ember-graph
 */
window.EmberGraph = window.EG = Em.Namespace.create();
Em.libraries.register('Ember Graph');

require('initialization');

require('util/array');
require('util/util');
require('util/set');
require('util/string');
require('util/inflector');

require('data/promise_object');

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

require('attribute_type/type');
require('attribute_type/**/*');

require('model/core');
require('model/model');
require('model/**/*');