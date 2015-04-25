module.exports = {
	options: {
		nospawn: true
	},
	code: {
		files: ['src/**/*.js'],
		tasks: ['transpile']
	},
	test: {
		files: ['test/**/*.js'],
		tasks: ['build_test_runner']
	}
};