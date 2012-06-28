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
        BadMatch: "BadMatch"
    };

    obj.UnboundSymbol = function (name, ctx) {
        throw makeException(obj.type.UnboundSymbol, {name: name, ctx: ctx});
    };

    obj.CombinerExpected = function (got, ctx) {
        throw makeException(obj.type.CombinerExpected, {got: got, ctx: ctx});
    };

    obj.BadMatch = function (msg, ctx) {
        throw makeException(obj.type.BadMatch, {msg: msg, ctx: ctx});
    };

    return obj;
}));
