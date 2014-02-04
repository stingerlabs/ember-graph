Eg.Store.reopen({

	//{
	//	record: 'record1',
	//	relationship: 'children',
	//	inverse: 'parent',
	//	change: 'add',
	//	linked: 'record5'
	//}

	_currentChanges: {},

	_pendingChanges: {},

	_addedToHasMany: function(record, relationship, idAdded) {
		var meta = record.constructor.metaForRelationship(relationship);

		if (meta.inverse === null) {
			return;
		}

		var otherRecord = this._getRecord(meta.relatedType, idAdded);

		if (otherRecord !== null) {
			var otherType = record.constructor.modelForType(meta.relatedType);
			var otherKind = otherRecord.constructor.relationshipKind(meta.inverse);

			if (otherKind === Eg.Model.BELONGS_TO_KEY) {
				otherRecord.set(meta.inverse, record);
			} else if (otherKind === Eg.Model.BELONGS_TO_KEY) {
				otherRecord.addToRelationship(meta.inverse, record);
			} else {
				throw new Error('Relationship must be a hasMany or belongsTo type.');
			}
		} else {
			var change = {
				record: record,
				relationship: relationship,
				inverse: meta.inverse,
				change: 'add',
				linked: idAdded
			};

			this._currentChanges[record.get('id')] = change;
			this._pendingChanges[idAdded] = change;
		}
	},

	_removedFromHasMany: function(record, relationship, idRemoved) {
		var meta = record.constructor.metaForRelationship(relationship);

		if (meta.inverse === null) {
			return;
		}

		var otherRecord = this._getRecord(meta.relatedType, idRemoved);

		if (otherRecord !== null) {
			var otherType = record.constructor.modelForType(meta.relatedType);
			var otherKind = otherRecord.constructor.relationshipKind(meta.inverse);

			if (otherKind === Eg.Model.BELONGS_TO_KEY) {
				otherRecord.set(meta.inverse, record);
			} else if (otherKind === Eg.Model.BELONGS_TO_KEY) {
				otherRecord.removeFromRelationship(meta.inverse, record);
			} else {
				throw new Error('Relationship must be a hasMany or belongsTo type.');
			}
		} else {
			var change = {
				record: record,
				relationship: relationship,
				inverse: meta.inverse,
				change: 'remove',
				linked: idRemoved
			};

			this._currentChanges[record.get('id')] = change;
			this._pendingChanges[idRemoved] = change;
		}
	},

	_belongsToSet: function(record, relationship, value) {

	},

	_recordSaved: function(record) {

	}
});
