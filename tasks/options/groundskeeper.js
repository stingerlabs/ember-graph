module.exports = {
	compile: {
		files: {
			'dist/ember-graph.prod.js': 'dist/ember-graph.js'
		},

		options: {
			console: false,
			'debugger': true,
			namespace: [
				'Em.assert', 'Ember.assert',
				'Em.warn', 'Ember.warn',
				'Em.runInDebug', 'Ember.runInDebug',
				'Em.deprecate', 'Ember.deprecate',
				// TODO: Clean up before transpiling
				'_ember.default.assert',
				'_ember.default.warn',
				'_ember.default.runInDebug',
				'_ember.default.deprecate'
			]
		}
	}
};