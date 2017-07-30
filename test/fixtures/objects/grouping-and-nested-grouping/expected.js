"use strict";

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var func = function _func() {
    return match([andPredicate(keysExists("v"), keysExists("a"), objKeysLengthIsEqOrAbove(2)), function (args0) {
        return function (all, m, c) {
            return test();
        }.apply(undefined, _toConsumableArray(getArgs(["$$get-all-object", "a", "v"])(args0)));
    }], [andPredicate(keyPredicate("v", andPredicate(keysExists("t"), objKeysLengthIsEqOrAbove(1))), keysExists("a"), objKeysLengthIsEqOrAbove(2)), function (args0) {
        return function (all, m, all2, t) {
            return test();
        }.apply(undefined, _toConsumableArray(getArgs(["$$get-all-object", "a", {
            v: ["$$get-all-object", "t"]
        }])(args0)));
    }]).apply(undefined, arguments);
};
