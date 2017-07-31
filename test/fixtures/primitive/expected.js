"use strict";

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var func = match([isValue("a"), function (args0) {
    return function () {
        return "result is a";
    }.apply(undefined, _toConsumableArray(getArgs()(args0)));
}], [isValue(0), function (args0) {
    return function () {
        return "result is 0";
    }.apply(undefined, _toConsumableArray(getArgs()(args0)));
}], [isValue(true), function (args0) {
    return function () {
        return "result is true";
    }.apply(undefined, _toConsumableArray(getArgs()(args0)));
}], [isNull(), function (args0) {
    return function () {
        return "result is null";
    }.apply(undefined, _toConsumableArray(getArgs()()));
}], [isUndefined(), function (args0) {
    return function () {
        return "result is undefined";
    }.apply(undefined, _toConsumableArray(getArgs()()));
}], [_isNaN(), function (args0) {
    return function () {
        return "result is NaN";
    }.apply(undefined, _toConsumableArray(getArgs()()));
}]);