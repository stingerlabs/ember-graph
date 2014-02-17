window.EmberGraph = {};
window.Eg = window.EmberGraph;

if (Ember.libraries) {
	// Neuter will take care of inserting the version number from bower.json
	var VERSION = '<%= version %>';

	Ember.libraries.register('Ember Graph', VERSION);
}

require('util/util');
require('util/set');
require('util/string');
require('util/inflector');
require('util/debug');

require('serializer/serializer');
require('serializer/json');

require('adapter/adapter');

require('store/store');
require('store/relationship');

require('data/promise_object');

require('relationship/relationship');

require('model/attribute_type/type');
require('model/attribute_type/boolean');
require('model/attribute_type/date');
require('model/attribute_type/number');
require('model/attribute_type/string');
require('model/attribute_type/object');
require('model/attribute_type/array');

require('model/model');
require('model/attribute');
require('model/relationship');