/*global define*/
(function (root, factory) {
    "use strict";

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], function () {
            // Also create a global in case some scripts
            // that are loaded still are looking for
            // a global even when an AMD loader is in use.
            return (root.SquimError = factory());
        });
    } else {
        // Browser globals
        root.SquimError = factory();
    }
}(this, function () {
    "use strict";
    var obj = {};

    function SquimException(name, args) {
        this.name = name;
        this.args = args;
    }

    SquimException.prototype.toString = function () {
        return "" + this.name + ": " + JSON.stringify(this.args);
    };

    function makeException(name, args) {
        return new SquimException(name, args);
    }

    obj.type = {
        UnboundSymbol: "UnboundSymbol",
        CombinerExpected: "CombinerExpected",
        ListExpected: "ListExpected",
        BooleanExpected: "BooleanExpected",
        SymbolExpected: "SymbolExpected",
        EnvironmentExpected: "EnvironmentExpected",
        BadMatch: "BadMatch",
        MutationError: "MutationError",
        ValueError: "ValueError",
        CallableExpected: "CallableExpected"
    };

    obj.UnboundSymbol = function (name, ctx) {
        throw makeException(obj.type.UnboundSymbol, {name: name, ctx: ctx});
    };

    obj.CombinerExpected = function (got, ctx) {
        throw makeException(obj.type.CombinerExpected, {got: got, ctx: ctx});
    };

    obj.ListExpected = function (got, ctx) {
        throw makeException(obj.type.ListExpected, {got: got, ctx: ctx});
    };

    obj.BooleanExpected = function (got, ctx) {
        throw makeException(obj.type.BooleanExpected, {got: got, ctx: ctx});
    };

    obj.SymbolExpected = function (got, ctx) {
        throw makeException(obj.type.SymbolExpected, {got: got, ctx: ctx});
    };

    obj.CallableExpected = function (got, ctx) {
        throw makeException(obj.type.CallableExpected, {got: got, ctx: ctx});
    };

    obj.EnvironmentExpected = function (got, ctx) {
        throw makeException(obj.type.EnvironmentExpected, {got: got, ctx: ctx});
    };

    obj.BadMatch = function (msg, ctx) {
        throw makeException(obj.type.BadMatch, {msg: msg, ctx: ctx});
    };

    obj.ValueError = function (msg, ctx) {
        throw makeException(obj.type.ValueError, {msg: msg, ctx: ctx});
    };

    obj.MutationError = function (msg, ctx) {
        throw makeException(obj.type.MutationError, {msg: msg, ctx: ctx});
    };

    return obj;
}));
