module.exports = {
	compile: {
		files: {
			'dist/ember-graph.prod.js': 'dist/ember-graph.js'
		},

		options: {
			console: false,
			debugger: true,
			namespace: [
				'Em.assert', 'Ember.assert',
				'Em.warn', 'Ember.warn',
				'Em.runInDebug', 'Ember.runInDebug'
			]
		}
	}
};