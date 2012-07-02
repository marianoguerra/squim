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
            check("((1 . 2) . (3 . (4 5)))", "((1 . 2) 3 4 5)");
            check("((1 . 2) . (3 . (4 . 5)))", "((1 . 2) 3 4 . 5)");
            check('"hi"');
            check('map');
            check('(+ 1 2)');
            check('(+ 1 2 3 4 5 6)');
            check('(+ 1 2 (- 3 4) (* 5 6))');
            check('(+ 1 2 (- 3 4) (* 5 6 7 (/ 8 9 10.2)))');
            check('(+ 1 foo (- 3.5 4234) (* "asd" 6 () (/ 8 9 10.2)))');

        });

        Q.test("ignores comments", function () {
            function check(expr) {
                var cleanExpr = expr.replace(/ *;.*/, ""),
                    reconstructed = Parser.parse(expr).toString();

                Q.equal(cleanExpr, reconstructed, "'" + expr + "' '" + cleanExpr + "' '" + reconstructed + "'");
            }

            check("1 ; a number");
            check("#t ; true");
            check("#f ; false");
            check("1.2 ; a float");
            check("();empty list");
            check('"hi";;;;;;;;;;;;');
            check('map ; ; ;   ;;;');
            check('(+ 1 2) ; adition');
            check('(+ 1 2 3 4 5 6)                 ;');
            check('(+ 1 2 (- 3 4) (* 5 6))       ;               asd');
            check('(+ 1 2 (- 3 4) (* 5 6 7 (/ 8 9 10.2))) ; (+ 1 2)');
            check('(+ 1 foo (- 3.5 4234) (* "asd" 6 () (/ 8 9 10.2))) ; 12');

        });
    };

    return obj;
}));
