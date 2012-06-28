/*global define QUnit SquimEnv*/
(function (root, factory) {
    "use strict";

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['qunit', 'squim.env'], function (Q, Env) {
            // Also create a global in case some scripts
            // that are loaded still are looking for
            // a global even when an AMD loader is in use.
            return (root.SquimEnvTest = factory(Q, Env));
        });
    } else {
        // Browser globals
        root.SquimEnvTest = factory(QUnit, SquimEnv);
    }
}(this, function (Q, Env) {
    "use strict";
    var obj = {};

    obj.test = function () {
        Q.module("Squim.Env");

        Q.test("construct env", function () {
            var env = new Env();

            Q.ok(env instanceof Env, "env is instance of Env");
            Q.ok(typeof env.define === "function", "define is a function");
            Q.ok(typeof env.get === "function", "getis a function");
        });

        Q.test("parent and bindings is set in constructor", function () {
            var
                bindings = {a: 1},
                parents = [1],
                env = new Env(bindings, parents);

            Q.deepEqual(env.bindings, bindings);
            Q.deepEqual(env.parents, parents);
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

        Q.test("define sets the binding in env when present in parent", function () {
            var
                parent = new Env({foo: 42}),
                env = new Env({}, [parent]);

            env.define("foo", 4);

            Q.equal(env.bindings.foo, 4);
            Q.equal(env.parents[0].bindings.foo, 42);
        });

        Q.test("get returns the binding set in env", function () {
            var env = new Env({foo: 1985});

            Q.equal(env.get("foo"), 1985);
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
