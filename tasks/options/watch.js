module.exports = {
	options: {
		nospawn: true
	},
	code: {
		files: ['src/**/*.js'],
		tasks: ['neuter']
	},
	test: {
		files: ['test/**/*.js'],
		tasks: ['build_test_runner']
	}
};