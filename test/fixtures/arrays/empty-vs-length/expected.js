"use strict";

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var func = match([arrayIsEmpty(), function (args0) {
    return function () {
        return 0;
    }.apply(undefined, _toConsumableArray(getArgs()()));
}], [lengthIsEqOrAbove(2), function (args0) {
    return function (x, z) {
        return x + z;
    }.apply(undefined, _toConsumableArray(getArgs([0, 1])(args0)));
}]);
