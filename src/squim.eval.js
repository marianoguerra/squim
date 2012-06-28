/*global define SquimEnv SquimTypes*/
(function (root, factory) {
    "use strict";

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['squim.env', 'squim.types'], function (Env, Types) {
            // Also create a global in case some scripts
            // that are loaded still are looking for
            // a global even when an AMD loader is in use.
            return (root.SquimEval = factory(Env, Types));
        });
    } else {
        // Browser globals
        root.SquimEval = factory(SquimEnv, SquimTypes);
    }
}(this, function (Env, Types) {
    "use strict";

    function apply(proc, args, env) {
        if (proc instanceof Types.Fun) {
            return proc.apply(null, [args._expand(env), env]);
        } else if (typeof proc.apply === 'function') {
            return proc.apply(null, [args, env]);
        } else {
            return Error.CombinerExpected(proc, {env: env, proc: proc, expr: args});
        }
    }

    function eval_(exp, env) {
        if (env === undefined) {
            env = new Env();
        }

        var proc;

        if (exp instanceof Types.Pair) {
            proc = exp.left.eval_(env);
            return apply(proc, exp.right, env);
        } else {
            return exp.eval_(env);
        }
    }
    return eval_;
}));
