/*global define SquimTypes SquimEval SquimParser SquimGround*/
(function (root, factory) {
    "use strict";

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['squim.types', 'squim.eval', 'squim.parser', 'squim.ground'],
               function (Types, Eval, Parser, Ground) {
            // Also create a global in case some scripts
            // that are loaded still are looking for
            // a global even when an AMD loader is in use.
            return (root.Squim = factory(Types, Eval, Parser, Ground));
        });
    } else {
        // Browser globals
        root.Squim = factory(SquimTypes, SquimEval, SquimParser, SquimGround);
    }
}(this, function (Types, Eval, Parser, Ground) {
    "use strict";
    var obj = {};

    obj.types = Types;
    obj.eval_ = Eval;
    obj.Parser = Parser;
    obj.parse = function () {
        return Parser.parse.apply(Parser, arguments);
    };

    return obj;
}));
