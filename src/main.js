window.EmberGraph = window.Eg = window.EG = Em.Namespace.create({
	// Neuter will take care of inserting the version number from bower.json
	VERSION: '<%= version %>'
});

if (Ember.libraries) {
	Ember.libraries.register('Ember Graph', EG.VERSION);
}

require('initialization');

require('util/util');
require('util/set');
require('util/string');
require('util/inflector');
require('util/debug');

require('serializer/serializer');
require('serializer/json');

require('adapter/adapter');
require('adapter/fixture');

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