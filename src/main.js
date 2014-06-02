/**
 * @module ember-graph
 * @main ember-graph
 */
window.EmberGraph = window.EG = Em.Namespace.create({
	/**
	 * Neuter will take care of inserting the version number from bower.json
	 *
	 * @property VERSION
	 * @for EG
	 * @category top-level
	 * @type String
	 * @static
	 */
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

require('serializer/serializer');
require('serializer/json');

require('adapter/adapter');
require('adapter/synchronous');
require('adapter/**/*');

require('store/store');
require('store/relationship');

require('data/promise_object');

require('relationship/relationship');

require('attribute_type/type');
require('attribute_type/**/*');

require('model/model');
require('model/states');
require('model/attribute');
require('model/relationship');
require('model/schema');