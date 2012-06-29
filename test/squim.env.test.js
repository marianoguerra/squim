/*global define QUnit SquimEnv SquimTypes SquimError*/
(function (root, factory) {
    "use strict";

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['qunit', 'squim.env', 'squim.types', 'squim.error'], function (Q, Env, Types, Error) {
            // Also create a global in case some scripts
            // that are loaded still are looking for
            // a global even when an AMD loader is in use.
            return (root.SquimEnvTest = factory(Q, Env, Types, Error));
        });
    } else {
        // Browser globals
        root.SquimEnvTest = factory(QUnit, SquimEnv, SquimTypes, SquimError);
    }
}(this, function (Q, Env, Types, Error) {
    "use strict";
    var obj = {};

    function isArray(obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    }

    obj.test = function () {
        Q.module("Squim.Env");

        Q.test("construct env", function () {
            var env = new Env();

            Q.ok(env instanceof Env, "env is instance of Env");
            Q.ok(typeof env.define === "function", "define is a function");
            Q.ok(typeof env.get === "function", "getis a function");
            Q.ok(isArray(env.parents), "parents is an array");
            Q.ok(typeof env.bindings === "object", "bindings is an object");
            Q.equal(env.inmutable, false, "env is mutable by default");
        });

        Q.test("parent, bindings and inmutability are set in constructor", function () {
            var
                bindings = {a: 1},
                parents = [1],
                env = new Env(bindings, parents, true);

            Q.deepEqual(env.bindings, bindings);
            Q.deepEqual(env.parents, parents);
            Q.equal(env.inmutable, true);
        });

        Q.test("default parent and bindings set in constructor", function () {
            var env = new Env();

            Q.deepEqual(env.bindings, {});
            Q.deepEqual(env.parents, []);
        });

        Q.test("define sets the binding in env", function () {
            var env = new Env();

            env.define("foo", 4);

            Q.equal(env.bindings.foo, 4);
        });

        Q.test("define sets the binding when a symbol is used", function () {
            var env = new Env();

            env.define(new Types.Symbol("foo"), 4);

            Q.equal(env.bindings.foo, 4);
        });

        Q.test("define sets the binding in env when present in parent", function () {
            var
                parent = new Env({foo: 42}),
                env = new Env({}, [parent]);

            env.define("foo", 4);

            Q.equal(env.bindings.foo, 4);
            Q.equal(env.parents[0].bindings.foo, 42);
        });

        Q.test("inmutable env can't be mutated", function () {
            var
                env = new Env({}, [], true);

            Q.raises(
                function () {
                    env.define("foo", 4);
                },
                function (error) {
                    return error.name === Error.type.MutationError;
                }
            );

            Q.equal(env.bindings.foo, undefined);
        });

        Q.test("get returns the binding set in env", function () {
            var env = new Env({foo: 1985});

            Q.equal(env.get("foo"), 1985);
        });

        Q.test("get returns the binding set in env when passing a symbol", function () {
            var env = new Env({foo: 1985});

            Q.equal(env.get(new Types.Symbol("foo")), 1985);
        });

        Q.test("get returns the binding set in parent env", function () {
            var
                parent = new Env({"foo": 14}),
                env = new Env({}, [parent]);

            Q.equal(env.get("foo"), 14);
        });

        Q.test("get returns the binding set in child if present in parent too", function () {
            var
                parent = new Env({foo: 14}),
                env = new Env({foo: 15}, [parent]);

            Q.equal(env.get("foo"), 15);
        });
    };

    return obj;
}));
