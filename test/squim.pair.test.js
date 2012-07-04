/*global define QUnit SquimTypes SquimGround*/
(function (root, factory) {
    "use strict";

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['qunit', 'squim.types', 'squim.ground'], function (Q, Types, Ground) {
            // Also create a global in case some scripts
            // that are loaded still are looking for
            // a global even when an AMD loader is in use.
            return (root.SquimPairTest = factory(Q, Types, Ground));
        });
    } else {
        // Browser globals
        root.SquimPairTest = factory(QUnit, SquimTypes, SquimGround);
    }
}(this, function (Q, Types, Ground) {
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

        Q.test("toJs returns a js representation of a pair", function () {
            Q.deepEqual((new Pair(new Types.Int(1), new Pair(new Types.Int(2), Pair.nil))).toJs(), [1, 2]);
        });

        Q.test("toStrings returns a readable representation of a pair", function () {
            Q.deepEqual((new Pair(new Types.Int(1), new Pair(new Types.Int(2), Pair.nil))).toString(), "(1 2)");
        });

        Q.test("_expand returns a list with the values evaluated in env", function () {
            var
                pair = new Pair(new Types.Symbol("foo"), new Pair(new Types.Symbol("bar"), Pair.nil)),
                env = new Types.Env(),
                cc;

            env.define("foo", new Types.Int(1));
            env.define("bar", new Types.Int(2));

            cc = new Types.Cc(pair, env, function (result) {
                Q.deepEqual(result.toString(), "(1 2)");
            }, true);

            while (cc) {
                cc = cc.eval_();
            }
        });

        Q.test("eval_ evaluates a pair in env", function () {
            var
                // (list foo bar)
                pair = new Pair(new Types.Symbol("cons"), new Pair(new Types.Symbol("foo"), new Pair(new Types.Symbol("bar"), Pair.nil))),
                ground = Ground.makeGround(),
                env = new Types.Env({}, [ground]),
                cc;

            env.define("foo", new Types.Int(1));
            env.define("bar", new Types.Int(2));

            cc = new Types.Cc(pair, env, function (result) {
                Q.deepEqual(result.toString(), "(1 . 2)");
            });

            while (cc) {
                cc = cc.eval_();
            }
        });
    };

    return obj;
}));
