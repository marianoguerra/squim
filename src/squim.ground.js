/*global define SquimError SquimTypes SquimUtil SquimParser alert*/
(function (root, factory) {
    "use strict";

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['squim.types', 'squim.error', 'squim.util', 'squim.parser'],
               function (Types, Error, Util, Parser) {
            // Also create a global in case some scripts
            // that are loaded still are looking for
            // a global even when an AMD loader is in use.
            return (root.SquimGround = factory(Types, Error, Util, Parser));
        });
    } else {
        // Browser globals
        root.SquimGround = factory(SquimTypes, SquimError, SquimUtil, SquimParser);
    }
}(this, function (Types, Error, Util, Parser) {
    "use strict";
    var obj = {},
        Cc = Types.Cc,
        Pair = Types.Pair,
        nil = Pair.nil,
        Nil = Pair.Nil,
        Symbol = Types.Symbol,
        T = Types,
        withParams = T.util.withParams,
        withUnevaluatedParams = T.util.withUnevaluatedParams,
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
        return withParams(args, cc, ["operative"], true, [T.Operative], function (eargs) {
            return cc.resolve(new Types.Applicative(eargs.operative));
        });
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
        return withParams(args, cc, ["pair"], true, [T.Pair], function (eargs) {
            return cc.resolve(eargs.pair.left);
        });
    };

    obj.k_cdr = function (args, cc) {
        return withParams(args, cc, ["pair"], true, [T.Pair], function (eargs) {
            return cc.resolve(eargs.pair.right);
        });
    };

    obj.k_list = function (args, cc) {
        return new Cc(args, cc.env, function (eargs) {
            return cc.resolve(eargs);
        }, cc, true);
    };

    obj.k_unwrap = function (args, cc) {
        return withParams(args, cc, ["applicative"], true, [T.Applicative], function (eargs) {
            return cc.resolve(eargs.applicative.operative);
        });
    };

    function evalSequenceLeft(remaining, cc) {
        if (remaining === Types.nil) {
            return cc.cont(Types.inert);
        }

        return new Cc(remaining.left, cc.env, function (result) {
            if (remaining.right === Types.nil) {
                return cc.resolve(result);
            } else {
                return evalSequenceLeft(remaining.right, cc);
            }
        }, cc);
    }

    // keep evaling the left side until condition returns non null or end
    // if condition returns non null use that value to resolve the continueation
    // if end is reached resolve with valueOnEnd
    function evalLeftWhile(remaining, cc, condition, valueOnEnd) {
        if (remaining === Types.nil) {
            return cc.resolve(valueOnEnd);
        }

        return new Cc(remaining.left, cc.env, function (result) {
            var conditionResult = condition(result);

            if (conditionResult !== null) {
                return cc.resolve(conditionResult);
            } else if (remaining.right === Types.nil) {
                return cc.resolve(valueOnEnd);
            } else {
                return evalLeftWhile(remaining.right, cc, condition, valueOnEnd);
            }
        }, cc);
    }

    function k_$and_p(args, cc) {
        return evalLeftWhile(args, cc, function (value) {
            if (value === T.t) {
                return null;
            } else {
                return T.f;
            }
        }, T.t);
    }

    function k_$or_p(args, cc) {
        return evalLeftWhile(args, cc, function (value) {
            if (value !== T.t) {
                return null;
            } else {
                return T.t;
            }
        }, T.f);
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
        }, cc);
    };

    obj.k_display = function (args, cc) {
        return new Cc(args.left, cc.env, function (value) {
            alert(value.toJs());
            return cc.resolve(Types.inert);
        }, cc);
    };

    obj.k_call_cc = function (args, cc) {
        if (args === Types.nil || args.right !== Types.nil) {
            return Error.BadMatch("one argument expected", args);
        } else {
            return new Cc(args.left, cc.env, function (combiner) {
                if (!Types.util.isCombiner(combiner)) {
                    return Error.BadMatch("combiner expected", args);
                }  else {
                    return combiner.apply(null, [new Pair(cc, Types.nil), cc]);
                }
            }, cc);
        }
    };

    obj.k_continuation__applicative = function (args, cc) {
        if (args === Types.nil || args.right !== Types.nil) {
            return Error.BadMatch("one argument expected", args);
        } else {
            return new Cc(args.left, cc.env, function (continuation) {
                if (!Types.util.isContinuation(continuation)) {
                    return Error.BadMatch("continuation expected", args);
                } else {
                    return cc.resolve(function (cargs, _cc) {
                        // ASK the received _cc isn't used?
                        return continuation.resolve(cargs);
                    });
                }
            }, cc);
        }
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

    obj.k_finite_p = function (args, cc) {
        return new Cc(args, cc.env, function (eargs) {
            var result = obj.allOfType(eargs, [Types.Int, Types.Float]);

            if (result.value === true) {
                // TODO: implement correctly when proper numerical tower is available
                return cc.resolve(Types.t);
            } else {
                return Error.BadMatch("expected numeric arguments", args);
            }
        }, cc, true);
    };

    // TODO: implement correctly when proper numerical tower is available
    obj.k_integer_p = type_p(Types.Int);
    obj.k_number_p = type_p([Types.Int, Types.Float]);

    obj.k_string_p = type_p(Types.Str);
    obj.k_boolean_p = type_p(Types.Bool);
    obj.k_symbol_p = type_p(Types.Symbol);
    obj.k_inert_p = type_p(Types.Inert);
    obj.k_ignore_p = type_p(Types.Ignore);
    obj.k_null_p = type_p(Nil);
    obj.k_pair_p = type_p(Pair);
    obj.k_environment_p = type_p(Types.Env);
    obj.k_continuation_p = type_p(Types.Cc);
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
        return withUnevaluatedParams(args, ["condition", "thenBlock", "elseBlock"], true, undefined, function (parts) {
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
        });
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
        return withParams(args, cc, ["car", "cdr"], true, undefined, function (eargs) {
            return cc.resolve(new Pair(eargs.car, eargs.cdr));
        });
    };

    function applyOp(op, callargs, min, defaultForZeroArgs) {
        var args = Types.util.pairToArray(callargs), first, second, opfun, i;

        if (args.length < min) {
            return Error.BadMatch("at least " + min + " arguments required", args);
        } else if (args.length === 0) {
            return new Types.Int(defaultForZeroArgs);
        } else {
            first = args[0];
            opfun = first.getOp(op);
            first = args[0].value;

            if (opfun === null) {
                return Error.BadMatch("invalid operation " + op + " for " + typeof(first));
            } else {

                for (i = 1; i < args.length; i += 1) {
                    second = args[i].value;
                    first = opfun(first, second);
                }

                if (typeof first === "string") {
                    return new Types.Str(first);
                } else if (typeof first === "number" && (first % 1) === 0) {
                    return new Types.Int(first);
                } else if (typeof first === "number") {
                    return new Types.Float(first);
                } else {
                    return Error.ValueError("unknown result type: " + typeof first);
                }
            }
        }
    }

    function applyOpByPairs(op, callargs, defaultForZeroArgs) {
        var args = Types.util.pairToArray(callargs), first, second, opfun, i, result;

        if (args.length === 0) {
            return defaultForZeroArgs;
        } else {
            first = args[0];
            opfun = first.getOp(op);
            first = args[0].value;

            if (opfun === null) {
                return Error.BadMatch("invalid operation " + op + " for " + typeof(first));
            } else {

                for (i = 1; i < args.length; i += 1) {
                    second = args[i].value;
                    result = opfun(first, second);

                    if (!result) {
                        return Types.f;
                    }

                    first = second;
                }

                return Types.t;
            }
        }
    }

    function op(opSymbol, min, defaultForZeroArgs) {
        return function (args, cc) {
            return new Cc(args, cc.env, function (eargs) {
                return cc.resolve(applyOp(opSymbol, eargs, min, defaultForZeroArgs));
            }, cc, true);
        };
    }

    function opByPairs(op, defaultForZeroArgs) {
        return function (args, cc) {
            return new Cc(args, cc.env, function (eargs) {
                return cc.resolve(applyOpByPairs(op, eargs, defaultForZeroArgs));
            }, cc, true);
        };
    }

    obj.k_add_op = op('+', 0, 0);
    obj.k_sub_op = op('-', 2, null);
    obj.k_mul_op = op('*', 0, 1);
    obj.k_div_op = op('/', 2, null);

    obj.k_eq_op = opByPairs('=?', Types.t);
    obj.k_lt_op = opByPairs('<?', Types.t);
    obj.k_gt_op = opByPairs('>?', Types.t);
    obj.k_le_op = opByPairs('<=?', Types.t);
    obj.k_ge_op = opByPairs('>=?', Types.t);

    obj.makeGround = function () {
        var
            ground = new Types.Env({
                "$lambda": obj.k_lambda,
                "$define!": obj.k_define,
                "display": obj.k_display,

                "continuation?": obj.k_continuation_p,
                "operative?": obj.k_operative_p,
                "applicative?": obj.k_applicative_p,
                "environment?": obj.k_environment_p,
                "string?": obj.k_string_p,
                "boolean?": obj.k_boolean_p,
                "number?": obj.k_number_p,
                "integer?": obj.k_integer_p,
                "finite?": obj.k_finite_p,
                "symbol?": obj.k_symbol_p,
                "inert?": obj.k_inert_p,
                "ignore?": obj.k_ignore_p,
                "null?": obj.k_null_p,
                "pair?": obj.k_pair_p,

                "$and?": k_$and_p,
                "$or?": k_$or_p,

                "+": obj.k_add_op,
                "-": obj.k_sub_op,
                "*": obj.k_mul_op,
                "/": obj.k_div_op,

                "<?": obj.k_lt_op,
                ">?": obj.k_gt_op,
                "=?": obj.k_eq_op,
                "<=?": obj.k_le_op,
                ">=?": obj.k_ge_op,

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
                "apply": obj.k_apply,
                "call/cc": obj.k_call_cc,
                "continuation->applicative": obj.k_continuation__applicative
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
