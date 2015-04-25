import JSONSerializer from 'ember-graph/serializer/json';

/**
 * @class EmberGraphSerializer
 * @extends JSONSerializer
 */
export default JSONSerializer.extend({
	polymorphicRelationships: true
});