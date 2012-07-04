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

        Q.module("Squim.Type");

        Q.test("types are subclasses of Type", function () {
            function check(obj) {
                Q.ok(obj instanceof Squim.types.Type);
            }

            check(new Types.Int(1));
            check(new Types.Float(1.2));
            check(new Types.Pair());
            check(new Types.Pair.Nil());
            check(new Types.Bool(false));
            check(new Types.Applicative());
            check(new Types.Operative(new Types.Pair(), Types.ignore));
            check(new Types.Inert());
            check(new Types.Ignore());
            check(new Types.Str("asd"));
            check(new Types.Env());
        });

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

        Q.test("gather arguments gather all args in a var if arg list is a symbol", function () {
            var bound = Types.util.gatherArguments(new Types.Pair(new Types.Int(1), Types.nil), new Types.Symbol("x")).x;
            Q.equal(bound.left.value, 1);
            Q.equal(bound.right, Types.nil);
        });
    };

    return obj;
}));
