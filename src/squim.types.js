/*global define SquimError SquimEnv*/
(function (root, factory) {
    "use strict";

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['json', 'squim.env', 'squim.error'], function (JSON, Env, Error) {
            // Also create a global in case some scripts
            // that are loaded still are looking for
            // a global even when an AMD loader is in use.
            return (root.SquimTypes  = factory(JSON, Env, Error));
        });
    } else {
        // Browser globals
        root.SquimTypes = factory(JSON, SquimEnv, SquimError);
    }
}(this, function (JSON, Env, Error) {
    "use strict";
    var obj = {}, apply;

    function Symbol(name) {
        this.value = name;
    }

    Symbol.prototype.toJs = function () {
        return this.value;
    };

    Symbol.prototype.eval_ = function (env) {
        var result = env.get(this.value);

        if (result === undefined) {
            return Error.UnboundSymbol(this.value, {env: env});
        } else {
            return result;
        }
    };

    function Str(value) {
        this.value = value;
    }

    Str.prototype.toJs = function () {
        return JSON.stringify(this.value);
    };

    Str.prototype.eval_ = function (env) {
        return this;
    };

    function Int(value) {
        this.value = value;
    }

    Int.prototype.toJs = function () {
        return this.value;
    };

    Int.prototype.eval_ = function (env) {
        return this;
    };

    function Float(value) {
        this.value = value;
    }

    Float.prototype.toJs = function () {
        return this.value;
    };

    Float.prototype.eval_ = function (env) {
        return this;
    };

    function Inert() { }

    Inert.prototype.toJs = function () {
        return "#inert";
    };

    Inert.inert = new Inert();

    Inert.prototype.eval_ = function (env) {
        return this;
    };

    function Pair(left, right) {
        this.left = left;
        this.right = right;
    }

    Pair.prototype.toJs = function () {
        var result = [this.left.toJs()];

        return result.concat(this.right.toJs());
    };

    Pair.prototype.eval_ = function (env) {
        var proc = this.left.eval_(env);
        return apply(proc, this.right, env);
    };

    Pair.prototype._expand = function (env) {
        return new Pair(this.left.eval_(env), this.right._expand(env));
    };

    Pair.Nil = function () {
    };

    Pair.Nil.prototype.eval_ = function (env) {
        return this;
    };

    Pair.Nil.prototype._expand = function (env) {
        return Pair.nil;
    };

    Pair.Nil.prototype.toString = function () {
        return "()";
    };

    Pair.Nil.prototype.toJs = function () {
        return [];
    };

    Pair.nil = new Pair.Nil();

    function Fun(params, body, env) {
        this.params = params;
        this.env = env;
        this.body = body;
    }

    Fun.prototype.eval_ = function (env) {
        return this;
    };

    Fun.prototype.toJs = function (env) {
        return ['$lambda', this.params.toJs(), this.body.toJs()];
    };

    Fun.prototype.apply = function (thisArg, funargs) {
        var bindings = {},
            newEnv,
            args = funargs[0],
            // TODO: where does this env goes? (dynamic env?)
            env = funargs[1],
            params = this.params, param, iargs = args, arg;

        while (params !== Pair.nil) {

            if (iargs === Pair.nil) {
                return Error.BadMatch(
                    "less parameters provided than required",
                    {params: params, args: args, env: this.env});
            }

            param = params.left;
            arg = iargs.left;

            if (param instanceof Symbol) {
                bindings[param.value] = arg;
            } else {
                return Error.BadMatch(
                    "expected symbol in argument list definition",
                    {params: this.params, args: args, env: this.env});
            }

            params = params.right;
            iargs = iargs.right;
        }

        // don't know if parent envs are ok
        newEnv = new Env(bindings, [this.env, env]);

        return this.body.eval_(newEnv);
    };

    function $lambda(args, env) {
        var params, body;

        if (!(args instanceof Pair)) {
            return Error.BadMatch(
                "expected $lambda <params> <body>",
                {args: args});
        }

        params = args.left;

        if (args.right === Pair.nil) {
            body = Inert.inert;
        } else {
            body = args.right;
        }

        return new Fun(params, body, env);
    }

    function $define(args, env) {
        var
            name = args.left.value,
            value = args.right.left,
            evaledValue;

        evaledValue = value.eval_(env);

        env.define(name, evaledValue);

        return Inert.inert;
    }

    function list(args, env) {
        return args._expand(env);
    }

    function display(args, env) {
        alert(args.left.eval_(env).toJs());

        return Inert.inert;
    }

    Env.makeGround = function () {
        return new Env({
            "$lambda": $lambda,
            "$define!": $define,
            "list": list,
            "display": display
        });
    };

    apply = function (proc, args, env) {
        if (proc instanceof Fun) {
            return proc.apply(null, [args._expand(env), env]);
        } else if (typeof proc.apply === 'function') {
            return proc.apply(null, [args, env]);
        } else {
            return Error.CombinerExpected(proc, {env: env, proc: proc, expr: args});
        }
    };

    obj.Str = Str;
    obj.Int = Int;
    obj.Float = Float;
    obj.Inert = Inert;
    obj.Pair = Pair;
    obj.Nil = Pair.Nil;
    obj.Symbol = Symbol;
    obj.Env = Env;
    obj.Fun = Fun;

    obj.nil = Pair.nil;
    obj.inert = Inert.inert;

    return obj;
}));
