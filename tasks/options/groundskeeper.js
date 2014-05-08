module.exports = {
	compile: {
		files: {
			'ember-graph.prod.js': 'ember-graph.js'
		},

		options: {
			console: false,
			debugger: false,
			namespace: [
				'Em.assert', 'Ember.assert',
				'Em.warn', 'Ember.warn',
				'Em.runInDebug', 'Ember.runInDebug'
			]
		}
	}
};