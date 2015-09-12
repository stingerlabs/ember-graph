/* global define require */

var configureAliases = function() {
	var configureAlias = function(original, alias) {
		define(alias, ['exports', original], function(exports, original) {
			for (var key in original) {
				if (original.hasOwnProperty(key)) {
					exports[key] = original[key];
				}
			}
		});
	};

	configureAlias('ember-graph/main', 'ember-graph');
	configureAlias('ember-graph/util/util', 'ember-graph/util');
	configureAlias('ember-graph/serializer/serializer', 'ember-graph/serializer');
	configureAlias('ember-graph/adapter/adapter', 'ember-graph/adapter');
	configureAlias('ember-graph/adapter/ember_graph/adapter', 'ember-graph/adapter/ember_graph');
	configureAlias('ember-graph/model/model', 'ember-graph/model');
	configureAlias('ember-graph/attribute_type/type', 'ember-graph/attribute_type');
	configureAlias('ember-graph/store/store', 'ember-graph/store');
};

require(['ember-graph/initializer']);
require(['ember-graph/shim']);

configureAliases();