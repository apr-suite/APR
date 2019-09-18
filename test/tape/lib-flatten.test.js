var test = require('tape');
var flatten = require('../../src/lib/flatten');

test('lib/flatten.js', function (t) {

    t.test('Should generate a result depending on the type of the ' +
		'given value.', function (st) {

        st.deepEquals(flatten([]), [],
            'flattenArray returns an Array.');

        st.deepEquals(flatten({}), {},
            'flattenObjectLiteral returns an object literal.');

        st.end();

    });

    t.test('Should throw if the solution is not implemented.', function (st) {

        st.plan(1);

        st.throws(function () {

            flatten('string');

        }, TypeError, '`flattenString` or something similar is not ' +
		'implemented yet.');

    });

    t.end();

});
