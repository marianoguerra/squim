/*global define SquimError SquimUtil*/
(function (root, factory) {
    "use strict";

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['json', 'squim.error', 'squim.util'], function (JSON, Error, Util) {
            // Also create a global in case some scripts
            // that are loaded still are looking for
            // a global even when an AMD loader is in use.
            return (root.SquimTypes  = factory(JSON, Error, Util));
        });
    } else {
        // Browser globals
        root.SquimTypes = factory(JSON, SquimError, SquimUtil);
    }
}(this, function (JSON, Error, Util) {
    "use strict";
    var obj = {},
        indentCache = {},
        strObjAttrsHint;

    obj.util = {};

    function makeIndent(count) {
        if (count === undefined || count === 0) {
            return "";
        }

        if (indentCache[count] === undefined) {
            indentCache[count] = "\n" + (new Array(count + 1).join("  "));
        }

        return indentCache[count];
    }

    function Type(value) {
        this.value = value;
        this.meta = null;
    }

    Type.prototype.toString = function (level) {
        return makeIndent(level) + JSON.stringify(this.value) + this.metaToString();
    };

    Type.toString = function () {
        return "#[type]";
    };

    Type.prototype.metaToString = function (level) {
        var parts, key, value, valueStr;

        if (this.meta === null) {
            return "";
        } else {
            parts = [];

            for (key in this.meta) {
                value = this.meta[key];

                if (value instanceof Type) {
                    valueStr = value.toString();
                } else {
                    valueStr = JSON.stringify(value);
                }

                parts.push(key + " " + valueStr);
            }

            return " :{" + parts.join(" ") + "}";
        }
    };

    Type.prototype.toJs = function () {
        return this.value;
    };

    Type.prototype.eval_ = function (cc) {
        return cc.resolve(this);
    };

    Type.prototype.eq_p = function (obj) {
        return this.value === obj.value;
    };

    Type.prototype.setMetaData = function (key, value) {
        if (this.meta === null) {
            this.meta = {};
        }

        this.meta[key] = value;
    };

    Type.prototype.getMetaData = function (key, defval) {
        if (this.meta === null) {
            return defval;
        } else {
            return this.meta[key];
        }
    };

    Type.prototype._expand = Type.prototype.eval_;
    Type.prototype.equal_p = Type.prototype.eq_p;

    function Cc(value, env, cont, parent, expand) {
        Type.apply(this, [value]);
        this.env = env;
        this.cont = cont;
        this.parent = parent;
        this.expand = expand;
    }

    Cc.toString = function () {
        return "#[cc]";
    };

    Cc.prototype = new Type(null);

    Cc.prototype.toString = function (level) {
        return makeIndent(level) + "#[continuation]";
    };

    Cc.prototype.toJs = Cc.prototype.toString;

    Cc.prototype.eq_p = function (obj) {
        return this === obj;
    };

    Cc.prototype.equal_p = Cc.prototype.eq_p;

    Cc.prototype.run = function () {
        if (this.expand) {
            return this.value._expand(this);
        } else {
            if (this.value instanceof Function) {
                // functions eval to themselves
                return this.resolve(this.value);
            } else {
                return this.value.eval_(this);
            }
        }
    };

    Cc.prototype.resolve = function (value) {
        return this.cont(value);
    };

    function Symbol(value) {
        Type.apply(this, [value]);
    }

    Symbol.toString = function () {
        return "#[symbol]";
    };

    Symbol.prototype = new Type(null);

    Symbol.prototype.toString = function (level) {
        return makeIndent(level) + this.value + this.metaToString();
    };

    Symbol.prototype.toJs = function () {
        return "/" + this.value + "/";
    };

    Symbol.prototype.eval_ = function (cc) {
        var result = cc.env.get(this.value);

        if (result === undefined) {
            return Error.UnboundSymbol(this.value, {env: cc.env});
        } else {
            return cc.resolve(result);
        }
    };

    Symbol.prototype._expand = Symbol.prototype.eval_;

    Symbol.prototype.eq_p = function (obj) {
        // because a string may contain the same value
        if (obj instanceof Symbol) {
            return this.value === obj.value;
        } else {
            return false;
        }
    };

    Symbol.prototype.equal_p = Symbol.prototype.eq_p;

    function Str(value) {
        Type.apply(this, [value]);
    }

    Str.toString = function () {
        return "#[str]";
    };

    Str.prototype = new Type(null);

    Str.prototype.getOp = function (op) {
        var fun = null;

        if (op === '+') {
            fun = function (a, b) {
                return a + b;
            };
        }

        return fun;
    };

    Str.prototype.toJs = function () {
        return this.value;
    };

    Str.prototype.eq_p = function (obj) {
        // because a symbol may contain the same value
        if (obj instanceof Str) {
            return this.value === obj.value;
        } else {
            return false;
        }
    };

    Str.prototype.equal_p = Str.prototype.eq_p;

    function Int(value) {
        Type.apply(this, [value]);
    }

    Int.toString = function () {
        return "#[int]";
    };

    Int.prototype = new Type(null);

    Int.prototype.getOp = function (op) {
        var fun = null;
        switch (op) {
        case '+':
            fun = function (a, b) {
                return a + b;
            };
            break;
        case '-':
            fun = function (a, b) {
                return a - b;
            };
            break;
        case '*':
            fun = function (a, b) {
                return a * b;
            };
            break;
        case '/':
            fun = function (a, b) {
                return a / b;
            };
            break;

        case '=?':
            fun = function (a, b) {
                return a === b;
            };
            break;
        case '<?':
            fun = function (a, b) {
                return a < b;
            };
            break;
        case '<=?':
            fun = function (a, b) {
                return a <= b;
            };
            break;
        case '>?':
            fun = function (a, b) {
                return a > b;
            };
            break;
        case '>=?':
            fun = function (a, b) {
                return a >= b;
            };
            break;
        }

        return fun;
    };

    function Bool(value) {
        Type.apply(this, [value]);
    }

    Bool.toString = function () {
        return "#[bool]";
    };

    Bool.prototype = new Type(null);

    Bool.prototype.toString = function (level) {
        return makeIndent(level) + ((this.value) ? "#t" : "#f");
    };

    function Float(value) {
        Type.apply(this, [value]);
    }

    Float.toString = function () {
        return "#[float]";
    };

    Float.prototype = new Type(null);

    Float.prototype.getOp = Int.prototype.getOp;

    function Inert() { }

    Inert.toString = function () {
        return "#[inert]";
    };

    Inert.prototype = new Type(null);

    Inert.prototype.toJs = function () {
        return "#inert";
    };

    Inert.prototype.toString = Inert.prototype.toJs;

    Inert.inert = new Inert();

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

    Ignore.toString = function () {
        return "#[ignore]";
    };

    Ignore.prototype = new Type(null);

    Ignore.prototype.toJs = function () {
        return "#ignore";
    };

    Ignore.prototype.toString = Ignore.prototype.toJs;

    Ignore.ignore = new Ignore();

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

    Pair.toString = function () {
        return "#[pair]";
    };

    Pair.prototype = new Type(null);

    Pair.prototype.toJs = function (shallow) {
        var
            left = (shallow) ? this.left : this.left.toJs(),
            right = (shallow) ? this.right : this.right.toJs(),
            result = [left];

        return result.concat(right);
    };

    Pair.prototype.toString = function (level) {
        var parts = [], item = this, childLevel;
        parts.push("(");

        while (item !== Pair.nil) {
            if (item.left instanceof Pair) {
                childLevel = (level || 0) + 1;
            } else {
                childLevel = 0;
            }

            parts.push(item.left.toString(childLevel));

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
        return makeIndent(level) + parts.join("") + this.metaToString();
    };

    Pair.prototype.eq_p = function (obj) {
        return this === obj;
    };

    Pair.prototype.equal_p = function (obj) {
        return (this === obj || (this.left.equal_p(obj.left) && this.right.equal_p(obj.right)));
    };

    // Note: Pair.eval_ is defined at the bottom to have access to all definitions

    Pair.prototype._expand = function (cc) {
        var pair = this;
        return new Cc(pair.left, cc.env,
            function (left) {
                return new Cc(pair.right, cc.env,
                    function (right) {
                        return cc.resolve(new Pair(left, right));
                    }, cc, true);
            }, cc);
    };

    Pair.Nil = function () { };

    Pair.Nil.toString = function () {
        return "#[nil]";
    };

    Pair.Nil.prototype = new Type(null);

    Pair.Nil.prototype.toString = function (level) {
        return makeIndent(level) + "()";
    };

    Pair.Nil.prototype.toJs = function () {
        return [];
    };

    Pair.Nil.prototype.equal_p = function (obj) {
        return (obj instanceof Pair.Nil);
    };

    Pair.nil = new Pair.Nil();

    function Obj(attrs) {
        if (attrs === undefined || attrs === null) {
            attrs = {};
        }

        this._firstEval = true;
        this.attrs = attrs;
    }

    Obj.toString = function () {
        return "#[obj]";
    };

    Obj.prototype = new Type(null);

    function resolveAttr(key, attrs, cc) {
        attrs[key] = obj.run(attrs[key], cc.env);
    }

    Obj.prototype.eval_ = function (cc) {
        var key, values;

        if (this._firstEval) {
            values = [];
            this._firstEval = false;

            for (key in this.attrs) {
                resolveAttr(key, this.attrs, cc);
            }
        }

        return cc.resolve(this);
    };

    Obj.prototype.eq_p = function (obj) {
        return this === obj;
    };

    Obj.prototype.equal_p = Obj.prototype.eq_p;

    Obj.prototype.toJs = function () {
        var attr, val, key, attrs = {};

        for (key in this.attrs) {
            attr = this.attrs[key];

            if (attr instanceof Pair) {
                val = attr.toJs();
            } else if (attr instanceof Pair.Nil) {
                val = [];
            } else if (attr instanceof Obj) {
                val = attr.toJs();
            } else {
                val = attr.value;
            }

            attrs[key] = val;
        }

        return attrs;
    };

    Obj.prototype.toString = function (level) {
        var parts = [], item = this, key, value;

        for (key in this.attrs) {
            value = this.attrs[key];

            parts.push(key + " " + value.toString());
        }

        return makeIndent(level) + "{" + parts.join(" ") + "}" + this.metaToString();
    };


    // convert js object *obj* to a Obj
    // return a new Obj with *attrs* as own attrs
    Obj.fromJsObject = function (attrs) {
        var key, squimattrs = {};

        for (key in attrs) {
            if (attrs.hasOwnProperty(key)) {
                squimattrs[key] = obj.squimify(attrs[key]);
            }
        }

        return new Obj(squimattrs);
    };

    Obj.prototype.apply = function (thisArg, funargs) {
        var
            thisobj = this,
            args = funargs[0],
            cc = funargs[1],
            dynamicEnv = cc.env,
            value;

        if (args instanceof Pair.Nil) {
            // with no args it evaluates to itself
            return cc.resolve(this);
        } else if (args.left instanceof Symbol) {
            // with one or more it evals the left one and tries to find the
            // symbol in the object and returns that attr
            value = thisobj.attrs[args.left.value];

            if (value === undefined) {
                // TODO: throw an error?
                return cc.resolve(obj.inert);
            } else if (args.right instanceof Pair.Nil) {
                // if no more args, resolve to the attr
                return cc.resolve(value);
            } else {
                // if more args apply the attribute to the rest
                // of the arguments
                return value.apply(thisArg, [args.right, cc]);
            }
        } else {
            return Error.BadMatch(
                "expected symbol in argument list",
                {args: args, got: args.left});
        }
    };


    function Env(bindings, parents, inmutable) {

        if (bindings === undefined) {
            bindings = {};
        }

        if (parents === undefined) {
            parents = [];
        }

        this.parents = parents;
        this.bindings = bindings;
        this.inmutable = (inmutable === true);
    }

    Env.toString = function () {
        return "#[env]";
    };

    Env.prototype = new Type(null);

    Env.prototype.define = function (name, value) {
        if (this.inmutable) {
            return Error.MutationError("can't mutate inmutable environment", {name: name, value: value});
        } else {
            this.bindings[name] = value;
        }
    };

    Env.prototype.get = function (name) {
        var i, value = this.bindings[name];

        if (value === undefined) {
            for (i = 0; i < this.parents.length; i += 1) {
                value = this.parents[i].get(name);

                if (value !== undefined) {
                    return value;
                }
            }

            return undefined;
        } else {
            return value;
        }
    };

    Env.prototype.eq_p = function (obj) {
        return this === obj;
    };

    Env.prototype.equal_p = Env.prototype.eq_p;

    // if shallow is true then don't convert parents toJs
    Env.prototype.toJs = function (shallow) {
        var i, parents = [], key, bindings = {};

        for (key in this.bindings) {
            bindings[key] = this.bindings[key].toJs();
        }

        if (!shallow) {
            for (i = 0; i < this.parents.length; i += 1) {
                parents.push(this.parents[i].toJs());
            }
        }

        return {
            "bindings": bindings,
            "parents": parents
        };
    };

    // convert js object *bindings* to a js object that contains all it's
    // attributes as squim objects to be used as a bindings object for an environment
    // return a new Env with *bindings* as bindings of the environment
    Env.fromJsObject = function (bindings, parents) {
        var key, squimBindings = {};

        for (key in bindings) {
            if (bindings.hasOwnProperty(key)) {
                squimBindings[key] = obj.squimify(bindings[key]);
            }
        }

        return new Env(squimBindings, parents);
    };


    function Applicative(operative) {
        this.operative = operative;
    }

    Applicative.toString = function () {
        return "#[applicative]";
    };

    Applicative.prototype = new Type(null);

    Applicative.prototype.toJs = function (env) {
        return ['$lambda', this.operative.formals.toJs(), this.operative.expr.toJs()];
    };

    Applicative.prototype.toString = function (level) {
        level = level || 0;
        return makeIndent(level) + "($lambda " + this.operative.formals.toString() + " " + this.operative.expr.toString(level + 1) + ")";
    };

    Applicative.prototype.apply = function (thisArg, funargs) {
        var
            appl = this,
            args = funargs[0],
            cc = funargs[1],
            dynamicEnv = cc.env;

        return new Cc(args, dynamicEnv, function (expandedArgs) {
                return appl.operative.apply(thisArg, [expandedArgs, cc]);
            }, cc, true);
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

    Operative.toString = function () {
        return "#[operative]";
    };

    Operative.prototype = new Type(null);

    Operative.prototype.toJs = function (env) {
        return ['$vau', this.formals.toJs(), this.eformal.toJs(), this.expr.toJs()];
    };

    Operative.prototype.toString = function (level) {
        level = level || 0;
        return makeIndent(level) + "($vau" + this.formals.toString() + " " + this.eformal.toString() + " " + this.expr.toString(level + 1) + ")";
    };

    Operative.prototype.apply = function (thisArg, funargs) {
        var
            key,
            bindings,
            localEnv,
            args = funargs[0],
            cc = funargs[1],
            dynamicEnv = cc.env;

        localEnv = new Env({}, [this.staticEnv]);

        // XXX maybe this in a Cc?
        bindings = obj.util.gatherArguments(args, this.formals);

        for (key in bindings) {
            localEnv.define(key, bindings[key]);
        }

        if (this.eformal instanceof Symbol) {
            localEnv.define(this.eformal, dynamicEnv);
        }

        return new Cc(this.expr, localEnv, function (result) {
            return cc.resolve(result);
        }, cc);
    };

    // TODO: eq_p and equal_p for Operative

    Pair.prototype.eval_ = function (cc) {
        // TODO check that this.right is a pair
        // TODO check that this.left is a combiner
        var pair = this;
        return new Cc(pair.left, cc.env, function (left) {
            return left.apply(null, [pair.right, cc]);
        }, cc);
    };

    Pair.prototype.forEach = function (callback) {
        var i = 0, pair = this;

        while (pair !== Pair.nil) {
            callback(pair.left, i);

            pair = pair.right;
            i += 1;
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
            iparams = params = obj.util.arrayToPair(names, true);
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

    obj.squimify = function (item) {
        var type = typeof item, value, i, symbols, squimSyms, result;

        if (item instanceof obj.Type) {
            return item;
        } else if (type === "boolean") {
            return (item) ? obj.t : obj.f;
        } else if (type === "string") {
            return new obj.Str(item);
        } else if (type === "number" && (item % 1) === 0) {
            return new obj.Int(item);
        } else if (type === "number") {
            return new obj.Float(item);
        } else if (Util.isArray(item)) {
            if (item.length === 0) {
                return obj.nil;
            } else {
                return obj.util.arrayToPair(item);
            }
        } else if (item instanceof RegExp) {
            value = item.source;

            if (value.charAt(0) === '#') {
                if (value === "#ignore") {
                    return obj.ignore;
                } else if (value === "#inert") {
                    return obj.inert;
                } else {
                    throw "unknown symbol: " + value;
                }
            } else if (value.indexOf(".") !== -1) {
                symbols = value.split(".");
                squimSyms = [];

                for (i = 0; i < symbols.length; i += 1) {
                    squimSyms.push(new obj.Symbol(symbols[i]));
                }

                result = obj.util.arrayToPair(squimSyms, true);
                result.setMetaData("hint", strObjAttrsHint);

                return result;
            } else {
                return new obj.Symbol(value);
            }
        } else if (item === null) {
            return obj.nil;
        } else if (item instanceof Object) {
            return Obj.fromJsObject(item);
        } else {
            throw "unknown type for item: " + item;
        }
    };

    obj.util.arrayToPair = function (items, shallow) {
        if (items.length === 0) {
            return Pair.nil;
        }

        var first;
        if (shallow) {
            first = items[0];
        } else {
            first = obj.squimify(items[0]);
        }

        return new Pair(first, obj.util.arrayToPair(items.slice(1), shallow));
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

    obj.util.isApplicative = function (object) {
        return object instanceof Applicative || object instanceof Function;
    };

    obj.util.isOperative = function (object) {
        return object instanceof Operative;
    };

    obj.util.isCombiner = function (object) {
        return obj.util.isApplicative(object) || obj.util.isOperative(object);
    };

    obj.util.isEnvironment = function (object) {
        return object instanceof Env;
    };

    obj.util.isContinuation = function (object) {
        return object instanceof Cc;
    };

    obj.util.isListOrNil = function (object) {
        return object instanceof Pair || object instanceof Pair.Nil;
    };

    obj.util.withUnevaluatedParams = function (args, names, exactNumber, types, callback, errorCallback) {
        var result = obj.util.matchList(args, names, exactNumber, types);

        if (result.ok) {
            return callback(result.val);
        } else if (errorCallback) {
            return errorCallback(result);
        } else {
            // TODO: other error handling
            throw result;
        }
    };

    obj.util.withParams = function (args, cc, names, exactNumber, types, callback, errorCallback) {
        return new Cc(args, cc.env, function (eargs) {
            var result = obj.util.matchList(eargs, names, exactNumber, types);

            if (result.ok) {
                return callback(result.val);
            } else if (errorCallback) {
                return errorCallback(result);
            } else {
                // TODO: other error handling
                throw result;
            }
        }, cc, true);
    };

    obj.util.matchList = function (list, names, exactNumber, types) {
        var
            name,
            type,
            result,
            typeErrors,
            ok = true,
            listSize = 0,
            reason = "",
            sizeMismatch = false;

        // if it's nil but there are no names
        if (list instanceof Pair.Nil && (names === undefined || names.length === 0)) {
            return {
                ok: true,
                reason: reason,
                val: {}
            };
        } else if (list instanceof Pair.Nil && names && names.length > 0) {
            return {
                ok: false,
                reason: "expected at least " + names.length + " items, got nil\n",
                val: {}
            };
        } else if (list instanceof Pair) {
            result = {};
            typeErrors = {};

            types = types || [];
            names = names || [];

            list.forEach(function (item, index) {
                listSize += 1;
                name = names[index];
                type = types[index];

                if (name === undefined) {
                    if (exactNumber) {
                        ok = false;
                    }
                } else {
                    result[name] = item;

                    if (type !== undefined) {
                        if (!(item instanceof type)) {
                            ok = false;
                            reason += "expected '" + name + "' to be of type " + type + ", got " + item + "\n";
                            typeErrors[name] = type;
                        }
                    }
                }
            });

            if (exactNumber && listSize !== names.length) {
                ok = false;
                sizeMismatch = true;
                reason += "expected exactly " + names.length + " items\n";
            }

            if (!exactNumber && listSize < names.length) {
                ok = false;
                sizeMismatch = true;
                reason += "expected at least " + names.length + " items\n";
            }

            return {
                ok: ok,
                val: result,
                reason: reason,
                listSize: listSize,
                namesSize: names.length,
                sizeMismatch: sizeMismatch,
                typeErrors: typeErrors
            };

        } else {
            return {
                ok: false,
                reason: reason,
                val: {}
            };
        }
    };

    obj.trampoline = function (cc) {
        while (cc) {
            cc = cc.run();
        }
    };

    obj.run = function (exp, env, callback) {
        var result;

        function onResult(value) {
            result = value;
        }

        if (callback) {
            obj.trampoline(new obj.Cc(exp, env, callback));

        } else {
            obj.trampoline(new obj.Cc(exp, env, onResult));

            return result;
        }
    };

    obj.Type = Type;

    obj.Obj = Obj;
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
    obj.Cc = Cc;

    obj.nil = Pair.nil;
    obj.inert = Inert.inert;
    obj.ignore = Ignore.ignore;
    obj.t = new Bool(true);
    obj.f = new Bool(false);

    strObjAttrsHint = new obj.Str("objattrs");

    return obj;

}));
