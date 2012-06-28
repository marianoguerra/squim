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
                threeItems = Parser.parse('(1 2 3)');

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
        });

        Q.test("parses symbols", function () {
            function check(expr, expectedSymbolValue) {
                var exp = Parser.parse(expr);

                Q.equal(exp.left.value, expectedSymbolValue);
            }

            check("(foo)", "foo");
            check("(foo.bar:baz/argh)", "foo.bar:baz/argh");
            check("($set!)", "$set!");
            check("($long-dashed-name-42!)", "$long-dashed-name-42!");
        });

        Q.test("parses integer", function () {
            function check(expr, expectedValue) {
                var exp = Parser.parse(expr);

                Q.equal(exp.left.value, expectedValue);
            }

            check("(12)", 12);
        });

        Q.test("parses decimal", function () {
            function check(expr, expectedValue) {
                var exp = Parser.parse(expr);

                Q.equal(exp.left.value, expectedValue);
            }

            check("(12.1)", 12.1);
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

        Q.test("parses simple expressions", function () {
            function check(expr, expectedValue) {
                var exp = Parser.parse(expr);

                Q.deepEqual(exp.toJs(), expectedValue);
            }

            check("(+ 1 2)", ["+", 1, 2]);
            check("(+ 1 2.3)", ["+", 1, 2.3]);
            check('(display 1 2.3 () "asd" foo)',
                  ["display", 1, 2.3, [], "\"asd\"", "foo"]);

            check('(display 1 2.3 (/ 2 3) "asd" foo)',
                  ["display", 1, 2.3, ["/", 2, 3], "\"asd\"", "foo"]);
        });

    };

    return obj;
}));
