/**
 * Call a function when the HTML document has been loaded.
 * Source: http://youmightnotneedjquery.com/#ready
 *
 * @param {function} fn - The callback.
 */
function onDocumentReady (fn) {

    if (document.readyState !== 'loading') { return setTimeout(fn), void 0; }

    document.addEventListener('DOMContentLoaded', function onDocumentReady () {

        document.removeEventListener('DOMContentLoaded', onDocumentReady);
        fn();

    });

}

module.exports = onDocumentReady;