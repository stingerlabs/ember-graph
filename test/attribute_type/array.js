(function() {
	'use strict';

	var store;
	var type = EG.ArrayType.create();

	module('Array Attribute Type Test', {
		setup: function() {
			store = setupStore({
				lotteryTicket: EG.Model.extend({
					numbers: EG.attr('array')
				})
			});

			store.pushPayload({
				lotteryTicket: [
					{
						id: '1',
						numbers: [4, 8, 15, 16, 23, 42]
					}
				]
			});
		}
	});

	test('Comparison works correctly', function() {
		expect(5);

		ok(type.isEqual([], []));
		ok(type.isEqual(['hello'], ['hello']));
		ok(type.isEqual([1, 2, 3], [1, 2, 3]));
		ok(!type.isEqual([1, 2], [2, 1]));
		ok(!type.isEqual([''], [null]));
	});

	test('Changes can be observed', 2, function() {
		var ticket = store.getRecord('lotteryTicket', '1');

		ticket.addObserver('numbers.[]', function() {
			ok(true);
		});

		ticket.get('numbers').pushObject(0);
		ticket.set('numbers', ticket.get('numbers').slice(0, 6));
	});
})();