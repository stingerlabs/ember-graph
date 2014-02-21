module.exports = {
	options: {
		mangle: false,
		compress: true,
		screw_ie8: true
	},

	release: {
		files: {
			'ember-graph.min.js': 'ember-graph.prod.js'
		}
	}
};