define([
	'./eachProperty',
	'./check',
	'./isEmptyObject'
], function (
	eachProperty,
	check,
	isEmptyObject
) {

	'use strict';

	/**
	 * Fills a key-value object with `data`.
	 *
	 * @param {Object<key, value>} structure The structured data to be filled.
	 * 										If the value of some property is an array,
	 										the value gets pushed to the array.
	 * @param {Object} data The new contents added to the structure.
	 * @param {Boolean} preserveUndefined If it's a truthy value, `undefined` values in
	 * 										-the structure- will become an optional key
	 * 										that will be present only if `data` contains
	 * 										that property (even if it's `undefined`).
	 * @return {!Object<key, value>} A new object preserving the given structure.
	 * @example <caption>`undefined` values get removed by default.</caption>
	 * fill({
	 *     'a': void 0,
	 *     'b': null,
	 *     'c': []
	 * }, {
	 *     'c': {'some': 'value'},
	 *     'd': 'ignored'
	 * }); // {'b': null, 'c': [{'some': 'value'}]}
	 *
	 * @example <caption>Passing a third argument preserves `undefined` values.</caption>
	 * fill({'a': void 0}, null, true); // {'a': void 0}
	 */
	return function fill (structure, data, preserveUndefined) {

		var filled = {};

		check.throwable(structure, {});

		if (typeof data === 'undefined' || typeof data === 'object' &&
			isEmptyObject(data)) {
			return Object.assign({}, structure);
		}

		check.throwable(data, null, {});

		eachProperty(structure, function (currentValue, currentKey) {

			var newValue = data[currentKey];

			if (currentValue === void 0 && preserveUndefined) {
				return;
			}

			if (!(currentKey in data)) {
				filled[currentKey] = currentValue;
				return;
			}

			if (check(currentValue, [])) {
				currentValue.push(newValue);
				newValue = currentValue;
			}

			filled[currentKey] = newValue;

		});

		return filled;

	};

});