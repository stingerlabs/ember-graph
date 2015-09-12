var define = this.define;
var require = this.require;

var declareModuleLoader = function() {
	var DEFINITIONS = {};
	var MODULES = {};

	var evaluateModule = function(name) {
		if (!DEFINITIONS[name]) {
			throw new Error('Module not found: ' + name);
		}

		var exports = {};
		var dependencies = DEFINITIONS[name].dependencies.map(function(name) {
			if (name === 'exports') {
				return exports;
			} else {
				return require(name);
			}
		});

		DEFINITIONS[name].definition.apply(null, dependencies);

		MODULES[name] = exports;
		DEFINITIONS[name] = null;

		return exports;
	};

	define = function(name, dependencies, definition) {
		DEFINITIONS[name] = {
			dependencies: dependencies,
			definition: definition
		};
	};

	require = function(name) {
		if (!MODULES[name]) {
			MODULES[name] = evaluateModule(name);
		}

		return MODULES[name];
	};
};

var declareGlobalModule = function(global) {
	define('ember-graph', ['exports', 'ember'], function(exports, Ember) {
		/**
		 * @module ember-graph
		 * @main ember-graph
		 */
		global.EmberGraph = global.EG = Ember['default'].Namespace.create();
		exports['default'] = global.EmberGraph;
	});
};

// This is probably a poor way of detecting Ember CLI. Should work for now...
if (!define || !define.petal) {
	declareModuleLoader();
}

var global = this;

try {
	if (!require('ember')) {
		throw null;
	}
} catch (e) {
	define('ember', ['exports'], function(exports) {
		exports['default'] = global.Ember;
	});
}

try {
	if (!require('jquery')) {
		throw null;
	}
} catch (e) {
	define('jquery', ['exports'], function(exports) {
		exports['default'] = global.jQuery;
	});
}

declareGlobalModule(this);