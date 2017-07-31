"use strict";

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var func = match([lengthIsEqOrAbove(1), function (args0) {
    return function (x, rest) {
        return fn(x, rest);
    }.apply(undefined, _toConsumableArray(getArgs([0, "$$get-rest-params"])(args0)));
}], [lengthIsEqOrAbove(2), function (args0) {
    return function (x, y, zs) {
        return fn.apply(undefined, [x, y].concat(_toConsumableArray(zs)));
    }.apply(undefined, _toConsumableArray(getArgs([0, 1, "$$get-rest-params"])(args0)));
}]);
