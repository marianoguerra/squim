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
            check(new Types.Obj({}));
            check(new Types.Cc());
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

            function check(env, expected) {
                (new Types.Cc(symbol, env, function (result) {
                    Q.equal(result, expected);
                })).run();
            }

            check(new Types.Env({foo: 4}), 4);
            check(new Types.Env({}, [new Types.Env({foo: 4})]), 4);
            check(new Types.Env({foo: 5}, [new Types.Env({foo: 4})]), 5);
        });

        Q.test("gather arguments gather all args in a var if arg list is a symbol", function () {
            var bound = Types.util.gatherArguments(new Types.Pair(new Types.Int(1), Types.nil), new Types.Symbol("x")).x;
            Q.equal(bound.left.value, 1);
            Q.equal(bound.right, Types.nil);
        });

        Q.test("Obj", function () {
            var jsobj = {name: "mariano", age: 27, tags: ["foo", "bar"], foo: {bar: 1, baz: "asd"}},
                obj = Types.Obj.fromJsObject(jsobj);

            Q.equal(obj.attrs.name.value, jsobj.name);
            Q.equal(obj.attrs.age.value, jsobj.age);
            Q.equal(obj.attrs.tags.left.value, "foo");
            Q.equal(obj.attrs.tags.right.left.value, "bar");
            Q.equal(obj.attrs.foo.attrs.bar.value, jsobj.foo.bar);
            Q.equal(obj.attrs.foo.attrs.baz.value, jsobj.foo.baz);

            Q.ok(obj.attrs.name instanceof Types.Str);
            Q.ok(obj.attrs.age instanceof Types.Int);
            Q.ok(obj.attrs.tags instanceof Types.Pair);
            Q.ok(obj.attrs.tags.left instanceof Types.Str);
            Q.ok(obj.attrs.tags.right.left instanceof Types.Str);
            Q.ok(obj.attrs.foo instanceof Types.Obj);
            Q.ok(obj.attrs.foo.attrs.bar instanceof Types.Int);
            Q.ok(obj.attrs.foo.attrs.baz instanceof Types.Str);

            Q.deepEqual(obj.toJs(), jsobj);

        });

        Q.test("squimify", function () {
            function check(value, expected) {
                Q.equal(Types.squimify(value).toString(), expected);
            }

            check(1, "1");
            check(1.2, "1.2");
            check(false, "#f");
            check(true, "#t");
            check(/#ignore/, "#ignore");
            check(/#inert/, "#inert");
            check(null, "()");
            check([], "()");
            check(/foo/, "foo");
            check(/$foo!/, "$foo!");
            check('', '""');
            check('foo', '"foo"');
            check([1], "(1)");
            check([1, 1.2], "(1 1.2)");
            check([1, 1.2, false], "(1 1.2 #f)");
            check([1, 1.2, false, true], "(1 1.2 #f #t)");
            check([1, 1.2, false, true, "asd"], '(1 1.2 #f #t "asd")');
            check([1, 1.2, [false, true, "asd"], []], '(1 1.2 (#f #t "asd") ())');
            check({name: "mariano"}, '{"name":"mariano"}');
            // this assumes attrs will be serialized in the same order
            check({name: "mariano", age: 27}, '{"name":"mariano","age":27}');

            check(new Types.Int(1), "1");
            check(new Types.Float(1.2), "1.2");
            check(new Types.Bool(false), "#f");
            check(new Types.Bool(true), "#t");
            check(new Types.Str(''), '""');
            check(new Types.Str('foo'), '"foo"');
            check(new Types.Symbol('foo'), 'foo');
            check(Types.nil, "()");
            check(Types.ignore, "#ignore");
            check(Types.inert, "#inert");
            check(Types.t, "#t");
            check(Types.f, "#f");
        });
    };

    return obj;
}));
