"use strict";

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var func = match([isEmptyObject(), function (args0) {
    return function () {
        return empty();
    }.apply(undefined, _toConsumableArray(getArgs([])(args0)));
}], [andPredicate(keysExists("a"), objKeysLengthIsEqOrAbove(1)), function (args0) {
    return function (a, rest) {
        return t && r(rest);
    }.apply(undefined, _toConsumableArray(getArgs(["a", "$$get-rest-params"])(args0)));
}]);