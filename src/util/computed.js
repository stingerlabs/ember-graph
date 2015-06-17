import Ember from 'ember';

import { verifyAtLeastEmberVersion } from 'ember-graph/util/compatibility';

const isNewVersion = verifyAtLeastEmberVersion(1, 12, 0);

const oldComputed = (...args) => {
	const dependentProperties = args.slice(0, -1);
	const definition = args[args.length - 1];
	const readOnly = !definition.set;

	if (readOnly) {
		return Ember.computed(...dependentProperties, function(key) {
			return definition.get.call(this, key);
		}).readOnly();
	} else {
		return Ember.computed(...dependentProperties, function(key, value) {
			if (arguments.length > 1) {
				definition.set.call(this, key, value);
			}

			return definition.get.call(this, key);
		});
	}
};

const newComputed = (...args) => {
	const dependentProperties = args.slice(0, -1);
	const definition = args[args.length - 1];
	const readOnly = !definition.set;

	if (definition.set) {
		const oldSet = definition.set;
		definition.set = function(key, value) {
			oldSet.call(this, key, value);
			return definition.get.call(this, key);
		};
	}

	const property = Ember.computed(...dependentProperties, definition);

	if (readOnly) {
		return property.readOnly();
	} else {
		return property;
	}
};

const computed = (isNewVersion ? newComputed : oldComputed);

export { computed };