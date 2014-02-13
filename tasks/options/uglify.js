module.exports = {
	options: {
		mangle: false,
		compress: true
	},

	release: {
		files: {
			'ember-graph.min.js': 'ember-graph.prod.js'
		}
	}
};