EG.String = {
	startsWith: function(string, prefix) {
		return string.indexOf(prefix) === 0;
	},

	endsWith: function(string, suffix) {
		return string.indexOf(suffix, this.length - suffix.length) >= 0;
	},

	capitalize: function(string) {
		return string[0].toLocaleUpperCase() + string.substring(1);
	},

	decapitalize: function(string) {
		return string[0].toLocaleLowerCase() + string.substring(1);
	}
};

if (Em.EXTEND_PROTOTYPES === true || Em.EXTEND_PROTOTYPES.String) {
	String.prototype.startsWith = String.prototype.startsWith || function(prefix) {
		return EG.String.startsWith(this, prefix);
	};

	String.prototype.endsWith = String.prototype.endsWith || function(suffix) {
		return EG.String.endsWith(this, suffix);
	};

	String.prototype.capitalize = String.prototype.capitalize || function() {
		return EG.String.capitalize(this);
	};

	String.prototype.decapitalize = String.prototype.decapitalize || function() {
		return EG.String.decapitalize(this);
	};
}