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

        Q.test("eq? works", function () {
            var
                val = new Types.Pair(new Types.Int(2), Types.nil),
                env = new Types.Env({"foo": val, "bar": val}, [Types.Env.makeGround()]);

            function check(expr, result) {
                Q.equal(Squim.run(expr, env).value, result);
            }

            check("(eq?)", true);
            check("(eq? #t)", true);
            check("(eq? #t #t)", true);
            check("(eq? #t #t #t)", true);
            check("(eq? #t #f)", false);
            check("(eq? 1 1)", true);
            check("(eq? 1 2)", false);
            check('(eq? "asd" "asd")', true);
            check('(eq? (list) (list))', true);
            check('(eq? (list 1) (list 1))', false);
            check('(eq? foo bar)', true);
            check('(eq? foo (list 2))', false);
            check('(eq? foo bar (list 2))', false);
        });

        Q.test("equal? works", function () {
            var
                val = new Types.Pair(new Types.Int(2), Types.nil),
                env = new Types.Env({"foo": val, "bar": val}, [Types.Env.makeGround()]);

            function check(expr, result) {
                Q.equal(Squim.run(expr, env).value, result);
            }

            check("(equal?)", true);
            check("(equal? #t)", true);
            check("(equal? #t #t)", true);
            check("(equal? #t #t #t)", true);
            check("(equal? #t #f)", false);
            check("(equal? 1 1)", true);
            check("(equal? 1 2)", false);
            check('(equal? "asd" "asd")', true);
            check('(equal? (list) (list))', true);
            check('(equal? (list 1) (list 1))', true);
            check('(equal? foo bar)', true);
            check('(equal? foo (list 2))', true);
            check('(equal? foo bar (list 2))', true);
        });
    };

    return obj;
}));
