Eg.String = {
	startsWith: function(string, prefix) {
		return string.indexOf(prefix) === 0;
	},

	endsWith: function(string, suffix) {
		return string.indexOf(suffix, this.length - suffix.length) >= 0;
	}
};

if (Em.EXTEND_PROTOTYPES === true || Em.EXTEND_PROTOTYPES.String) {
	String.prototype.startsWith = String.prototype.startsWith || function(prefix) {
		return Eg.String.startsWith(this, prefix);
	};

	String.prototype.endsWith = String.prototype.endsWith || function(suffix) {
		return Eg.String.endsWith(this, suffix);
	};
}