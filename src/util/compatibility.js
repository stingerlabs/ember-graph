/**
 * This function will return `true` if the current version of
 * Ember is at least the version number specified. If not,
 * it will return false.
 *
 * @param {Number} major
 * @param {Number} minor
 * @param {Number} patch
 * @return {Boolean}
 */
function verifyAtLeastEmberVersion(major, minor, patch) {
	const emberVersionParts = Ember.VERSION.split(/\.|\-/);
	const emberVersionNumbers = emberVersionParts.map((part) => parseInt(part, 10));

	if (emberVersionNumbers[0] < major) {
		return false;
	}

	if (emberVersionNumbers[1] < minor) {
		return false;
	}

	if (emberVersionNumbers[2] < patch) {
		return false;
	}

	return true;
}

export { verifyAtLeastEmberVersion };