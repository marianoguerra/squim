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

    Symbol.prototype.eq_p = function (obj) {
        if (obj instanceof Symbol) {
            return this.value === obj.value;
        } else {
            return false;
        }
    };

    Symbol.prototype.equal_p = Symbol.prototype.eq_p;

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

    Str.prototype.eq_p = function (obj) {
        if (obj instanceof Str) {
            return this.value === obj.value;
        } else {
            return false;
        }
    };

    Str.prototype.equal_p = Str.prototype.eq_p;

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

    Int.prototype.eq_p = function (obj) {
        if (obj instanceof Int) {
            return this.value === obj.value;
        } else {
            return false;
        }
    };

    Int.prototype.equal_p = Int.prototype.eq_p;

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

    Bool.prototype.eq_p = function (obj) {
        if (obj instanceof Bool) {
            return this.value === obj.value;
        } else {
            return false;
        }
    };

    Bool.prototype.equal_p = Bool.prototype.eq_p;

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

    Float.prototype.eq_p = function (obj) {
        if (obj instanceof Float) {
            return this.value === obj.value;
        } else {
            return false;
        }
    };

    Float.prototype.equal_p = Float.prototype.eq_p;

    function Inert() { }

    Inert.prototype.toJs = function () {
        return "#inert";
    };

    Inert.prototype.toString = Inert.prototype.toJs;

    Inert.inert = new Inert();

    Inert.prototype.eval_ = function (env) {
        return this;
    };

    Inert.prototype.eq_p = function (obj) {
        if (obj instanceof Inert) {
            return this === obj;
        } else {
            return false;
        }
    };

    Inert.prototype.equal_p = function (obj) {
        return (obj instanceof Inert);
    };

    function Ignore() { }

    Ignore.prototype.toJs = function () {
        return "#ignore";
    };

    Ignore.prototype.toString = Ignore.prototype.toJs;

    Ignore.ignore = new Ignore();

    Ignore.prototype.eval_ = function (env) {
        return this;
    };

    Ignore.prototype.eq_p = function (obj) {
        if (obj instanceof Ignore) {
            return this === obj;
        } else {
            return false;
        }
    };

    Ignore.prototype.equal_p = function (obj) {
        return (obj instanceof Ignore);
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

            if (item.right instanceof Pair || item.right instanceof Pair.Nil) {
                item = item.right;
            } else {
                parts.push(". ");
                parts.push(item.right.toString());
                item = Pair.nil;
            }
        }

        parts.push(")");
        return parts.join("");
    };

    Pair.prototype.eq_p = function (obj) {
        return this === obj;
    };

    Pair.prototype.equal_p = function (obj) {
        return (this === obj || (this.left.equal_p(obj.left) && this.right.equal_p(obj.right)));
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

    Pair.Nil.prototype.eq_p = function (obj) {
        if (obj instanceof Pair.Nil) {
            return this === obj;
        } else {
            return false;
        }
    };

    Pair.Nil.prototype.equal_p = function (obj) {
        return (obj instanceof Pair.Nil);
    };

    Pair.nil = new Pair.Nil();

    function Applicative(operative) {
        this.operative = operative;
    }

    Applicative.prototype.eval_ = function (env) {
        return this;
    };

    Applicative.prototype.toJs = function (env) {
        return ['$lambda', this.operative.formals.toJs(), this.operative.expr.toJs()];
    };

    Applicative.prototype.toString = function () {
        return "($lambda " + this.operative.formals.toString() + " " + this.operative.expr.toString() + ")";
    };

    Applicative.prototype.apply = function (thisArg, funargs) {
        var
            args = funargs[0],
            dynamicEnv = funargs[1],
            evaledArgs = args._expand(dynamicEnv);

        return this.operative.apply(thisArg, [evaledArgs, dynamicEnv]);
    };

    // TODO: eq_p and equal_p for Applicative

    function Operative(formals, eformal, expr, staticEnv) {
        this.formals = formals;
        this.eformal = eformal;
        this.expr = expr;
        this.staticEnv = staticEnv;

        if (this.eformal !== Ignore.ignore && !(eformal instanceof Symbol)) {
            return Error.SymbolExpected(this.eformal, {
                msg: "Symbol or #ignore expected as environment parameter"
            });
        }
    }

    Operative.prototype.eval_ = function (env) {
        return this;
    };

    Operative.prototype.toJs = function (env) {
        return ['$vau', this.formals.toJs(), this.eformal.toJs(), this.expr.toJs()];
    };

    Operative.prototype.toString = function () {
        return "($vau" + this.formals.toString() + " " + this.eformal.toString() + " " + this.expr.toString() + ")";
    };

    Operative.prototype.apply = function (thisArg, funargs) {
        var
            key,
            bindings,
            localEnv,
            args = funargs[0],
            dynamicEnv = funargs[1];

        localEnv = new Env({}, [this.staticEnv]);

        //bindings = obj.util.gatherArguments(args._expand(localEnv), this.formals);
        bindings = obj.util.gatherArguments(args, this.formals);

        for (key in bindings) {
            localEnv.define(key, bindings[key]);
        }

        if (this.eformal instanceof Symbol) {
            localEnv.define(this.eformal, dynamicEnv);
        }

        return this.expr.eval_(localEnv);
    };

    // TODO: eq_p and equal_p for Operative

    Pair.prototype.eval_ = function (env) {
        var
            proc = this.left.eval_(env),
            args = this.right;

        if (!(args instanceof Pair) && !(args instanceof Pair.Nil)) {
            return Error.ListExpected(args, {env: env, proc: proc, expr: args});
        }

        if (proc instanceof Applicative) {
            return proc.apply(null, [args, env]);
        } else if (proc instanceof Operative) {
            return proc.apply(null, [args, env]);
        } else if (typeof proc.apply === 'function') {
            return proc.apply(null, [args, env]);
        } else {
            return Error.CombinerExpected(proc, {env: env, proc: proc, expr: args});
        }
    };

    obj.util.gatherArguments = function (items, names, exactNumber, defaults) {
        var param, paramName, arg, argValue, args, iargs, params, iparams, bindings = {};

        defaults = defaults || {};

        if (Util.isArray(items)) {
            iargs = args = obj.util.arrayToPair(items);
        } else {
            iargs = args = items;
        }

        if (Util.isArray(names)) {
            iparams = params = obj.util.arrayToPair(names);
        } else if (names instanceof Symbol) {
            // NOTE if names is a symbol then bind all args to that symbol
            // and return
            bindings[names.value] = args;
            return bindings;
        } else {
            iparams = params = names;
        }

        while (iparams !== Pair.nil) {
            param = iparams.left;

            if (param instanceof Symbol) {
                paramName = param.value;
            } else if (typeof param === "string") {
                paramName = param;
            } else {
                return Error.BadMatch(
                    "expected identifier in argument list",
                    {params: params, args: args, got: param});
            }

            arg = iargs.left;

            if (iargs === Pair.nil) {
                if (defaults[paramName] === undefined) {
                    return Error.BadMatch(
                        "less parameters provided than required",
                        {params: params, args: args});
                } else {
                    argValue = defaults[paramName];
                }
            } else {
                argValue = arg;
            }

            bindings[paramName] = argValue;


            if (obj.util.isListOrNil(iparams.right)) {
                iparams = iparams.right;
            } else if (iparams.right instanceof Symbol) {
                bindings[iparams.right.value] = iargs.right;
                iparams = Pair.nil;
            } else if (typeof iparams.right === "string") {
                bindings[iparams.right] = iargs.right;
                iparams = Pair.nil;
            }

            iargs = iargs.right;
        }

        if (exactNumber && iargs !== Pair.nil) {
            return Error.BadMatch(
                "more parameters provided than required",
                {params: params, args: args});
        }

        return bindings;
    };

    obj.util.arrayToPair = function (items) {
        if (items.length === 0) {
            return Pair.nil;
        }

        return new Pair(items[0], obj.util.arrayToPair(items.slice(1)));
    };

    obj.util.pairToArray = function (pair, checkItem) {
        var result = [], i = 0;

        while (pair !== Pair.nil) {
            if (checkItem) {
                checkItem(pair.left, i);
            }

            result.push(pair.left);

            pair = pair.right;
            i += 1;
        }

        return result;
    };

    obj.util.isApplicative = function (obj) {
        return obj instanceof Applicative || obj instanceof Function;
    };

    obj.util.isEnvironment = function (obj) {
        return obj instanceof Env;
    };

    obj.util.isListOrNil = function (obj) {
        return obj instanceof Pair || obj instanceof Pair.Nil;
    };

    obj.Str = Str;
    obj.Int = Int;
    obj.Bool = Bool;
    obj.Float = Float;
    obj.Inert = Inert;
    obj.Ignore = Ignore;
    obj.Pair = Pair;
    obj.Nil = Pair.Nil;
    obj.Symbol = Symbol;
    obj.Env = Env;
    obj.Applicative = Applicative;
    obj.Operative = Operative;

    obj.nil = Pair.nil;
    obj.inert = Inert.inert;
    obj.ignore = Ignore.ignore;
    obj.t = new Bool(true);
    obj.f = new Bool(false);

    return obj;

}));
