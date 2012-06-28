/*global define QUnit SquimTypes*/
(function (root, factory) {
    "use strict";

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['qunit', 'squim.types'], function (Q, Types) {
            // Also create a global in case some scripts
            // that are loaded still are looking for
            // a global even when an AMD loader is in use.
            return (root.SquimPairTest = factory(Q, Types));
        });
    } else {
        // Browser globals
        root.SquimPairTest = factory(QUnit, SquimTypes);
    }
}(this, function (Q, Types) {
    "use strict";
    var obj = {}, Pair = Types.Pair;

    obj.test = function () {
        Q.module("Squim.Pair");

        Q.test("construct pair", function () {
            var pair = new Pair();

            Q.ok(pair instanceof Pair, "pair is instance of Pair");
        });

        Q.test("construct pair with arguments", function () {
            var pair = new Pair(1, 2);

            Q.ok(pair instanceof Pair, "pair is instance of Pair");
            Q.equal(pair.left, 1);
            Q.equal(pair.right, 2);
        });

        Q.test("nil instance exists and is instance of Pair.Nil", function () {
            Q.ok(Pair.nil instanceof Pair.Nil);
        });

        Q.test("nil instance representation is '()'", function () {
            Q.equal(Pair.nil.toString(), "()");
        });
    };

    return obj;
}));
