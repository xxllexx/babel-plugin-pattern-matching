import _ from 'lodash';
import { assert } from 'chai';
import plugin from '../src/index';
import { transform } from 'babel-core';
import vm from 'vm';

const options = {
    'plugins': [plugin, "transform-object-rest-spread"],
    'presets': ['es2015']
};

describe('Examples evaluation', function() {
    const actualCodeString = `
            //@disable-match
            let disableBy = 0 | 1;
            
            let factorial = 0 | 1;
                factorial = n | n * factorial(n - 1);
                
            let fibonacci = 0 | 1;
                fibonacci = 1 | 1;
                fibonacci = num | fibonacci(num - 1) + fibonacci(num - 2);
                
        `;

    const actual = transform(actualCodeString, options).code;
    const resScript = new vm.Script(actual);
    const context = new vm.createContext({});
    resScript.runInContext(context);

    const {factorial, fibonacci, disableBy} = context;

    it('Should calculate factorial of 3', function () {
        const res = factorial(3);
        assert.strictEqual(res, 6);
    });

    it('Should calculate fibonacci of 10', function () {
        const res = fibonacci(10);
        assert.strictEqual(res, 89);
    });

    it('Should disable matching', function () {
        assert.strictEqual(disableBy, 1);
    });
});

describe('Array patterns evaluation', function() {
    const actualCodeString = `
            let func = [] | 1;
                func = [x, y, z, ...rest] | rest;
                func = [x, y] | x + y;
                func = (all&[x], [y, z, ...rest]) | ([...all, ...rest]);
                func = ([x], [y]) | x + y;
        `;

    const actual = transform(actualCodeString, options).code;
    const resScript = new vm.Script(actual);
    const context = new vm.createContext({});
    resScript.runInContext(context);

    const {func} = context;

    it('Should run function for pattern `[]`', function () {
        const res = func([]);
        assert.strictEqual(res, 1);
    });

    it('Should run function for pattern `[x, y]`', function () {
        const res = func([1, 2]);
        assert.strictEqual(res, 3);
    });

    it('Should run function for pattern `[x, y, z, ...rest]`', function () {
        const res = func([1, 2, 3, 4]);
        assert.deepEqual(res, [4]);
    });

    it('Should run function for pattern `([x], [y])`', function () {
        const res = func([1], [2]);
        assert.strictEqual(res, 3);
    });

    it('Should run function for pattern `(all&[x], [y, z, ...rest])`', function () {
        const res = func([1, 2], [2, 3, 4]);
        assert.deepEqual(res, [1, 2, 4]);
    });

    it('Should not run any function', function () {
        const res = func([1, 2], [2, 3, 4], [1]);
        assert.isFalse(res);
    });
});

describe('Object patterns evaluation', function() {
    const actualCodeString = `
            let func = {} | 1;
                func = {x, y, z, ...rest} | rest;
                func = {x, y} | x + y;
                func = {x:z} | z;
                func = (all&{n, p:{t}}) | all;
                func = (all&{n}, some&{n:{x: all2&{v}}}) | ({...all, ...all2});
        `;

    const actual = transform(actualCodeString, options).code;
    const resScript = new vm.Script(actual);
    const context = new vm.createContext({});
    resScript.runInContext(context);

    const {func} = context;

    it('Should run function for pattern `{}`', function () {
        const res = func({});
        assert.strictEqual(res, 1);
    });

    it('Should run function for pattern `{x, y}`', function () {
        const res = func({x: 1, y: 2});
        assert.strictEqual(res, 3);
    });

    it('Should run function for pattern `{x, y, z, ...rest}`', function () {
        const res = func({x: 1, y: 2, z: 3, f: 5});
        assert.deepEqual(res, {f: 5});
    });

    it('Should run function for pattern `{x:z}`', function () {
        const res = func({x: 1});
        assert.strictEqual(res, 1);
    });

    it('Should run function for pattern `(all&{n, p:{t}})`', function () {
        const obj = { n: 10, p: { t: 10} };
        const res = func(obj);
        assert.deepEqual(res, obj);
    });

    it('Should run function for pattern `(all&{n}, some&{n:{x: all2&{v}}})`', function () {
        const res = func(
            {n: 10, m: 100},
            {n: {
                x: {v: 7, b: 5}
            }}
        );

        assert.deepEqual(res, { n: 10, m: 100, v: 7, b: 5 });
    });
});

describe('Primitive patterns evaluation', function() {
    const actualCodeString = `
            let func = "a" | 1;
                func = 0   | 2;
                func = true | 3;
                func = null | 4;
                func = undefined | 5;
                func = NaN | 6;
        `;

    const actual = transform(actualCodeString, options).code;
    const resScript = new vm.Script(actual);
    const context = new vm.createContext({});
    resScript.runInContext(context);

    const {func} = context;

    it('Should run function for string pattern', function () {
        const res = func("a");
        assert.strictEqual(res, 1);
    });

    it('Should run function for numeric pattern', function () {
        const res = func(0);
        assert.strictEqual(res, 2);
    });

    it('Should run function for bool pattern', function () {
        const res = func(true);
        assert.strictEqual(res, 3);
    });

    it('Should run function for null pattern', function () {
        const res = func(null);
        assert.strictEqual(res, 4);
    });

    it('Should run function for undefined pattern', function () {
        let undef;
        const res = func(undef);
        assert.strictEqual(res, 5);
    });

    it('Should run function for NaN pattern', function () {
        const res = func(NaN);
        assert.strictEqual(res, 6);
    });
});

