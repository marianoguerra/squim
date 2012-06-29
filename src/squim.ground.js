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

    obj.k_eq_p = function (args, env) {
        var ok = true, first, items = args._expand(env),
            leftValue, firstValue;

        while (items !== Types.nil) {
            if (first === undefined) {
                first = items.left;

                if (first.value !== undefined) {
                    firstValue = first.value;
                } else {
                    firstValue = first;
                }
                continue;
            }

            if (items.left.value !== undefined) {
                leftValue = items.left.value;
            } else {
                leftValue = items.left;
            }

            if (leftValue !== firstValue) {
                ok = false;
                break;
            }

            items = items.right;
        }

        return (ok) ? Types.t : Types.f;
    };

    obj.makeGround = function () {
        return new Types.Env({
            "$lambda": obj.kLambda,
            "$define!": obj.kDefine,
            "apply": obj.kApply,
            "list": obj.kList,
            "display": obj.kDisplay,

            "boolean?": obj.k_boolean_p,
            "eq?": obj.k_eq_p
        }, [], true);
    };

    Types.Env.makeGround = obj.makeGround;

    return obj;
}));
