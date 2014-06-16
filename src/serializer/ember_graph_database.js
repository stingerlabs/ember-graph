/**
 * @class EmberGraphDatabaseSerializer
 * @extends Serializer
 * @constructor
 */
EG.EmberGraphDatabaseSerializer = EG.Serializer.extend({

	/**
	 * Converts a record to its JSON format. The JSON
	 * contains only the ID and serialized attributes.
	 *
	 * @method serialize
	 * @param {Model} record
	 * @return {JSON}
	 */
	serialize: function(record) {
		var json = {};

		if (!record.get('isNew')) {
			json.id = record.get('id');
		}

		var store = this.get('store');
		record.constructor.eachAttribute(function(name, meta) {
			var type = store.attributeTypeFor(meta.type);
			json[name] = type.serialize(record.get(name));
		});

		return json;
	},

	/**
	 * Deserializes the attributes in the given JSON.
	 * Requires the `recordType` option.
	 *
	 * @method deserialize
	 * @param {JSON} json
	 * @param {Object} options
	 * @return {Object}
	 */
	deserialize: function(json, options) {
		var record = { id: json.id + '' };
		var store = this.get('store');
		var model = store.modelForType(options.recordType);

		model.eachAttribute(function(name, meta) {
			var type = store.attributeTypeFor(meta.type);

			if (json[name] === undefined) {
				if (meta.isRequired) {
					var error = { id: json.id, typeKey: model.typeKey, name: name };
					throw new Error('Attribute was missing: ' + JSON.stringify(error));
				} else {
					record[name] = (meta.defaultValue === undefined ? type.get('defaultValue') : meta.defaultValue);
				}
			} else {
				record[name] = type.deserialize(json[name]);
			}
		});

		return record;
	}
});