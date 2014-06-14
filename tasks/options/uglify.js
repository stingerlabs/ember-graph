module.exports = {
	options: {
		mangle: true,
		compress: {
			global_defs: {
				DEBUG: false,
				RELEASE: true
			},
			sequences: true,
			properties: true,
			drop_debugger: true,
			unsafe: false,
			conditionals: true,
			comparisons: true,
			evaluate: true,
			booleans: true,
			dead_code: true,
			loops: true,
			unused: true,
			hoist_funs: false,
			hoist_vars: false,
			if_return: true,
			join_vars: true,
			cascade: true,
			warnings: true,
			negate_iife: false,
			pure_getters: false,
			pure_funcs: null,
			drop_console: true
		},
		screw_ie8: true
	},

	release: {
		files: {
			'dist/ember-graph.min.js': 'dist/ember-graph.prod.js'
		}
	}
};