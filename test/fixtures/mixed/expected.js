'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var func = match([lengthIsEqOrAbove(3), lengthIsEqOrAbove(1), function (args0, args1) {
    return function (x, t, rest, b, bs) {
        return x + z;
    }.apply(undefined, _toConsumableArray(getArgs([0, 2, '$$get-rest-params'], [0, '$$get-rest-params'])(args0, args1)));
}], [andPredicate(keysExists('x'), objKeysLengthIsEqOrAbove(1)), andPredicate(keyPredicate('b', andPredicate(keyPredicate('s', andPredicate(keysExists('y'), objKeysLengthIsEqOrAbove(1))), objKeysLengthIsEqOrAbove(1))), keyPredicate('d', lengthIsEqOrAbove(1)), keysExists('n'), objKeysLengthIsEqOrAbove(3)), function (args0, args1) {
    return function (all, t, n, all1, x, z, all2, y) {
        return console.log('first ', all, all1, all2);
    }.apply(undefined, _toConsumableArray(getArgs(['$$get-all-object', 'x'], ['n', {
        d: ['$$get-all-object', 0, '$$get-rest-params']
    }, {
        b: [{
            s: ['$$get-all-object', 'y']
        }]
    }])(args0, args1)));
}], [andPredicate(keysExists('y'), objKeysLengthIsEqOrAbove(1)), andPredicate(keyPredicate('b', andPredicate(keyPredicate('s', andPredicate(keysExists('y'), objKeysLengthIsEqOrAbove(1))), objKeysLengthIsEqOrAbove(1))), keyPredicate('d', lengthIsEqOrAbove(1)), keysExists('n'), objKeysLengthIsEqOrAbove(3)), function (args0, args1) {
    return function (all, t, n, all1, x, z, all2, y) {
        return console.log('second ', all2, all1, all);
    }.apply(undefined, _toConsumableArray(getArgs(['$$get-all-object', 'y'], ['n', {
        d: ['$$get-all-object', 0, '$$get-rest-params']
    }, {
        b: [{
            s: ['$$get-all-object', 'y']
        }]
    }])(args0, args1)));
}], [catchAll(), catchAll(), function (args0, args1) {
    return function (n, m) {
        return console.log(n, m);
    }.apply(undefined, _toConsumableArray(getArgs()(args0, args1)));
}]);
