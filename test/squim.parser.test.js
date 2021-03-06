/*global define QUnit SquimParser SquimTypes*/
(function (root, factory) {
    "use strict";

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['qunit', 'squim.parser', 'squim.types'], function (Q, Parser, Types) {
            // Also create a global in case some scripts
            // that are loaded still are looking for
            // a global even when an AMD loader is in use.
            return (root.SquimParserTest = factory(Q, Parser, Types));
        });
    } else {
        // Browser globals
        root.SquimParserTest = factory(QUnit, SquimParser, SquimTypes);
    }
}(this, function (Q, Parser, Types) {
    "use strict";
    var obj = {}, Pair = Types.Pair;

    obj.test = function () {
        Q.module("Squim.Parser");

        Q.test("construct pair", function () {
            var
                oneItem = Parser.parse('(1)'),
                twoItems = Parser.parse('(1 2)'),
                threeItems = Parser.parse('(1 2 3)'),
                dotted = Parser.parse('(1 . 2)');

            Q.equal(Parser.parse('()'), Pair.nil);
            Q.equal(oneItem.left.value, 1);
            Q.equal(oneItem.right, Pair.nil);

            Q.equal(twoItems.left.value, 1);
            Q.equal(twoItems.right.left.value, 2);
            Q.equal(twoItems.right.right, Pair.nil);

            Q.equal(threeItems.left.value, 1);
            Q.equal(threeItems.right.left.value, 2);
            Q.equal(threeItems.right.right.left.value, 3);
            Q.equal(threeItems.right.right.right, Pair.nil);

            Q.equal(dotted.left.value, 1);
            Q.equal(dotted.right.value, 2);
        });

        Q.test("parses symbols", function () {
            function check(expr, expectedSymbolValue) {
                var exp = Parser.parse(expr);

                Q.equal(exp.left.value, expectedSymbolValue);
            }

            check("(foo)", "foo");
            check("(foo-bar!baz/argh)", "foo-bar!baz/argh");
            check("($set!)", "$set!");
            check("($long-dashed-name-42!)", "$long-dashed-name-42!");
        });

        Q.test("parses integer", function () {
            function check(expr, expectedValue) {
                var exp = Parser.parse(expr);

                Q.equal(exp.left.value, expectedValue, "" + expr + " === " + expectedValue);
            }

            check("(12)", 12);
            check("(#d12)", 12);
            check("(+#d12)", 12);
            check("(+12)", 12);
            check("(-12)", -12);
            check("(-#d12)", -12);

            check("(#b1)", 1);
            check("(#b111)", 7);
            check("(+#b111)", 7);
            check("(-#b111)", -7);

            check("(#o1)", 1);
            check("(#o10)", 8);
            check("(+#o12)", 10);
            check("(-#o17)", -15);

            check("(#x1)", 1);
            check("(#x10)", 16);
            check("(#xff)", 255);
            check("(+#x12)", 18);
            check("(-#x17)", -23);
        });

        Q.test("parses decimal", function () {
            function check(expr, expectedValue) {
                var exp = Parser.parse(expr);

                Q.equal(exp.left.value, expectedValue);
            }

            check("(12.1)", 12.1);
            check("(+12.1)", 12.1);
            check("(-12.1)", -12.1);
        });

        Q.test("parses boolean", function () {
            function check(expr, expectedValue) {
                var exp = Parser.parse(expr);

                Q.equal(exp.left.value, expectedValue);
            }

            check("(#t)", true);
            check("(#f)", false);
        });

        Q.test("parses string", function () {
            function check(expr, expectedValue) {
                var exp = Parser.parse(expr);

                Q.equal(exp.left.value, expectedValue);
            }

            check('("asd")', "asd");
            check('("asd asd 3242 !@£$%^^%*$%&^&£%^@%!@")',
                    "asd asd 3242 !@£$%^^%*$%&^&£%^@%!@");
            check('("a\'s\'d")', "a's'd");
            // TODO
            //check('("a\\"s\\"d")', 'a"s"d');
        });

        Q.test("parses objects", function () {
            function check(expr, expected) {
                var exp = Parser.parse(expr), key, value;
                Q.ok(exp instanceof Types.Obj);

                for (key in expected) {
                    value = expected[key];
                    Q.deepEqual(exp.attrs[key].value, value);
                }
            }

            check("{}", {});
            check("{a 1}", {a: 1});
            check("{a 1 b #f}", {a: 1, b: false});
            check('{a 1 b #f c "hello"}', {a: 1, b: false, c: "hello"});

            try {
                Parser.parse("{a}");
                Q.ok(false, "expected the test to fail");
            } catch (error) {
            }
        });

        Q.test("object resolves variables", function () {
            var env = Types.Env.fromJsObject({a: 1, b: "hi", c: false},
                                             [Types.Env.makeGround()]);

            function evalObj(exp, expected) {
                (new Types.Cc(exp, env, function (obj) {
                    var key, value;

                    Q.ok(obj instanceof Types.Obj, "exp is instance of object");

                    for (key in expected) {
                        value = expected[key];
                        Q.deepEqual(obj.attrs[key].value, value, key + " is " + value);
                    }

                    Q.start();
                })).run();
            }

            function check(expr, expected) {
                var exp = Parser.parse(expr);
                Q.ok(exp instanceof Types.Obj, "exp is instance of object");

                Q.stop();
                evalObj(exp, expected);

            }

            check("{}", {});
            check("{a a}", {a: 1});
            check("{a a b b}", {a: 1, b: "hi"});
            check('{a a b b c c}', {a: 1, b: "hi", c: false});
            check('{a a b b c c d 4}', {a: 1, b: "hi", c: false, d: 4});

            // this should parse without problen since still isn't evaled
            Parser.parse("{a j}");

            try {
                check("{a j}");
                Q.ok(false, "expected the test to fail");
            } catch (error) {
                Q.start();
                Q.equal(error.name, "UnboundSymbol", "error must be unbound symbol");
                Q.equal(error.args.name, "j", "the cause must be the variable j");
            }

        });
        Q.test("attaches metadata to objects", function () {
            var ast;

            function check(expr, expected) {
                var exp = Parser.parse(expr), key, value;

                for (key in expected) {
                    value = expected[key];
                    Q.deepEqual(exp.meta[key].value, value);
                }
            }

            check("1 : {}", {});
            check("foo : {a 1}", {a: 1});
            check('"lala" : {a 1 b #f}', {a: 1, b: false});
            check('(foo) : {a 1 b #f c "hello"}', {a: 1, b: false, c: "hello"});

            try {
                Parser.parse("{a}");
                Q.ok(false, "expected the test to fail");
            } catch (error) {
            }

            ast = Parser.parse('(set color "#c00" :{format "color"})');
            Q.ok(ast instanceof Types.Pair);
            Q.equal(ast.left.value, "set");
            Q.equal(ast.right.left.value, "color");
            Q.equal(ast.right.right.left.value, "#c00");
            Q.equal(ast.right.right.left.meta.format.value, "color");
        });

        Q.test("parses simple expressions", function () {
            function check(expr, expectedValue) {
                var exp = Parser.parse(expr);

                Q.deepEqual(exp.toJs(), expectedValue);
            }

            check("(+ 1 2)", ["/+/", 1, 2]);
            check("(+ 1 2.3)", ["/+/", 1, 2.3]);
            check('(display 1 2.3 () "asd" foo)',
                  ["/display/", 1, 2.3, [], "asd", "/foo/"]);

            check('(display 1 2.3 (/ 2 3) "asd" foo)',
                  ["/display/", 1, 2.3, ["///", 2, 3], "asd", "/foo/"]);
        });

        Q.test("representation is the same as the parsed input", function () {
            function check(expr, explicitRepr) {
                var repr = Parser.parse(expr).toString();

                if (explicitRepr === undefined) {
                    explicitRepr = expr;
                }

                Q.equal(explicitRepr, repr, explicitRepr + ": " + repr);
            }

            check("1");
            check("#t");
            check("#f");
            check("#inert");
            check("#ignore");
            check("1.2");
            check("()");
            check("(1 . 2)");
            check("(1 2 . 3)");
            check("(1 2 3 4 5 6 7 . 8)");
            check("((1 . 2) . (3 . (4 5)))", "(\n  (1 . 2) 3 4 5)");
            check("((1 . 2) . (3 . (4 . 5)))", "(\n  (1 . 2) 3 4 . 5)");
            check('"hi"');
            check('map');
            check('(+ 1 2)');
            check('(+ 1 2 3 4 5 6)');
            check('(+ 1 2 \n  (- 3 4) \n  (* 5 6))');
            check('(+ 1 2 \n  (- 3 4) \n  (* 5 6 7 \n    (/ 8 9 10.2)))');
            check('(+ 1 foo \n  (- 3.5 4234) \n  (* "asd" 6 () \n    (/ 8 9 10.2)))');

            check("1 :{}");
            check("1 :{max 10}");
            check("1 :{can-be-zero #t}");
            check("1 :{valid-values (1 2 3 4)}");
            check('1 :{hint "bla"}');
            check('asd :{hint "bla"}');
            check('"asd" :{hint "bla"}');
            check('1.2 :{hint "bla"}');
            check('{foo "bar"} :{hint "bla"}');
            check("(1) :{max-len 4}");
        });

        Q.test("ignores comments", function () {
            function check(expr, expected) {
                var cleanExpr = expr.replace(/ *;.*/, "").replace("\n", ""),
                    reconstructed = Parser.parse(expr).toString();

                Q.equal(expected || cleanExpr, reconstructed, "'" + expr + "' '" + cleanExpr + "' '" + reconstructed + "'");
            }

            check("1 ; a number");
            check("#t ; true");
            check("#f ; false");
            check("1.2 ; a float");
            check("();empty list");
            check('"hi";;;;;;;;;;;;');
            check('map ; ; ;   ;;;');
            check('(+ 1 2) ; adition');
            check('(+ 1 2) ; adition\n');
            check('(+ 1 2 3 4 5 6)                 ;');
            check('(+ 1 2 (- 3 4) (* 5 6)) ;               asd', '(+ 1 2 \n  (- 3 4) \n  (* 5 6))');
            check('(+ 1 2 (- 3 4) (* 5 6 7 (/ 8 9 10.2))) ; (+ 1 2)', '(+ 1 2 \n  (- 3 4) \n  (* 5 6 7 \n    (/ 8 9 10.2)))');
            check('(+ 1 foo (- 3.5 4234) (* "asd" 6 () (/ 8 9 10.2))) ; 12', '(+ 1 foo \n  (- 3.5 4234) \n  (* "asd" 6 () \n    (/ 8 9 10.2)))');

        });
    };

    return obj;
}));
