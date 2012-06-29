/*global define QUnit SquimTypes*/
(function (root, factory) {
    "use strict";

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['qunit', 'squim.types'], function (Q, Types) {
            // Also create a global in case some scripts
            // that are loaded still are looking for
            // a global even when an AMD loader is in use.
            return (root.SquimSymbolTest = factory(Q, Types));
        });
    } else {
        // Browser globals
        root.SquimSymbolTest = factory(QUnit, SquimTypes);
    }
}(this, function (Q, Types) {
    "use strict";
    var obj = {}, Symbol = Types.Symbol;

    obj.test = function () {
        Q.module("Squim.Symbol");

        Q.test("construct symbol", function () {
            var symbol = new Symbol("asd");

            Q.ok(symbol instanceof Symbol, "symbol is instance of Symbol");
            Q.equal(symbol.value, "asd");
            Q.equal(symbol.toString(), "asd");
        });

        Q.test("evaling a symbol on an env returns the binding", function () {
            var symbol = new Symbol("foo");

            Q.equal(symbol.eval_(new Types.Env({foo: 4})), 4);
            Q.equal(symbol.eval_(new Types.Env({}, [new Types.Env({foo: 4})])), 4);
            Q.equal(symbol.eval_(new Types.Env({foo: 5}, [new Types.Env({foo: 4})])), 5);
        });
    };

    return obj;
}));
