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
    var
        obj = {},
        Types = Squim.types,
        T = Types,
        Symbol = Squim.types.Symbol;

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

        Q.test("types have toString method", function () {
            function check(type, expected) {
                Q.equal(type.toString(), expected);
            }

            Q.equal(Types.Type, "#[type]");
            Q.equal(Types.Int, "#[int]");
            Q.equal(Types.Float, "#[float]");
            Q.equal(Types.Cc, "#[cc]");
            Q.equal(Types.Symbol, "#[symbol]");
            Q.equal(Types.Str, "#[str]");
            Q.equal(Types.Bool, "#[bool]");
            Q.equal(Types.Inert, "#[inert]");
            Q.equal(Types.Ignore, "#[ignore]");
            Q.equal(Types.Pair, "#[pair]");
            Q.equal(Types.Pair.Nil, "#[nil]");
            Q.equal(Types.Obj, "#[obj]");
            Q.equal(Types.Env, "#[env]");
            Q.equal(Types.Applicative, "#[applicative]");
            Q.equal(Types.Operative, "#[operative]");
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

        Q.test("metadata can be attached to types", function () {
            var
                num = new Types.Int(4),
                str = new Types.Str("asd"),
                sym = new Types.Symbol("foo"),
                pair = new Types.Pair(num, Types.nil);

            function check(obj, attrs) {
                var key;

                for (key in attrs) {
                    obj.setMetaData(key, attrs[key]);
                }

                for (key in attrs) {
                    Q.deepEqual(obj.getMetaData(key), attrs[key]);
                }
            }

            Q.equal(num.getMetaData("foo"), undefined);
            Q.equal(str.getMetaData("foo", 4), 4);

            check(num, {"a": 1});
            check(str, {"a": 1, "b": false});
            check(sym, {"a": 1, "b": false, "string": "yes, I'm a string"});
            check(pair, {"a": 1, "b": false, "string": "yes, I'm a string", "d": [1, 2, 3]});
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

        Q.test("Obj.apply", function () {
            var jsobj = {name: "mariano", age: 27, tags: ["foo", "bar"], foo: {bar: 1, baz: "asd", argh: {lala: "hi"}}},
                obj = Types.Obj.fromJsObject(jsobj),
                env = new Types.Env({"obj": obj}, [Types.Env.makeGround()]);

            Q.equal(Squim.run("(obj)", env), obj, "calling obj without args evaluates to itself");
            Q.equal(Squim.run("(eq? (obj) obj)", env), Types.t, "eq? works on obj");
            Q.equal(Squim.run("(obj name)", env), obj.attrs.name, "calling obj with one symbol returns that attribute");
            Q.equal(Squim.run('(equal? (obj name) "mariano")', env), Types.t, "calling obj with one symbol returns that attribute");
            Q.equal(Squim.run("(obj foo bar)", env), obj.attrs.foo.attrs.bar, "calling obj with symbols returns that attribute");
            Q.equal(Squim.run('(equal? (obj foo bar) 1)', env), Types.t, "calling obj with one symbol returns that attribute");
            Q.equal(Squim.run('(equal? (obj foo argh lala) "hi")', env), Types.t, "calling obj with symbols returns that attribute");
            Q.equal(Squim.run("(obj foo argh lala)", env), obj.attrs.foo.attrs.argh.attrs.lala, "calling with symbols returns that attribute");

            // XXX: this may change to throw an error later
            Q.equal(Squim.run('(obj inexistent)', env), Types.inert, "calling obj with unknown symbol returns inert");
            Q.equal(Squim.run('(equal? (obj inexistent) #inert)', env), Types.t, "calling obj with unknown symbol returns inert");
        });

        Q.test("Env.fromJsObject", function () {
            var env = Types.Env.fromJsObject({"obj": "asd"}, [42]);

            Q.equal(env.bindings.obj instanceof Types.Str, true);
            Q.equal(env.bindings.obj.value, "asd");
            Q.equal(env.parents[0], 42);
        });

        Q.test("squimify", function () {
            function check(value, expected) {
                var
                    result = Types.squimify(value),
                    actual = result.toString();

                Q.equal(actual, expected, actual + " should be " + expected);
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
            check(/foo.bar.baz/, '(foo bar baz) :{hint "objattrs"}');
            check(/$foo!/, "$foo!");
            check('', '""');
            check('foo', '"foo"');
            check([1], "(1)");
            check([1, 1.2], "(1 1.2)");
            check([1, 1.2, false], "(1 1.2 #f)");
            check([1, 1.2, false, true], "(1 1.2 #f #t)");
            check([1, 1.2, false, true, "asd"], '(1 1.2 #f #t "asd")');
            check([1, 1.2, [false, true, "asd"], []], '(1 1.2 \n  (#f #t "asd") ())');
            check({name: "mariano"}, '{name "mariano"}');
            // this assumes attrs will be serialized in the same order
            check({name: "mariano", age: 27}, '{name "mariano" age 27}');

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

        Q.test("match list", function () {
            var env = Types.Env.makeGround(), result;

            function validate(listStr, names, exactNumber, types) {
                var list = Squim.run("(list " + listStr + ")", env),
                    items = Types.util.matchList(list, names, exactNumber, types);

                return items;
            }

            function check(listStr, names, exactNumber, types, values) {
                var
                    i, name, item, value,
                    items = validate(listStr, names, exactNumber, types),
                    myTypes = types || [];

                Q.ok(items.ok, "result shoudt be ok");
                values = values || [];

                if (names === undefined) {
                    return;
                }

                for (i = 0; i < names.length; i += 1) {
                    name = names[i];
                    item = items.val[name];
                    value = values[i];

                    Q.ok(item, "result should have value " + name);

                    if (value !== undefined) {
                        Q.equal(item.value, value, "" + item.value + " == " + value);
                    }
                }
            }

            check("");
            check("", []);
            check("1", ["num"], true);
            check("1", ["num"], true, undefined, [1]);
            check("1", ["num"], true, [Types.Int], [1]);

            check("1 2", ["num"], false);
            check("1 2", ["num"], false, undefined, [1]);
            check("1 2", ["num"], false, [Types.Int], [1]);

            result = validate("1 2", ["num"], true);
            Q.equal(result.ok, false, "should fail validation");
            Q.equal(result.sizeMismatch, true, "should fail because of size mismatch");
            Q.equal(result.listSize, 2, "should provide list size");
            Q.equal(result.namesSize, 1, "should provide names size");
            Q.equal(result.reason, "expected exactly 1 items\n");

            result = validate("1", ["num", "name"], true);
            Q.equal(result.ok, false, "should fail validation");
            Q.equal(result.sizeMismatch, true, "should fail because of size mismatch");
            Q.equal(result.listSize, 1, "should provide list size");
            Q.equal(result.namesSize, 2, "should provide names size");
            Q.equal(result.reason, "expected exactly 2 items\n");

            result = validate("1", ["num", "name"], false);
            Q.equal(result.ok, false, "should fail validation");
            Q.equal(result.sizeMismatch, true, "should fail because of size mismatch");
            Q.equal(result.listSize, 1, "should provide list size");
            Q.equal(result.namesSize, 2, "should provide names size");
            Q.equal(result.reason, "expected at least 2 items\n");

            result = validate("1", ["num"], true, [Types.Str]);
            Q.equal(result.ok, false, "should fail validation");
            Q.equal(result.typeErrors.num, Types.Str);
            Q.equal(result.reason, "expected 'num' to be of type #[str], got 1\n");

            result = validate('1 "asd"', ["num", "name"], true, [Types.Str, Types.Str]);
            Q.equal(result.ok, false, "should fail validation");
            Q.equal(result.typeErrors.num, Types.Str);
            Q.equal(result.reason, "expected 'num' to be of type #[str], got 1\n");

            check('1 "asd"', ["num", "name"], true, [Types.Int, Types.Str], [1, "asd"]);
            check('1 "asd" #t', ["num", "name", "yes?"], true, [Types.Int, Types.Str, Types.Bool], [1, "asd", true]);
            check('1 "asd" #t 1.2', ["num", "name", "yes?", "avg"], true, [Types.Int, Types.Str, Types.Bool, Types.Float], [1, "asd", true, 1.2]);

            result = validate('1 "asd" #t 1.2', ["num", "name", "yes?", "avg"], true, [Types.Int, Types.Str, Types.Bool, Types.Int], [1, "asd", true, 1.2]);
            Q.equal(result.ok, false, "should fail validation");
            Q.equal(result.typeErrors.avg, Types.Int);
            Q.equal(result.reason, "expected 'avg' to be of type #[int], got 1.2\n");
        });

        Q.test("withParams works", function () {
            var env = Types.Env.makeGround();

            function check(listStr, names, exactNumber, types, callback, onError) {
                var
                    result,
                    list = Squim.run("(list " + listStr + ")", env),
                    cc   = new T.Cc(list, env, function (args) {
                        throw args;
                    });

                function wrappedCallback() {
                    var result = callback.apply(null, arguments);

                    Q.start();
                    return result;
                }

                function wrappedOnError() {
                    var result = null;

                    Q.start();
                    result = onError.apply(null, arguments);

                    return result;
                }

                Q.stop();
                result = Squim.trampoline(
                    T.util.withParams(list, cc, names, exactNumber, types,
                                      wrappedCallback,
                                      (onError) ? wrappedOnError : onError));

                return result;
            }

            // exact params and correct matching
            check('1 "asd"', ["num", "name"], true, [T.Int, T.Str], function (args) {
                Q.equal(args.num.value, 1);
                Q.equal(args.name.value, "asd");
            });

            // more params allowed and correct matching
            check('1 "asd" 4 #t', ["num", "name"], false, [T.Int, T.Str], function (args) {
                Q.equal(args.num.value, 1);
                Q.equal(args.name.value, "asd");
            });

            // expect at least one argument, send nil
            check('', ["num", "name"], true, [T.Int, T.Int],
                function () {
                    Q.ok(false, "shouldn't come to this function");
                },
                function (error) {
                    Q.equal(error.reason, "expected at least 2 items, got nil\n");
                });


            // type error with error callback
            check('1 "asd"', ["num", "name"], true, [T.Int, T.Int],
                function () {
                    Q.ok(false, "shouldn't come to this function");
                },
                function (error) {
                    Q.equal(error.reason, "expected 'name' to be of type #[int], got \"asd\"\n");
                });

            // type error without error callback should raise exception
            Q.raises(function () {
                check('1 "asd"', ["num", "name"], true, [T.Int, T.Int],
                    function () {
                        Q.ok(false, "shouldn't come to this function");
                    });
            }, function (error) {
                Q.start();
                Q.ok(!error.ok, "it's actually an error");
                Q.equal(error.reason, "expected 'name' to be of type #[int], got \"asd\"\n", "the reason is the correct one");
                return true;
            });

        });

        Q.test("gets CallableExpected when calling non callable", function () {
            Q.raises(function () {
                T.run(new T.Pair(T.t, T.nil), T.Env.makeGround());
            }, function (error) {
                Q.equal(error.name, "CallableExpected");
                Q.equal(error.args.got, "#t");
                Q.equal(error.args.ctx.value.value, true);
                Q.equal(error.args.ctx.pair.left.value, true);
                Q.equal(error.args.ctx.pair.right, T.nil);

                return true;
            });
        });

    };

    return obj;
}));
