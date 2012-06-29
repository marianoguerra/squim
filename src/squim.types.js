/*global define SquimError SquimEnv SquimUtil*/
(function (root, factory) {
    "use strict";

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['json', 'squim.env', 'squim.error', 'squim.util'], function (JSON, Env, Error, Util) {
            // Also create a global in case some scripts
            // that are loaded still are looking for
            // a global even when an AMD loader is in use.
            return (root.SquimTypes  = factory(JSON, Env, Error, Util));
        });
    } else {
        // Browser globals
        root.SquimTypes = factory(JSON, SquimEnv, SquimError, SquimUtil);
    }
}(this, function (JSON, Env, Error, Util) {
    "use strict";
    var obj = {};

    obj.util = {};

    function Symbol(name) {
        this.value = name;
    }

    Symbol.prototype.toJs = function () {
        return this.value;
    };

    Symbol.prototype.toString = function () {
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

    Str.prototype.toString = Str.prototype.toJs;

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

    Int.prototype.toString = function () {
        return JSON.stringify(this.value);
    };

    function Bool(value) {
        this.value = value;
    }

    Bool.prototype.toJs = function () {
        return this.value;
    };

    Bool.prototype.eval_ = function (env) {
        return this;
    };

    Bool.prototype.toString = function () {
        return (this.value) ? "#t" : "#f";
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

    Float.prototype.toString = function () {
        return JSON.stringify(this.value);
    };

    function Inert() { }

    Inert.prototype.toJs = function () {
        return "#inert";
    };

    Inert.prototype.toString = Inert.prototype.toJs;

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

    Pair.prototype.toString = function () {
        var parts = [], item = this;
        parts.push("(");

        while (item !== Pair.nil) {
            parts.push(item.left.toString());

            if (item.right !== Pair.nil) {
                parts.push(" ");
            }

            item = item.right;
        }

        parts.push(")");
        return parts.join("");
    };

    // Note: Pair.eval_ is defined at the bottom to have access to all definitions

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

    Fun.prototype.toString = function () {
        return "($lambda " + this.params.toString() + " " + this.body.toString() + ")";
    };

    Fun.prototype.apply = function (thisArg, funargs) {
        var bindings,
            newEnv,
            args = funargs[0],
            // TODO: where does this env goes? (dynamic env?)
            env = funargs[1];

        bindings = obj.util.gatherArguments(args, this.params);

        // don't know if parent envs are ok
        newEnv = new Env(bindings, [this.env, env]);

        return this.body.eval_(newEnv);
    };

    function Operative(params, body, env) {
        this.params = params;
        this.env = env;
        this.body = body;
    }

    Operative.prototype.eval_ = function (env) {
        return this;
    };

    Operative.prototype.toJs = function (env) {
        return ['$vau', this.params.toJs(), this.body.toJs()];
    };

    Operative.prototype.toString = function () {
        return "($vau" + this.params.toString() + " " + this.body.toString() + ")";
    };

    Operative.prototype.apply = function (thisArg, funargs) {
        var bindings,
            newEnv,
            args = funargs[0],
            env = funargs[1];

        bindings = obj.util.gatherArguments(args, this.params);

        // don't know if parent envs are ok
        // where does this.env go?
        newEnv = new Env(bindings, [env]);

        return this.body.eval_(newEnv);
    };

    Pair.prototype.eval_ = function (env) {
        var
            proc = this.left.eval_(env),
            args = this.right;

        if (!(args instanceof Pair) && !(args instanceof Pair.Nil)) {
            return Error.ListExpected(args, {env: env, proc: proc, expr: args});
        }

        if (proc instanceof Fun) {
            return proc.apply(null, [args._expand(env), env]);
        } else if (proc instanceof Operative) {
            return proc.apply(null, [args, env]);
        } else if (typeof proc.apply === 'function') {
            return proc.apply(null, [args, env]);
        } else {
            return Error.CombinerExpected(proc, {env: env, proc: proc, expr: args});
        }
    };

    obj.util.gatherArguments = function (items, names) {
        var param, arg, args, iargs, params, iparams, bindings = {};

        if (!(items instanceof Pair)) {
            iargs = args = obj.util.arrayToPair(items);
        } else {
            iargs = args = items;
        }

        if (!(names instanceof Pair)) {
            iparams = params = obj.util.arrayToPair(names);
        } else {
            iparams = params = names;
        }

        while (iparams !== Pair.nil) {

            if (iargs === Pair.nil) {
                return Error.BadMatch(
                    "less parameters provided than required",
                    {params: params, args: args});
            }

            param = iparams.left;
            arg = iargs.left;

            if (param instanceof Symbol) {
                bindings[param.value] = arg;
            } else if (typeof param === "string") {
                bindings[param] = arg;
            } else {
                return Error.BadMatch(
                    "expected identifier in argument list",
                    {params: params, args: args});
            }

            iparams = iparams.right;
            iargs = iargs.right;
        }

        return bindings;
    };

    obj.util.arrayToPair = function (items) {
        if (items.length  === 0) {
            return Pair.nil;
        }

        return new Pair(items[0], obj.util.arrayToPair(items.slice(1)));
    };

    obj.Str = Str;
    obj.Int = Int;
    obj.Bool = Bool;
    obj.Float = Float;
    obj.Inert = Inert;
    obj.Pair = Pair;
    obj.Nil = Pair.Nil;
    obj.Symbol = Symbol;
    obj.Env = Env;
    obj.Fun = Fun;
    obj.Operative = Operative;

    obj.nil = Pair.nil;
    obj.inert = Inert.inert;
    obj.t = new Bool(true);
    obj.f = new Bool(false);

    return obj;
}));
