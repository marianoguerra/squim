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

    function check(expr, expected, compareAsIs, env) {
        var result, value;

        try {
            result = Squim.run(expr, env);
        } catch (error) {
            console.log(error);
            throw error;
        }

        if (!compareAsIs) {
            value = result.value;
        } else {
            value = result;
        }

        Q.equal(value, expected, "" + expr + ": " + expected.toString());
    }

    function expectError(expr, errorName, msg) {
        Q.raises(
            function () {
                Squim.run(expr);
            },
            function (error) {
                var msgMatches;

                if (msg !== undefined && error.args) {
                    msgMatches = (msg === error.args.msg);
                } else {
                    msgMatches = true;
                }

                return error.name === errorName && msgMatches;
            }
        );
    }

    obj.test = function () {
        Q.module("Squim mods");

        Q.test("boolean? works", function () {
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

        Q.test("integer? works", function () {
            check("(integer? 1)", true);
            check("(integer? #x12)", true);
            check("(integer? 1 2)", true);
            check("(integer? 1 2 3 4)", true);
            check("(integer? #f)", false);
            check("(integer? 1.2)", false);
            check('(integer? "asd")', false);
            check('(integer? ())', false);
            check('(integer? (list 1))', false);
            check("(integer? 1 2 3 4 #f)", false);
        });

        Q.test("number? works", function () {
            check("(number? 1.2)", true);
            check("(number? 1)", true);
            check("(number? 1 2)", true);
            check("(number? 1.2 2)", true);
            check("(number? 1.2 2.2)", true);
            check("(number? 1 2 3 4)", true);
            check("(number? 1.2 2 3 4)", true);
            check("(number? #f)", false);
            check('(number? "asd")', false);
            check('(number? ())', false);
            check('(number? (list 1))', false);
            check("(number? 1.2 2 3 4 #f)", false);
        });

        Q.test("finite? works", function () {
            check("(finite?)", true);
            check("(finite? 1)", true);
            check("(finite? 1 2 3)", true);
            check("(finite? 1.2)", true);
            check("(finite? 1.2 3.4)", true);

            expectError('(finite? #f)', Squim.errors.type.BadMatch, "expected numeric arguments");
            expectError('(finite? 1 #f)', Squim.errors.type.BadMatch, "expected numeric arguments");
            // TODO: test with infinite
        });

        Q.test("inert? works", function () {
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

        Q.test("$cond works", function () {
            check("($cond)", Types.inert, true);
            expectError("($cond (1 2))", Squim.errors.type.BadMatch);
            check("($cond (#t 1))", 1);
            check("($cond (#t 2))", 2);
            check("($cond (#t 1 2))", 2);
            check("($cond (#t 1 2 3))", 3);

            check("($cond (#f 1) (#t 2))", 2);
            check("($cond (#f 1) (#t 2 3))", 3);
            check("($cond (#f 1) ((car (cons #t #f)) 2 3))", 3);
            check("($cond (#f 1) (#f 2 3) (#t 4))", 4);
            // next condition is not evaluated (it has an error)
            check("($cond (#t 1) (1 2))", 1);
            expectError("($cond (#f 1) (1 2))", Squim.errors.type.BadMatch);
            check("($cond (#t))", Types.inert, true);
        });


        Q.test("symbol? works", function () {
            check("(symbol? (($vau (x) #ignore x) foo))", true);
            check("(symbol? (($vau (x) #ignore x) foo) (($vau (x) #ignore x) bar))", true);
            check("(symbol? 1)", false);
            check("(symbol? 1.2)", false);
            check('(symbol? "asd")', false);
            check('(symbol? ())', false);
            check('(symbol? (list 1))', false);
            check("(symbol? (($vau (x) #ignore x) foo) (($vau (x) #ignore x) bar) 1)", false);
        });

        Q.test("eq? works", function () {
            var
                val = new Types.Pair(new Types.Int(2), Types.nil),
                env = new Types.Env({"foo": val, "bar": val}, [Types.Env.makeGround()]);

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
            check('(eq? foo bar)', true, false, env);
            check('(eq? foo (list 2))', false, false, env);
            check('(eq? foo bar (list 2))', false, false, env);
        });

        Q.test("equal? works", function () {
            var
                val = new Types.Pair(new Types.Int(2), Types.nil),
                env = new Types.Env({"foo": val, "bar": val}, [Types.Env.makeGround()]);

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
            check('(equal? foo bar)', true, false, env);
            check('(equal? foo (list 2))', true, false, env);
            check('(equal? foo bar (list 2))', true, false, env);
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

            check("(cons 1 2)", 1, 2);
            check("(cons foo bar)", 2, false);

            expectError('(cons)', Squim.errors.type.BadMatch);
            expectError('(cons 1)', Squim.errors.type.BadMatch);
            expectError('(cons 1 2 3)', Squim.errors.type.BadMatch);
        });

        Q.test("make-environment works", function () {
            var env;

            function checkEnv(expr) {
                var result = Squim.run(expr);

                Q.ok(result instanceof Types.Env);
                return result;
            }

            env = checkEnv("(make-environment)");
            Q.equal(env.parents.length, 0);
            check("(environment? (make-environment))", true);
            check("(environment? (get-current-environment))", true);
            env = checkEnv("(make-environment (get-current-environment))");
            Q.equal(env.parents.length, 1);
        });

        Q.test("eval works", function () {
            var result = Squim.run('(eval (list list 1 2) (get-current-environment))');
            Q.equal(result.left.value, 1);
            Q.equal(result.right.left.value, 2);
        });

        Q.test("applicative? works", function () {
            check('(applicative? list)', true);
            check('(applicative? ($lambda () 1))', true);

            check('(applicative? 1)', false);
            check('(applicative? ($vau () #ignore 1))', false);
            check('(applicative? (wrap ($vau () #ignore 1)))', true);
        });

        Q.test("passing something other than #ignore or a symbol as 2nd param fails", function () {
            expectError('(applicative? ($vau () 2 1))', Squim.errors.type.SymbolExpected);
        });

        Q.test("call/cc, continuation? works", function () {
            expectError('(call/cc)', Squim.errors.type.BadMatch, "one argument expected");
            expectError('(call/cc 1 2)', Squim.errors.type.BadMatch, "one argument expected");
            expectError('(call/cc 1)', Squim.errors.type.BadMatch, "combiner expected");

            expectError('(continuation->applicative)', Squim.errors.type.BadMatch, "one argument expected");
            expectError('(continuation->applicative 1 2)', Squim.errors.type.BadMatch, "one argument expected");
            expectError('(continuation->applicative 1)', Squim.errors.type.BadMatch, "continuation expected");

            check('(call/cc ($lambda (cont) 1))', 1);
            check('(call/cc ($lambda (cont) (continuation->applicative cont) 1))', 1);
            check('(=? 1 (call/cc ($lambda (cont) (continuation->applicative cont) 1)))', true);
            check('(=? 2 (call/cc ($lambda (cont) (continuation->applicative cont) 1)))', false);
            check('(=? 2 (call/cc ($lambda (cont) (continuation->applicative cont) 2)))', true);
            check('(continuation? (call/cc ($lambda (cont) 1)))', false);
            check('(continuation? (call/cc ($lambda (cont) cont)))', true);
            check('(applicative? (continuation->applicative (call/cc ($lambda (cont) cont))))', true);
            check('(call/cc ($lambda (cont) (continuation->applicative cont) (continuation? cont)))', true);
            check('(call/cc ($lambda (cont) (continuation->applicative cont) (continuation? 1)))', false);
        });

        Q.test("operative? works", function () {
            check('(operative? list)', false);
            check('(operative? ($lambda () 1))', false);

            check('(operative? 1)', false);
            check('(operative? ($vau () #ignore 1))', true);
            check('(operative? (unwrap (wrap ($vau () #ignore 1))))', true);
        });

        Q.test("$sequence works", function () {
            check('($sequence)', Types.inert, true);
            check('($sequence 1)', 1);
            check('($sequence 0 1)', 1);
            Q.equal(Squim.run('($sequence (list 1) (list 2))').left.value, 2);
            Q.equal(Squim.run('($sequence ($define! foo 42) (list foo))').left.value, 42);
        });

        Q.test("list works", function () {
            var
                result,
                env = new Types.Env({"foo": new Types.Int(4)}, [Types.Env.makeGround()]);

            check('(applicative? list)', true);
            //Q.equal(Squim.run('(operative? (unwrap list))').value, true);
            Q.equal(Squim.run('(list foo)', env).left.value, 4);

            //result = Squim.run('((unwrap list) foo)', env);
            //Q.equal(result.left.value, "foo");
        });

        /*Q.test("list* works", function () {
            var result = Squim.run('(list* 1 2 3 4)');
            Q.deepEqual(result.toJs(), [1, 2, 3, 4]);
        });*/

        Q.test("apply works", function () {
            var result;

            result = Squim.run('(apply list (list 1 2) (get-current-environment))');
            Q.equal(result.left.value, 1);
            Q.equal(result.right.left.value, 2);

            result = Squim.run('(apply list (list 1 2))');
            Q.equal(result.left.value, 1);
            Q.equal(result.right.left.value, 2);

            result = Squim.run('(apply list (list 1 2) (make-environment))');
            Q.equal(result.left.value, 1);
            Q.equal(result.right.left.value, 2);

            result = Squim.run('(eval (cons list (list 1 2)) (get-current-environment))');
            Q.equal(result.left.value, 1);
            Q.equal(result.right.left.value, 2);

            result = Squim.run('(eval (cons list (list 1 2)) (make-environment))');
            Q.equal(result.left.value, 1);
            Q.equal(result.right.left.value, 2);

            result = Squim.run('(apply ($lambda x x) 2)');
            Q.equal(result.value, 2);

        });

        Q.test("car works", function () {
            check('(car (list 1 2))', 1);
            check('(car (cons 1 2))', 1);

            expectError('(car 1)', Squim.errors.type.ListExpected);
        });

        Q.test("cdr works", function () {
            Q.deepEqual(Squim.run('(cdr (list 1 2))').left.value, 2);
            check('(cdr (cons 1 2))', 2);

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
            Q.deepEqual(result.toJs(), [1, 2, '/foo/']);

            result = Squim.run('((wrap ($vau x #ignore x)) 1 2 3)');
            Q.deepEqual(result.toJs(), [1, 2, 3]);
        });

        Q.test("+ works", function () {
            check('(+)', 0);
            check('(+ 1)', 1);
            check('(+ -1)', -1);
            check('(+ 3)', 3);
            check('(+ 3 -1)', 2);
            check('(+ 1 2)', 3);
            check('(+ 1 2 3 4 5 6 7 8 9)', 45);
            check('(+ 1.2 2)', 3.2);
            check('(+ 1.2 1.2)', 2.4);
            check('(+ 1.2 1.2 1.1)', 3.5);

            check('(+ "foo")', "foo");
            check('(+ "foo" "bar")', "foobar");
            check('(+ "foo" "bar" "baz")', "foobarbaz");
            check('(+ "foo " "bar" " baz")', "foo bar baz");
        });

        Q.test("- works", function () {
            expectError('(-)', Squim.errors.type.BadMatch, "at least 2 arguments required");
            expectError('(- 1)', Squim.errors.type.BadMatch, "at least 2 arguments required");
            check('(- 5 3)', 2);
            check('(- 10 -8)', 18);
            check('(- 100 2 3 4 5 6 7 8 9)', 56);
            check('(- 1.5 1)', 0.5);
            check('(- 1.2 1.2)', 0.0);
            check('(- 1.2 1.2 1.1)', -1.1);
        });

        Q.test("/ works", function () {
            expectError('(/)', Squim.errors.type.BadMatch, "at least 2 arguments required");
            expectError('(/ 1)', Squim.errors.type.BadMatch, "at least 2 arguments required");

            check('(/ 6 3)', 2);
            check('(/ 10 -5)', -2);
            check('(/ 100 2 5)', 10);
            check('(/ 100 2 5 2)', 5);
            check('(/ 1.5 1)', 1.5);
            check('(/ 1.2 1.2)', 1.0);
            check('(/ 2.4 1.2 1)', 2.0);
        });

        Q.test("* works", function () {
            check('(*)', 1);
            check('(* 1)', 1);
            check('(* 3)', 3);
            check('(* 1 2)', 2);
            check('(* -1 2)', -2);
            check('(* 1 2 3 4 5 6 7 8 9)', 362880);
            check('(* 1 2 3 -4 5 6 7 8 9)', -362880);
            check('(* 1 2 3 -4 5 6 -7 8 9)', 362880);
            check('(* 1.2 2)', 2.4);
            check('(* 1.2 1.2)', 1.44);
            check('(* 1.2 -1.2)', -1.44);
            check('(* 1.2 1.2 1.2)', 1.728);
            check('(* 1.2 -1.2 -1.2)', 1.728);

            check('(+ (* 2 3) (- 3 1) (* 1 2 3) (/ (+ 1 3) 2 1))', 16);
        });

        Q.test("=? works", function () {
            check('(=?)', true);
            check('(=? 1)', true);
            check('(=? 12)', true);
            check('(=? 12 12)', true);
            check('(=? 12 12 12 (+ 11 1))', true);
            check('(=? 12 12.0)', true);
            check('(=? 12 12.0 12 12.0)', true);
            check('(=? 12 12.1)', false);
            check('(=? 12 12.1 12)', false);
            check('(=? 12 13)', false);
            check('(=? 12 12 13)', false);
            check('(=? 12 12 12 13)', false);
        });

        Q.test("<? works", function () {
            check('(<?)', true);
            check('(<? 1)', true);
            check('(<? 1 2)', true);
            check('(<? 1 2 3 4 5 6 7 8)', true);
            check('(<? 1 2 3 4 5 6 7 8)', true);

            check('(<? 1 1)', false);
            check('(<? 2 1)', false);
            check('(<? 1.01 1)', false);
            check('(<? 1 2 2)', false);
            check('(<? 1 2 3 3)', false);
        });

        Q.test("<=? works", function () {
            check('(<=?)', true);
            check('(<=? 1)', true);
            check('(<=? 1 2)', true);
            check('(<=? 1 2 3 4 5 6 7 8)', true);
            check('(<=? 1 2 3 4 5 6 7 8)', true);

            check('(<=? 1 1)', true);
            check('(<=? 2 1)', false);
            check('(<=? 1.01 1)', false);
            check('(<=? 1 2 2)', true);
            check('(<=? 1 2 3 3)', true);
            check('(<=? 1 3 7 15)', true);
            check('(<=? 1 7 3 15)', false);
        });

        Q.test(">? works", function () {
            check('(>?)', true);
            check('(>? 1)', true);
            check('(>? 2 1)', true);
            check('(>? 8 7 6 5 4 3 2 1)', true);

            check('(>? 1 1)', false);
            check('(>? 1 2)', false);
            check('(>? 1 1.01)', false);
            check('(>? 2 2 1)', false);
            check('(>? 3 3 2 1)', false);
        });

        Q.test(">=? works", function () {
            check('(>=?)', true);
            check('(>=? 1)', true);
            check('(>=? 2 1)', true);
            check('(>=? 8 7 6 5 4 3 2 1)', true);

            check('(>=? 1 1)', true);
            check('(>=? 1 2)', false);
            check('(>=? 1 1.01)', false);
            check('(>=? 2 2 1)', true);
            check('(>=? 3 3 2 1)', true);
            check('(>=? 15 7 3 1)', true);
            check('(>=? 15 3 7 1)', false);
        });
    };

    return obj;
}));
