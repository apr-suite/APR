var onDocumentReady = (jest.mock('@lib/onDocumentReady'), require('@lib/onDocumentReady'));
var Define = require('@lib/Define');
var helpers = require('@test/helpers.js');
var removeElements = helpers.removeElements;

beforeAll(function () {

    window.Define = Define;

});

afterAll(function () {

    delete window.Define;

});

beforeEach(function () {

    Define.clear();

});

describe('@lib/Define', function () {

    it('Should allow calling Define without "new".', function () {

        expect(Define('id')).toBeInstanceOf(Define);

    });

    test.each([
        [void 0],
        [''],
        [null]
    ])('Should throw if the given id is %o.', function (id) {

        expect(function () { Define(id); }).toThrow(TypeError);

    });

    test.each([
        // Using arrays as values.
        [[void 0]],
        [['']],
        [[null]]
    ])('Should throw if some dependency-id is %o.', function (dependencyIDs) {

        expect(function () { Define('id', dependencyIDs, function () {}); }).toThrow(TypeError);

    });

    test.each([
        // Using non-arrays as values
        [void 0],
        [null],
        [0],
        ['']
    ])('Should not throw if some dependency-id is %o.', function (dependencyIDs) {

        expect(function () { Define('id', dependencyIDs, function () {}); }).not.toThrow(TypeError);

    });

    it('Should call a module.', function (done) {

        Define('module', [], function () { done(); });

    }, 3000);

    it('Should call a module with dependencies.', function (done) {

        Define('dependency', [], function () {});
        Define('moduleWithDependencies', ['dependency'],
            function () { done(); }
        );

    }, 3000);

    it('Should call the module with the returned values of the ' +
        'dependencies.', function (done) {


        Define('a', [], function () { return 'a'; });
        Define('b', [], function () { return 'b'; });
        Define('get-a-and-b', ['a', 'b'], function (a, b) {

            expect(a).toBe('a');
            expect(b).toBe('b');
            done();

        });

    });

    it('Should ignore the third argument if the second is not an array.', function (done) {

        Define('non-array', done);

    });

    it('Should convert non-array dependencies to arrays.', function (done) {

        Define('dependency', 'value');
        Define('non-array-to-array', 'dependency', function (value) {

            expect(value).toBe('value');
            done();

        });

    });

    it('Should load dependencies when required.', function (done) {

        var time = new Date().getTime();

        setTimeout(function () { Define('idle', true); }, 1000);

        Define('only-when-needed', ['idle'], function (value) {

            expect(value).toBe(true);
            expect(+new Date() - time).toBeGreaterThan(1000);
            done();

        });

    }, 5000);

    it('Should call a module with a circular dependency.', function (done) {

        var spy = jest.fn(function (someModule) {

            expect(spy).toHaveBeenCalledTimes(1);
            expect(someModule).toBe(this);
            done();

            return 1;

        });

        Define('someModule', ['someModule'], spy);

    });

    it('Should call recursive dependencies.', function (done) {

        var fn1 = jest.fn(function (r2) {

            expect(fn1).toHaveBeenCalledTimes(1);
            expect(r2).toBe(2);

            return 1;

        });
        var fn2 = jest.fn(function (r1) {

            expect(fn2).toHaveBeenCalledTimes(1);
            expect(r1).toBeInstanceOf(Define);

            return 2;

        });

        Define('recursive-1', ['recursive-2'], fn1);
        Define('recursive-2', ['recursive-1'], fn2);
        Define('recursives', ['recursive-1', 'recursive-2'], function (r1, r2) {

            expect(r1).toBe(1);
            expect(r2).toBe(2);
            done();

        });

    }, 3000);

    describe('Define.clear', function () {

        it('Should remove all saved data.', function () {

            var someObject = {'a': 'b'};

            Define.urls = someObject;
            Define.nonScripts = someObject;
            Define.globals = someObject;
            Define.handleError = null;

            Define('a', 1);
            expect(Define.urls).toMatchObject(someObject);
            expect(Define.nonScripts).toMatchObject(someObject);
            expect(Define.globals).toMatchObject(someObject);
            expect(Define.handleError).toBe(null);
            expect(Define.isDefined('a')).toBe(true);

            Define.clear();

            expect(Define.urls).not.toHaveProperty('a');
            expect(Define.nonScripts).not.toHaveProperty('a');
            expect(Define.globals).not.toHaveProperty('a');
            expect(Define.handleError).not.toBe(null);
            expect(Define.isDefined('a')).toBe(false);

        });

    });

    describe('Define.clearModule', function () {

        it('Should clear a module by a given id.', function () {

            Define('a');
            expect(Define.isDefined('a')).toBe(true);

            Define.clearModule('a');
            expect(Define.isDefined('a')).toBe(false);

        });

    });

    describe('Define.isDefined', function () {

        it('Should check if a module was previously defined.', function () {

            Define.clearModule('a');
            expect(Define.isDefined('a')).toBe(false);

            Define('a');
            expect(Define.isDefined('a')).toBe(true);

        });

    });

    describe('Define.clearModules', function () {

        it('Should remove all modules.', function () {

            Define('a', 'defined');

            expect(Define.isDefined('a')).toBe(true);
            Define.clearModules();
            expect(Define.isDefined('a')).toBe(false);

        });

    });

    describe('Define.load', function () {

        it('Should return `true` if the value module is being loaded, ' +
            '`true` otherwise.', function () {

            var url = '/assets/Define/load.js';
            var clear = function () {

                Define.clear();
                removeElements('script[src="' + url + '"]');

            };

            clear();
            expect(Define.load(url)).toBe(true);
            expect(Define.load(url)).toBe(false);

            clear();
            expect(Define.load(url)).toBe(true);
            Define(url);
            expect(Define.load(url)).toBe(false);

        });

        xit('Should call Define.handleError if some element fails loading.', function (done) {

            var Define = require('@lib/Define');

            Define.handleError = function (e) {

                expect(e).toBeInstanceOf(Error);
                expect(this).toBe(null);
                done();

            };

            Define.load('some url');

        });

        it('Should call a function on file load.', function (done) {

            var url = '/assets/Define/load.js';

            removeElements('script[src="' + url + '"]');

            Define.load(url, function (e) {

                expect(this).toBeInstanceOf(HTMLElement);
                expect(e).toBeInstanceOf(Event);
                done();

            });

        });

        it('Should define a given url as an alias.', function (done) {

            var url = '/assets/Define/load-alias.js';
            var alias = 'alias';

            removeElements('script[src="' + url + '"]');
            Define.urls[alias] = url;
            Define.load(alias);

            Define('url-as-alias', [url, alias], function (a, b) {

                expect(a).toBe(b);
                done();

            });

        });

        it('Should define a given global as an alias.', function (done) {

            var global = 'some.string';
            var url = '/assets/Define/load-global.js';

            removeElements('script[src="' + url + '"]');
            Define.globals[url] = global;
            Define.load(url);

            Define('global-as-alias', [url, global], function (a, b) {

                expect(a).toBe(b);
                done();

            });

        });

        test.each([
            ['some.global.in.window', 'defined'],
            [null, null]
        ])('Should define a global using %o on file load.', function (value, result, done) {

            var url = '/assets/Define/load-global.js';

            removeElements('script[src="' + url + '"]');
            Define.globals[url] = value;
            Define.load(url);

            Define('global', [url], function (value) {

                expect(value).toBe(result);
                done();

            });

        });

        it('Should define a value for a non-script file.', function (done) {

            var url = '/assets/Define/load-style.css';
            var nonScriptValue = 'some value';

            removeElements('link[href="' + url + '"]');
            Define.nonScripts[url] = nonScriptValue;
            Define.load(url);

            Define('non-script', [url], function (value) {

                expect(value).toBe(nonScriptValue);
                done();

            });

        });

        it('Should load scripts.', function (done) {

            var url = '/assets/Define/load-script.js';

            removeElements('script[src="' + url + '"]');

            Define.load(url, function () {

                expect(this).toBeInstanceOf(HTMLScriptElement);
                done();

            });

        });

        it('Should load styles.', function (done) {

            var url = '/assets/Define/load-style.css';

            removeElements('link[href="' + url + '"]');

            Define.load(url, function () {

                expect(this).toBeInstanceOf(HTMLLinkElement);
                done();

            });

        });

    });

    describe('Define.findUrlsInDocument', function () {

        it('Should replace `[attribute-name]` with the value of the attribute ' +
            'when finding elements in document.', function () {

            var element = document.createElement('div');

            element.setAttribute('data-entry', 'main');
            element.setAttribute('data-just-Define', JSON.stringify({
                'entry: [data-entry]': '/assets/Define-test-[data-entry].js'
            }));

            document.body.appendChild(element);

            expect(Define.findUrlsInDocument('data-just-Define')).toMatchObject({
                'entry: main': '/assets/Define-test-main.js'
            });

        });

    });

    describe('Define.init', function () {

        it('Should find file ids in document and load them.', function (done) {

            var urls = {
                'main': '/assets/Define/init.js',
                'index': '/assets/Define/init.js'
            };
            var element = document.createElement('div');

            removeElements(
                'script[src="' + urls.main + '"]',
                'script[src="' + urls.index + '"]'
            );
            element.setAttribute('data-just-Define', JSON.stringify(urls));
            document.body.appendChild(element);

            expect(onDocumentReady).toHaveBeenCalled(); // This is called when the document is ready.

            Define.clear();
            Define.init();

            expect(Define.urls).toMatchObject(urls);
            /**
             * var spy = jest.spyOn(Define, 'load');
             * expect(Define.load).toHaveBeenCalledTimes(1);
             * expect(Define.load).toHaveBeenCalledWith('main');
             */
            Define('init', ['index'], done);

        }, 5000);

    });

    describe('Define.handleError', function () {

        it('Should output an exception to console.', function (done) {

            var mock = jest.spyOn(console, 'error').mockImplementation(function (e) {

                expect(e).toBeInstanceOf(Error);
                mock.mockRestore();
                done();

            });

            Define('throw', [], function () { throw new Error(); });

        });

        it('Should allow to handle exceptions manually.', function (done) {

            var mock = jest.fn(function () {

                expect(mock).toHaveBeenCalled();
                mock.mockRestore();
                done();

            });

            Define.handleError = mock;
            Define('throw', [], function () { throw new Error(); });

        });

    });

});
