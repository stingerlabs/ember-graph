module.exports = {
	compile: {
		files: {
			'ember-graph.prod.js': 'ember-graph.js'
		},

		options: {
			console: false,
			debugger: false,
			namespace: ['Eg.debug', 'Em.assert', 'Ember.assert', 'Em.warn', 'Ember.warn']
		}
	}
};