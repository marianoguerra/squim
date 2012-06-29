/*global define QUnit SquimUtil*/
(function (root, factory) {
    "use strict";

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['qunit', 'squim.util'], function (Q, Util) {
            // Also create a global in case some scripts
            // that are loaded still are looking for
            // a global even when an AMD loader is in use.
            return (root.SquimSymbolTest = factory(Q, Util));
        });
    } else {
        // Browser globals
        root.SquimSymbolTest = factory(QUnit, SquimUtil);
    }
}(this, function (Q, Util) {
    "use strict";
    var obj = {};

    obj.test = function () {
        Q.module("Squim.Util");

        Q.test("is array", function () {
            Q.ok(Util.isArray([]), "empty array is array");
            Q.ok(Util.isArray([1]), "array is array");

            Q.ok(!Util.isArray({}), "empty object array is array");
            Q.ok(!Util.isArray({a: 1}), "object array is array");
            Q.ok(!Util.isArray(1), "number is not array");
            Q.ok(!Util.isArray(1.2), "number is not array");
            Q.ok(!Util.isArray(false), "bool is not array");
            Q.ok(!Util.isArray(""), "string is not array");
            Q.ok(!Util.isArray("asd"), "string is not array");
        });
    };

    return obj;
}));