describe('Mixed patterns evaluation', function() {
    const actualCodeString = `
            let func = ([], {}) | 1;
                func = ([], {n}) | 2;
                func = ([x], {}) | 3;
                func = ([x], {n}) | 4;
                func = ([x], {m: [y,...ys]}) | 5;
                func = n | 6 
        `;

    const actual = transform(actualCodeString, options).code;
    const resScript = new vm.Script(actual);
    const context = new vm.createContext({});
    resScript.runInContext(context);

    const {func} = context;

    it('Should run function for pattern `([], {})`', function () {
        const res = func([], {});
        assert.strictEqual(res, 1);
    });

    it('Should run function for pattern `([], {n})`', function () {
        const res = func([], {n: 10});
        assert.strictEqual(res, 2);
    });

    it('Should run function for pattern `([x], {})`', function () {
        const res = func([1], {});
        assert.strictEqual(res, 3);
    });

    it('Should run function for pattern `([x], {n})`', function () {
        const res = func([1], {n:20});
        assert.strictEqual(res, 4);
    });

    it('Should run function for pattern `([x], {m: [y,...ys]})`', function () {
        const res = func([1], {m:[1, 20, 15]});
        assert.strictEqual(res, 5);
    });

    it('Should run function for catch-all pattern', function () {
        const res = func({test: 123});
        assert.strictEqual(res, 6);
    });

    describe('Object patterns with nested types', function() {
        const actualCodeString = `
            let func = {x: [], y: []}   | 1;
                func = {x: [], y: [t]} | 2;
                func = {x: []} | 3;
                func = {x: 2} | 4;
                func = {v: undefined, c} | 5;
                func = {v: null, c} | 6;
                func = {v: 5, c} | 7;
                func = {v: 'a', c} | 8;
        `;

        const actual = transform(actualCodeString, options).code;
        const resScript = new vm.Script(actual);
        const context = new vm.createContext({});
        resScript.runInContext(context);

        const {func} = context;

        it('Should run function for pattern `{x: []}`', function () {
            const res = func({x: []});
            assert.strictEqual(res, 3);
        });

        it('Should run function for pattern `{x: [], y: []}`', function () {
            const res = func({x: [], y: []});
            assert.strictEqual(res, 1);
        });

        it('Should run function for pattern `{x: [], y: [t]} `', function () {
            const res = func({x: [], y: [1]});
            assert.strictEqual(res, 2);
        });

        it('Should run function for pattern `{x: 2} `', function () {
            const res = func({x: 2});
            assert.strictEqual(res, 4);
        });

        it('Should run function for pattern `{v: undefined, c} `', function () {
            const res = func({c: 10});
            assert.strictEqual(res, 5);
        });

        it('Should run function for pattern `{v: null, c} `', function () {
            const res = func({v: null, c: 10});
            assert.strictEqual(res, 6);
        });

        it('Should run function for pattern `{v: 5, c} `', function () {
            const res = func({v: 5, c: 10});
            assert.strictEqual(res, 7);
        });

        it('Should run function for pattern `{v: "a", c} `', function () {
            const res = func({v: 'a', c: 10});
            assert.strictEqual(res, 8);
        });
    });
    describe('Object patterns with alias for primitive values', function() {
        const actualCodeString = `
            let func = {x: p&'r'}   | 1;
                func = {x: p&{}, m: t&11} | t + 1;
                func = {x: p&{}, m: t} | t;
                func = {x: p&{}, m: t&'some'} | t;
                func = {x: p&{}, m: t&true} | t;
        `;

        const actual = transform(actualCodeString, options).code;
        const resScript = new vm.Script(actual);
        const context = new vm.createContext({});
        resScript.runInContext(context);

        const {func} = context;

        it('Should run function for pattern `{x: p&"r"}`', function () {
            const res = func({x: 'r'});
            assert.strictEqual(res, 1);
        });

        it('Should run function for pattern `{x: p&{}, m: t&10}`', function () {
            const res = func({x: {}, m: 11});
            assert.strictEqual(res, 12);
        });

        it('Should run function for pattern `{x: p&{}, m: 10}`', function () {
            const res = func({x: {}, m: 10});
            assert.strictEqual(res, 10);
        });

        it('Should run function for pattern `{x: p&{}, m: t&"some"}`', function () {
            const res = func({x: {}, m: 'some'});
            assert.strictEqual(res, 'some');
        });

        it('Should run function for pattern `{x: p&{}, m: t&true}`', function () {
            const res = func({x: {}, m: true});
            assert.strictEqual(res, true);
        });
    });
});