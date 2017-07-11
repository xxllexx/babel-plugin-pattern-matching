"use strict";

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var func = match([isEmptyObject(), function (args0) {
    return function () {
        return empty();
    }.apply(undefined, _toConsumableArray(getArgs()(args0)));
}], [andPredicate(keysExists("x"), objKeysLengthIsEqOrAbove(1)), function (args0) {
    return function (x) {
        return exists(x);
    }.apply(undefined, _toConsumableArray(getArgs(["x"])(args0)));
}]);
