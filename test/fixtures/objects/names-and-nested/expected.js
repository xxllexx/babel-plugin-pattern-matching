"use strict";

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var func = match([andPredicate(keysExists("v"), keysExists("a"), objKeysLengthIsEqOrAbove(2)), function (args0) {
    return function (m, c, args) {
        return test();
    }.apply(undefined, _toConsumableArray(getArgs(["a", "v", "$$get-rest-params"])(args0)));
}], [andPredicate(keyPredicate("a", andPredicate(keysExists("b"), objKeysLengthIsEqOrAbove(1))), objKeysLengthIsEqOrAbove(1)), function (args0) {
    return function (b) {
        return some();
    }.apply(undefined, _toConsumableArray(getArgs([{
        a: ["b"]
    }])(args0)));
}]);
