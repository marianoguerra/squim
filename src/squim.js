/*global define SquimTypes SquimParser SquimGround SquimError*/
(function (root, factory) {
    "use strict";

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['squim.types', 'squim.parser', 'squim.ground', 'squim.error'],
               function (Types, Parser, Ground, Error) {
            // Also create a global in case some scripts
            // that are loaded still are looking for
            // a global even when an AMD loader is in use.
            return (root.Squim = factory(Types, Parser, Ground, Error));
        });
    } else {
        // Browser globals
        root.Squim = factory(SquimTypes, SquimParser, SquimGround, SquimError);
    }
}(this, function (Types, Parser, Ground, Error) {
    "use strict";
    var obj = {};

    obj.types = Types;
    obj.Parser = Parser;
    obj.errors = Error;

    obj.parse = function () {
        return Parser.parse.apply(Parser, arguments);
    };

    obj.trampoline = function (cc) {
        while (cc) {
            cc = cc.run();
        }
    };

    obj.run = function (code, env, callback) {
        var exp, result = null;

        if (env === undefined) {
            env = new obj.types.Env({}, [obj.types.Env.makeGround()]);
        }

        exp = obj.parse(code);

        function onResult(value) {
            result = value;
        }

        if (callback) {
            obj.trampoline(new Types.Cc(exp, env, callback));

        } else {
            obj.trampoline(new Types.Cc(exp, env, onResult));

            return result;
        }
    };

    return obj;
}));
