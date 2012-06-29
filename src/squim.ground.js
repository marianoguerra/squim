/*global define SquimError SquimTypes SquimUtil*/
(function (root, factory) {
    "use strict";

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['json', 'squim.types', 'squim.error', 'squim.util'],
               function (JSON, Types, Error, Util) {
            // Also create a global in case some scripts
            // that are loaded still are looking for
            // a global even when an AMD loader is in use.
            return (root.SquimGround = factory(JSON, Types, Error, Util));
        });
    } else {
        // Browser globals
        root.SquimGround = factory(JSON, SquimTypes, SquimError, SquimUtil);
    }
}(this, function (JSON, Types, Error, Util) {
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
            body = args.right;
        }

        return new Types.Fun(params, body, env);
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

    obj.kList = function (args, env) {
        return args._expand(env);
    };

    obj.kDisplay = function (args, env) {
        alert(args.left.eval_(env).toJs());

        return Types.Inert.inert;
    };

    obj.kApply = function (args, env) {
        return args.eval_(env);
    };

    obj.allOfType = function (items, type) {
        var ok = true;

        while (items !== Types.nil) {
            if (!(items.left instanceof type)) {
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

    obj.makeGround = function () {
        return new Types.Env({
            "$lambda": obj.kLambda,
            "$define!": obj.kDefine,
            "apply": obj.kApply,
            "list": obj.kList,
            "display": obj.kDisplay,

            "boolean?": obj.k_boolean_p,
            "symbol?": obj.k_symbol_p,
            "inert?": obj.k_inert_p,

            "eq?": obj.k_eq_p,
            "equal?": obj.k_equal_p,

            "$if": obj.k_if
        }, [], true);
    };

    Types.Env.makeGround = obj.makeGround;

    return obj;
}));
