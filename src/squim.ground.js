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
    var obj = {};

    obj.kLambda = function (args, env) {
        var params, body;

        if (!(args instanceof Types.Pair)) {
            return Error.BadMatch(
                "expected $lambda <params> <body>",
                {args: args});
        }

        params = args.left;

        if (args.right === Types.Pair.nil) {
            body = Types.Inert.inert;
        } else {
            body = args.right.left;
        }

        return new Types.Applicative(new Types.Operative(params, Types.ignore, body, env));
    };

    obj.k_vau = function (args, env) {
        var parts = Types.util.gatherArguments(args, ["formals", "eformal", "expr"], true);

        return new Types.Operative(parts.formals, parts.eformal, parts.expr, env);
    };

    obj.k_wrap = function (args, env) {
        var parts = Types.util.gatherArguments(args._expand(env), ["operative"], true);

        if (!(parts.operative instanceof Types.Operative)) {
            return Error.BadMatch("expected combiner", {arg: parts.operative});
        }

        return new Types.Applicative(parts.operative);
    };

    obj.k_unwrap = function (args, env) {
        var parts = Types.util.gatherArguments(args._expand(env), ["applicative"], true);

        if (!(parts.applicative instanceof Types.Applicative)) {
            return Error.BadMatch("expected applicative", {arg: parts.applicative});
        }

        return parts.applicative.operative;
    };

    obj.k_sequence = function (args, env) {
        var last = Types.inert;

        while (args !== Types.nil) {
            last = args.left.eval_(env);

            args = args.right;
        }

        return last;
    };

    function expectEnvironment(item, args, env) {
        if (!(item instanceof Types.Env)) {
            // WARN: I'm not returning here, so if we stop throwing
            // exceptions it will fail weirdly
            Error.EnvironmentExpected(item, {args: args, env: env});
        }
    }

    obj.k_make_environment = function (args, env) {
        var parents = Types.util.pairToArray(args._expand(env), function (item, i) {
            expectEnvironment(item, args, env);
        });

        return new Types.Env({}, parents);
    };

    obj.k_get_current_environment = function (args, env) {
        return env;
    };

    obj.k_eval = function (args, env) {
        var parts = Types.util.gatherArguments(args, ["expression", "environment"], true),
            evalEnv = parts.environment.eval_(env);

        expectEnvironment(evalEnv, args, env);

        // eval the env to get it, don't eval the expression in this env
        return parts.expression.eval_(evalEnv);
    };

    obj.kDefine = function (args, env) {
        var
            name = args.left.value,
            value = args.right.left,
            evaledValue;

        evaledValue = value.eval_(env);

        env.define(name, evaledValue);

        return Types.Inert.inert;
    };

    obj.kDisplay = function (args, env) {
        alert(args.left.eval_(env).toJs());

        return Types.Inert.inert;
    };

    obj.kApply = function (args, env) {
        return args.eval_(env);
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

    obj.k_boolean_p = function (args, env) {
        return obj.allOfType(args._expand(env), Types.Bool);
    };

    obj.k_symbol_p = function (args, env) {
        return obj.allOfType(args._expand(env), Types.Symbol);
    };

    obj.k_inert_p = function (args, env) {
        return obj.allOfType(args._expand(env), Types.Inert);
    };

    obj.k_ignore_p = function (args, env) {
        return obj.allOfType(args._expand(env), Types.Ignore);
    };

    obj.k_null_p = function (args, env) {
        return obj.allOfType(args._expand(env), Types.Pair.Nil);
    };

    obj.k_pair_p = function (args, env) {
        return obj.allOfType(args._expand(env), Types.Pair);
    };

    obj.k_environment_p = function (args, env) {
        return obj.allOfType(args._expand(env), Types.Env);
    };

    obj.k_operative_p = function (args, env) {
        return obj.allOfType(args._expand(env), Types.Operative);
    };

    obj.k_applicative_p = function (args, env) {
        return obj.allOfType(args._expand(env), [Types.Applicative, Function]);
    };

    obj.compareAllToFirst = function (args, env, methodName) {
        var ok = true, first, items = args._expand(env);

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

    obj.k_eq_p = function (args, env) {
        return obj.compareAllToFirst(args, env, "eq_p");
    };

    obj.k_equal_p = function (args, env) {
        return obj.compareAllToFirst(args, env, "equal_p");
    };

    obj.k_if = function (args, env) {
        var
            parts = Types.util.gatherArguments(args, ["condition", "thenBlock", "elseBlock"]),
            condResult = parts.condition.eval_(env);

        if (condResult instanceof Types.Bool) {
            if (condResult.value === true) {
                return parts.thenBlock.eval_(env);
            } else {
                return parts.elseBlock.eval_(env);
            }
        } else {
            return Error.BooleanExpected(condResult, {args: args, env: env});
        }
    };

    obj.k_cons = function (args, env) {
        var
            parts = Types.util.gatherArguments(args._expand(env), ["car", "cdr"], true),
            car = parts.car,
            cdr = parts.cdr;

        return new Types.Pair(car, cdr);
    };

    obj.makeGround = function () {
        var
            k_eval = obj.k_eval,
            ground = new Types.Env({
                "$lambda": obj.kLambda,
                "$define!": obj.kDefine,
                "apply": obj.kApply,
                "display": obj.kDisplay,

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
                "cons": obj.k_cons,
                "make-environment": obj.k_make_environment,
                "get-current-environment": obj.k_get_current_environment,

                "eval": obj.k_eval,
                "$vau": obj.k_vau,
                "wrap": obj.k_wrap,
                "unwrap": obj.k_unwrap,
                "$sequence": obj.k_sequence
            }, [], false);


        ground.list = Parser.parse('($define! list (wrap ($vau x #ignore x)))').eval_(ground);


        // set the ground as inmutable now that we added all bindings
        ground.inmutable = true;
        return ground;
    };

    Types.Env.makeGround = obj.makeGround;

    return obj;
}));
