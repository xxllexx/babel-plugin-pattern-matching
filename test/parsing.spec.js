import _ from 'lodash';
import { assert } from 'chai';
import glob from 'glob';
import fs from 'fs';
import path from 'path';
import plugin from '../src/index';
import { transformFileSync } from 'babel-core';

function getTestName(testPath) {
    return path.basename(testPath).split('-').join(' ');
}

const options = {
    'plugins': [[plugin, { 'skipLib': true }], "transform-object-rest-spread"],
    'presets': ['es2015']
};

describe('Patterns for Array', function() {
    _.each(glob.sync(path.join(__dirname, 'fixtures/arrays/*/')), testPath => {
        const actualPath = path.join(testPath, 'actual.js');
        const expectedPath = path.join(testPath, 'expected.js');

        it(`should transform arrays: ${ getTestName(testPath) }`, () => {
            const expected = fs.readFileSync(expectedPath, 'utf8');
            const actual = transformFileSync(actualPath, options).code;
            
            assert.strictEqual(_.trim(actual), _.trim(expected));
        });
    });
});

describe('Patterns for Object', function() {
    _.each(glob.sync(path.join(__dirname, 'fixtures/objects/*/')), testPath => {
        const actualPath = path.join(testPath, 'actual.js');
        const expectedPath = path.join(testPath, 'expected.js');

        it(`should transform objects: ${ getTestName(testPath) }`, () => {
            const expected = fs.readFileSync(expectedPath, 'utf8');
            const actual = transformFileSync(actualPath, options).code;
            
            assert.strictEqual(_.trim(actual), _.trim(expected));
        });
    });
});

describe('Patterns for Primitive values', function() {
    const actualPath = path.join(__dirname, 'fixtures/primitive/actual.js');
    const expectedPath = path.join(__dirname, 'fixtures/primitive/expected.js');

    it(`should transform primitives`, () => {
        const expected = fs.readFileSync(expectedPath, 'utf8');
        const actual = transformFileSync(actualPath, options).code;
        
        assert.strictEqual(_.trim(actual), _.trim(expected));
    });
});

describe('Patterns for Mixed values', function() {
    const actualPath = path.join(__dirname, 'fixtures/mixed/actual.js');
    const expectedPath = path.join(__dirname, 'fixtures/mixed/expected.js');

    it(`should transform mixed patterns`, () => {
        const expected = fs.readFileSync(expectedPath, 'utf8');
        const actual = transformFileSync(actualPath, options).code;
        
        assert.strictEqual(_.trim(actual), _.trim(expected));
    });
});

describe('enableByComment option', function() {
    const actualPath = path.join(__dirname, 'fixtures/leadingComment/actual.js');
    const expectedPath = path.join(__dirname, 'fixtures/leadingComment/expected.js');
    it(`should not transform pattern without leading comment '@match'`, () => {
        const expected = fs.readFileSync(expectedPath, 'utf8');
        const actual = transformFileSync(actualPath, {
            'plugins': [[plugin, { 'skipLib': true, 'enableByComment': true}], "transform-object-rest-spread"],
            'presets': ['es2015']
        }).code;

        assert.strictEqual(_.trim(actual), _.trim(expected));
    });
});