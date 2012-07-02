/*global define QUnit Squim*/
(function (root, factory) {
    "use strict";

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['qunit', 'squim'], function (Q, Squim) {
            // Also create a global in case some scripts
            // that are loaded still are looking for
            // a global even when an AMD loader is in use.
            return (root.SquimModulesTest = factory(Q, Squim));
        });
    } else {
        // Browser globals
        root.SquimModulesTest = factory(QUnit, Squim);
    }
}(this, function (Q, Squim) {
    "use strict";
    var obj = {}, Types = Squim.types;

    obj.test = function () {
        Q.module("Squim mods");

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

        Q.test("inert? works", function () {
            function check(expr, result) {
                Q.equal(Squim.run(expr).value, result);
            }

            check("(inert? #inert)", true);
            check("(inert? #inert)", true);
            check("(inert? #inert #inert)", true);
            check("(inert? #inert #inert #inert #inert)", true);
            check("(inert? 1)", false);
            check("(inert? 1.2)", false);
            check('(inert? "asd")', false);
            check('(inert? ())', false);
            check('(inert? (list 1))', false);
            check("(inert? #inert #inert #inert #inert 1)", false);
        });

        Q.test("ignore? works", function () {
            function check(expr, result) {
                Q.equal(Squim.run(expr).value, result);
            }

            check("(ignore? #ignore)", true);
            check("(ignore? #ignore)", true);
            check("(ignore? #ignore #ignore)", true);
            check("(ignore? #ignore #ignore #ignore #ignore)", true);
            check("(ignore? 1)", false);
            check("(ignore? 1.2)", false);
            check('(ignore? "asd")', false);
            check('(ignore? ())', false);
            check('(ignore? (list 1))', false);
            check("(ignore? #ignore #ignore #ignore #ignore 1)", false);
        });

        Q.test("null? works", function () {
            function check(expr, result) {
                Q.equal(Squim.run(expr).value, result);
            }

            check("(null?)", true);
            check("(null? ())", true);
            check("(null? ())", true);
            check("(null? () ())", true);
            check("(null? () () () ())", true);
            check("(null? 1)", false);
            check("(null? 1.2)", false);
            check('(null? "asd")', false);
            check('(null? (list 1))', false);
            check("(null? () () () () 1)", false);
        });

        Q.test("pair? works", function () {
            function check(expr, result) {
                Q.equal(Squim.run(expr).value, result);
            }

            check("(pair?)", true);
            check("(pair? ())", false);
            check("(pair? () ())", false);
            check("(pair? (list 1))", true);
            check("(pair? (list 1) (list 1))", true);
            check("(pair? (list 1 2))", true);
            check("(pair? (list 1) (list 1))", true);
            check("(pair? (list 1) (list 1) (list 1) (list 1))", true);
            check("(pair? 1)", false);
            check("(pair? 1.2)", false);
            check('(pair? "asd")', false);
            check("(pair? (list 1) (list 1) (list 1) (list 1) 1)", false);
        });

        Q.test("$if works", function () {
            function check(expr, result) {
                Q.equal(Squim.run(expr).value, result);
            }

            function expectError(expr, errorName) {
                Q.raises(
                    function () {
                        Squim.run(expr);
                    },
                    function (error) {
                        return error.name === errorName;
                    }
                );
            }

            check("($if #t #t #f)", true);
            check("($if #t #f #t)", false);
            check('($if (eq? 1 1) "son iguales!" "no seran tan iguales")', "son iguales!");
            check('($if (eq? 1 1) (boolean? #t) "asd")', true);
            check('($if (eq? 1 2) (boolean? #t) "asd")', "asd");

            expectError('($if)', Squim.errors.type.BadMatch);
            expectError('($if #t)', Squim.errors.type.BadMatch);
            expectError('($if #t 1)', Squim.errors.type.BadMatch);
            expectError('($if 8 #t #t)', Squim.errors.type.BooleanExpected);

        });

        Q.test("symbol? works", function () {
            function check(expr, result) {
                Q.equal(Squim.run(expr).value, result);
            }

            // TODO: test this
            //check("(symbol? foo)", true);
            //check("(symbol? bar)", true);
            //check("(symbol? bar foo)", true);
            //check("(symbol? bar foo foo bar)", true);
            check("(symbol? 1)", false);
            check("(symbol? 1.2)", false);
            check('(symbol? "asd")', false);
            check('(symbol? ())', false);
            check('(symbol? (list 1))', false);
            //check("(symbol? bar foo foo bar 1)", false);
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

        Q.test("cons works", function () {
            var
                foo = new Types.Int(2),
                bar = Types.f,
                env = new Types.Env({"foo": foo, "bar": bar}, [Types.Env.makeGround()]);

            function check(expr, car, cons) {
                var result = Squim.run(expr, env);

                Q.ok(result instanceof Types.Pair);
                Q.equal(result.left.value, car);
                Q.equal(result.right.value, cons);
            }

            function expectError(expr, errorName) {
                Q.raises(
                    function () {
                        Squim.run(expr);
                    },
                    function (error) {
                        return error.name === errorName;
                    }
                );
            }


            check("(cons 1 2)", 1, 2);
            check("(cons foo bar)", 2, false);

            expectError('(cons)', Squim.errors.type.BadMatch);
            expectError('(cons 1)', Squim.errors.type.BadMatch);
            expectError('(cons 1 2 3)', Squim.errors.type.BadMatch);
        });

        Q.test("make-environment works", function () {
            var env;

            function check(expr, car, cons) {
                var result = Squim.run(expr);

                Q.ok(result instanceof Types.Env);
                return result;
            }

            env = check("(make-environment)");
            Q.equal(env.parents.length, 0);
            Q.ok(Squim.run("(environment? (make-environment))").value);
            Q.ok(Squim.run("(environment? (get-current-environment))").value);
            env = check("(make-environment (get-current-environment))");
            Q.equal(env.parents.length, 1);
        });

        Q.test("eval works", function () {
            var otherEnv = new Types.Env({"foo": new Types.Int(4)}),
                evalEnv = new Types.Env({"other-env": otherEnv}, [Types.Env.makeGround()]);

            Q.equal(Squim.run('(eval foo other-env)', evalEnv).value, 4);
        });

        Q.test("applicative? works", function () {
            Q.equal(Squim.run('(applicative? list)').value, true);
            Q.equal(Squim.run('(applicative? ($lambda () 1))').value, true);

            Q.equal(Squim.run('(applicative? 1)').value, false);
            Q.equal(Squim.run('(applicative? ($vau () #ignore 1))').value, false);
        });

        Q.test("passing something other than #ignore or a symbol as 2nd param fails",
                function () {
                    Q.raises(function () {
                        Squim.run('(applicative? ($vau () 2 1))');
                    }, function (error) {
                        return error.name === Squim.errors.type.SymbolExpected;
                    });
                });

        Q.test("operative? works", function () {
            Q.equal(Squim.run('(operative? list)').value, false);
            Q.equal(Squim.run('(operative? ($lambda () 1))').value, false);

            Q.equal(Squim.run('(operative? 1)').value, false);
            Q.equal(Squim.run('(operative? ($vau () #ignore 1))').value, true);
        });

        Q.test("$sequence works", function () {
            Q.equal(Squim.run('($sequence)'), Types.inert);
            Q.equal(Squim.run('($sequence (list 1) (list 2))').left.value, 2);
            Q.equal(Squim.run('($sequence ($define! foo 42) (list foo))').left.value, 42);
        });

        Q.test("list works", function () {
            var
                result,
                env = new Types.Env({"foo": new Types.Int(4)}, [Types.Env.makeGround()]);

            Q.equal(Squim.run('(applicative? list)').value, true);
            Q.equal(Squim.run('(operative? (unwrap list))').value, true);
            Q.equal(Squim.run('(list foo)', env).left.value, 4);

            result = Squim.run('((unwrap list) foo)', env);
            Q.equal(result.left.value, "foo");
        });

        Q.test("list* works", function () {
            var result = Squim.run('(list* 1 2 3 4)');
            Q.deepEqual(result.toJs(), [1, 2, 3, 4]);
        });

        Q.test("car works", function () {
            function expectError(expr, errorName) {
                Q.raises(
                    function () {
                        Squim.run(expr);
                    },
                    function (error) {
                        return error.name === errorName;
                    }
                );
            }

            Q.deepEqual(Squim.run('(car (list 1 2))').value, 1);
            Q.deepEqual(Squim.run('(car (cons 1 2))').value, 1);

            expectError('(car 1)', Squim.errors.type.ListExpected);
        });

        Q.test("cdr works", function () {
            function expectError(expr, errorName) {
                Q.raises(
                    function () {
                        Squim.run(expr);
                    },
                    function (error) {
                        return error.name === errorName;
                    }
                );
            }

            Q.deepEqual(Squim.run('(cdr (list 1 2))').left.value, 2);
            Q.deepEqual(Squim.run('(cdr (cons 1 2))').value, 2);

            expectError('(cdr 1)', Squim.errors.type.ListExpected);
        });

        Q.test("$lambda works", function () {
            var result;

            result = Squim.run('($lambda x x)');

            Q.equal(result.operative.formals.value, 'x');
            Q.equal(result.operative.expr.left.value, '$sequence');
            Q.equal(result.operative.expr.right.left.value, 'x');

            result = Squim.run('(($lambda (x) x) 2)');
            Q.equal(result.value, 2);

            result = Squim.run('(($lambda x x) 2)');
            Q.equal(result.left.value, 2);

            result = Squim.run('(($lambda (head . tail) tail) 1 2 3 4)');
            Q.deepEqual(result.toJs(), [2, 3, 4]);

            result = Squim.run('(($lambda (first second . tail) tail) 1 2 3 4)');
            Q.deepEqual(result.toJs(), [3, 4]);

            result = Squim.run('(($lambda (a) ($define! one 1) ($define! two 2) (list one two a)) 5)');
            Q.deepEqual(result.toJs(), [1, 2, 5]);
        });

        Q.test("$vau works", function () {
            var result = Squim.run('(($vau (a) #ignore ($define! one 1) ($define! two 2) (list one two a)) foo)');
            Q.deepEqual(result.toJs(), [1, 2, 'foo']);
        });
    };

    return obj;
}));
