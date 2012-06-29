/*global define QUnit Squim*/
(function (root, factory) {
    "use strict";

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['qunit', 'squim'], function (Q, Squim) {
            // Also create a global in case some scripts
            // that are loaded still are looking for
            // a global even when an AMD loader is in use.
            return (root.SquimSymbolTest = factory(Q, Squim));
        });
    } else {
        // Browser globals
        root.SquimSymbolTest = factory(QUnit, Squim);
    }
}(this, function (Q, Squim) {
    "use strict";
    var obj = {}, Types = Squim.types, Symbol = Squim.types.Symbol;

    obj.test = function () {
        Q.module("Squim.Symbol");

        Q.test("construct symbol", function () {
            function check(name) {
                var symbol = new Symbol(name);

                Q.ok(symbol instanceof Symbol, "symbol is instance of Symbol");
                Q.equal(symbol.value, name);
                Q.equal(symbol.toString(), name);
            }

            check("$lambda");
            check("list->vector");
            check("+");
            check("<=?");
            check("the-word-recursion-has-many-meanings");
            check("q");
            check("soup");
            check("V17a");
            check("a34kTMNs");
        });

        Q.test("evaling a symbol on an env returns the binding", function () {
            var symbol = new Symbol("foo");

            Q.equal(symbol.eval_(new Types.Env({foo: 4})), 4);
            Q.equal(symbol.eval_(new Types.Env({}, [new Types.Env({foo: 4})])), 4);
            Q.equal(symbol.eval_(new Types.Env({foo: 5}, [new Types.Env({foo: 4})])), 5);
        });

        Q.test("boolean? works", function () {
            function check(expr, result) {
                Q.equal(Squim.run(expr).value, result);
            }

            check("(boolean? #t)", true);
            check("(boolean? #f)", true);
            check("(boolean? #f #t)", true);
            check("(boolean? #f #t #t #f)", true);
            check("(boolean? 1)", false);
            check("(boolean? 1.2)", false);
            check('(boolean? "asd")', false);
            check('(boolean? ())', false);
            check('(boolean? (list 1))', false);
            check("(boolean? #f #t #t #f 1)", false);
        });
    };

    return obj;
}));
