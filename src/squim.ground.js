/*global define SquimError SquimTypes SquimUtil SquimParser*/
(function (root, factory) {
    "use strict";

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['json', 'squim.types', 'squim.error', 'squim.util', 'squim.parser'],
               function (JSON, Types, Error, Util, Parser) {
            // Also create a global in case some scripts
            // that are loaded still are looking for
            // a global even when an AMD loader is in use.
            return (root.SquimGround = factory(JSON, Types, Error, Util, Parser));
        });
    } else {
        // Browser globals
        root.SquimGround = factory(JSON, SquimTypes, SquimError, SquimUtil, SquimParser);
    }
}(this, function (JSON, Types, Error, Util, Parser) {
    "use strict";
    var obj = {},
        Cc = Types.Cc,
        Pair = Types.Pair,
        nil = Pair.nil,
        Nil = Pair.Nil,
        Symbol = Types.Symbol,
        // (formals eformals . expr)
        vauNames = new Pair(new Symbol("formals"), new Pair(new Symbol("eformal"), new Symbol("expr")));

    obj.k_lambda = function (args, cc) {
        var params, body;

        if (!(args instanceof Pair)) {
            return Error.BadMatch(
                "expected $lambda <params> <body>",
                {args: args});
        }

        params = args.left;

        if (args.right === nil) {
            body = Types.Inert.inert;
        } else {
            // XXX doing it this way may make it work weird if $sequence is
            // redefined, check if this is the expected behaviour
            body = new Pair(new Symbol('$sequence'), args.right);
        }

        return cc.resolve(new Types.Applicative(new Types.Operative(params, Types.ignore, body, cc.env)));
    };

    obj.k_vau = function (args, cc) {
        var
            parts = Types.util.gatherArguments(args, vauNames),
            expr = new Pair(new Symbol('$sequence'), parts.expr);

        return cc.resolve(new Types.Operative(parts.formals, parts.eformal, expr, cc.env));
    };

    obj.k_wrap = function (args, cc) {
        return new Cc(args, cc.env, function (eargs) {
            var parts = Types.util.gatherArguments(eargs, ["operative"], true);

            if (!(parts.operative instanceof Types.Operative)) {
                return Error.BadMatch("expected combiner", {arg: parts.operative});
            }

            return cc.resolve(new Types.Applicative(parts.operative));
        }, cc, true);
    };

    obj.k_apply = function (args, cc) {
        return new Cc(args, cc.env, function (eargs) {
            var
                applyEnv,
                parts = Types.util.gatherArguments(eargs, ["applicative", "object", "environment"], false, {environment: null});

            if (parts.applicative === undefined || !Types.util.isApplicative(parts.applicative)) {
                return Error.BadMatch("expected applicative (apply <applicative> <object> [<environment>])", {arg: parts.applicative});
            }

            if (parts.object === undefined) {
                return Error.BadMatch("expected object (apply <applicative> <object> [<environment>])", {arg: parts.object});
            }

            if (parts.environment === null) {
                applyEnv = new Types.Env();
            } else if (Types.util.isEnvironment(parts.environment)) {
                applyEnv = parts.environment;
            } else {
                return Error.BadMatch("expected environment (apply <applicative> <object> [<environment>])", {arg: parts.environment});
            }

            cc.env = applyEnv;

            return parts.applicative.apply(null, [parts.object, cc]);
        }, cc, true);
    };

    obj.k_car = function (args, cc) {
        return new Cc(args, cc.env, function (eargs) {
            var parts = Types.util.gatherArguments(eargs, ["pair"], true);

            if (!(parts.pair instanceof Types.Pair)) {
                return Error.ListExpected(parts.pair, {args: args, env: cc.env});
            }

            return cc.resolve(parts.pair.left);
        }, cc, true);
    };

    obj.k_cdr = function (args, cc) {
        return new Cc(args, cc.env, function (eargs) {
            var parts = Types.util.gatherArguments(eargs, ["pair"], true);

            if (!(parts.pair instanceof Types.Pair)) {
                return Error.ListExpected(parts.pair, {args: args, env: cc.env});
            }

            return cc.resolve(parts.pair.right);
        }, cc, true);
    };

    obj.k_list = function (args, cc) {
        return new Cc(args, cc.env, function (eargs) {
            return cc.resolve(eargs);
        }, cc, true);
    };

    obj.k_unwrap = function (args, cc) {
        return new Cc(args, cc.env, function (eargs) {
            var parts = Types.util.gatherArguments(eargs, ["applicative"], true);

            if (!Types.util.isApplicative(parts.applicative)) {
                return Error.BadMatch("expected applicative", {arg: parts.applicative});
            }

            return cc.resolve(parts.applicative.operative);
        }, cc, true);
    };

    function evalSequenceLeft(remaining, cc) {
        if (remaining === Types.nil) {
            return cc.cont(Types.inert);
        }

        return (new Cc(remaining.left, cc.env, function (result) {
            if (remaining.right === Types.nil) {
                return cc.resolve(result);
            } else {
                return evalSequenceLeft(remaining.right, cc);
            }
        }, cc)).eval_();
    }

    obj.k_sequence = function (args, cc) {
        return evalSequenceLeft(args, cc);
    };

    function expectEnvironment(item, args, env) {
        if (!(item instanceof Types.Env)) {
            // WARN: I'm not returning here, so if we stop throwing
            // exceptions it will fail weirdly
            Error.EnvironmentExpected(item, {args: args, env: env});
        }
    }

    obj.k_make_environment = function (args, cc) {
        return new Cc(args, cc.env, function (eargs) {
            var parents = Types.util.pairToArray(eargs, function (item, i) {
                expectEnvironment(item, args, cc.env);
            });

            return cc.resolve(new Types.Env({}, parents));
        }, cc, true);
    };

    obj.k_get_current_environment = function (args, cc) {
        return cc.resolve(cc.env);
    };

    obj.k_eval = function (args, cc) {
        return new Cc(args, cc.env, function (eargs) {
            var parts = Types.util.gatherArguments(eargs, ["expression", "environment"], true);

            expectEnvironment(parts.environment, args, cc.env);

            return new Cc(parts.expression, parts.environment, cc.cont);
        }, cc, true);
    };

    obj.k_define = function (args, cc) {
        return new Cc(args.right.left, cc.env, function (evaledValue) {
            var name = args.left.value;

            cc.env.define(name, evaledValue);
            return cc.resolve(Types.inert);
        });
    };

    obj.k_display = function (args, cc) {
        return new Cc(args.left, cc.env, function (value) {
            alert(value.toJs());
            return cc.resolve(Types.inert);
        });
    };

    obj.allOfType = function (items, type) {
        var ok = true, i, oneType;

        while (items !== Types.nil) {

            if (Util.isArray(type)) {
                oneType = false;

                for (i = 0; i < type.length; i += 1) {
                    if (items.left instanceof type[i]) {
                        oneType = true;
                        break;
                    }
                }

                if (!oneType) {
                    ok = false;
                    break;
                }
            } else if (!(items.left instanceof type)) {
                ok = false;
                break;
            }

            items = items.right;
        }

        return (ok) ? Types.t : Types.f;
    };

    function type_p(type) {
        return function (args, cc) {
            return new Cc(args, cc.env, function (eargs) {
                cc.resolve(obj.allOfType(eargs, type));
            }, cc, true);
        };
    }

    obj.k_boolean_p = type_p(Types.Bool);
    obj.k_symbol_p = type_p(Types.Symbol);
    obj.k_inert_p = type_p(Types.Inert);
    obj.k_ignore_p = type_p(Types.Ignore);
    obj.k_null_p = type_p(Nil);
    obj.k_pair_p = type_p(Pair);
    obj.k_environment_p = type_p(Types.Env);
    obj.k_operative_p = type_p(Types.Operative);
    obj.k_applicative_p = type_p([Types.Applicative, Function]);

    obj.compareAllToFirst = function (args, methodName) {
        var ok = true, first, items = args;

        while (items !== Types.nil) {
            if (first === undefined) {
                first = items.left;
                continue;
            }

            if (!items.left[methodName](first)) {
                ok = false;
                break;
            }

            items = items.right;
        }

        return (ok) ? Types.t : Types.f;
    };

    obj.k_eq_p = function (args, cc) {
        return new Cc(args, cc.env, function (eargs) {
            return cc.resolve(obj.compareAllToFirst(eargs, "eq_p"));
        }, cc, true);
    };

    obj.k_equal_p = function (args, cc) {
        return new Cc(args, cc.env, function (eargs) {
            return cc.resolve(obj.compareAllToFirst(eargs, "equal_p"));
        }, cc, true);
    };

    obj.k_if = function (args, cc) {
        var parts = Types.util.gatherArguments(args, ["condition", "thenBlock", "elseBlock"]);

        return new Cc(parts.condition, cc.env, function (condResult) {
            if (condResult instanceof Types.Bool) {
                if (condResult.value === true) {
                    return new Cc(parts.thenBlock, cc.env, cc.cont, cc);
                } else {
                    return new Cc(parts.elseBlock, cc.env, cc.cont, cc);
                }
            } else {
                return Error.BooleanExpected(condResult, {args: args, env: cc.env});
            }
        }, cc);
    };

    obj.k_cond = function (args, cc) {
        var clause, test, body;

        if (args === Types.nil) {
            return cc.resolve(Types.inert);
        } else {
            clause = args.left;

            if (!(clause instanceof Pair)) {
                return Error.BadMatch("expected (<test> . <body>) in $cond", {args: args});
            } else {
                test = clause.left;
                body = clause.right;

                return new Cc(test, cc.env, function (testValue) {

                    if (!(testValue instanceof Types.Bool)) {
                        return Error.BadMatch("test evaluated to a non boolean value", {args: args});
                    } else if (testValue.value === true) {
                        return evalSequenceLeft(body, cc);
                    } else {
                        return obj.k_cond(args.right, cc);
                    }

                }, cc);
            }
        }
    };

    obj.k_cons = function (args, cc) {
        return new Cc(args, cc.env, function (eargs) {
            var
                parts = Types.util.gatherArguments(eargs, ["car", "cdr"], true),
                car = parts.car,
                cdr = parts.cdr;

            return cc.resolve(new Pair(car, cdr));
        }, cc, true);
    };

    obj.makeGround = function () {
        var
            ground = new Types.Env({
                "$lambda": obj.k_lambda,
                "$define!": obj.k_define,
                "display": obj.k_display,

                "operative?": obj.k_operative_p,
                "applicative?": obj.k_applicative_p,
                "environment?": obj.k_environment_p,
                "boolean?": obj.k_boolean_p,
                "symbol?": obj.k_symbol_p,
                "inert?": obj.k_inert_p,
                "ignore?": obj.k_ignore_p,
                "null?": obj.k_null_p,
                "pair?": obj.k_pair_p,

                "eq?": obj.k_eq_p,
                "equal?": obj.k_equal_p,

                "$if": obj.k_if,
                "$cond": obj.k_cond,
                "cons": obj.k_cons,
                "list": obj.k_list,
                "make-environment": obj.k_make_environment,
                "get-current-environment": obj.k_get_current_environment,

                "eval": obj.k_eval,
                "$vau": obj.k_vau,
                "wrap": obj.k_wrap,
                "unwrap": obj.k_unwrap,
                "$sequence": obj.k_sequence,
                "car": obj.k_car,
                "cdr": obj.k_cdr,
                "apply": obj.k_apply
            }, [], false);


        //Parser.parse('($define! list (wrap ($vau x #ignore x)))').eval_(ground);
        //Parser.parse("($define! apply ($lambda (appv arg . opt) (eval (cons (unwrap appv) arg) ($if (null? opt) (make-environment) (car opt)))))").eval_(ground);
        //Parser.parse("($define! list* ($lambda (head . tail) ($if (null? tail) head (cons head (apply list* tail)))))").eval_(ground);


        // set the ground as inmutable now that we added all bindings
        ground.inmutable = true;
        return ground;
    };

    Types.Env.makeGround = obj.makeGround;

    return obj;
}));
