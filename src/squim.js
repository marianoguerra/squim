/*global define SquimTypes SquimEval SquimParser*/
(function (root, factory) {
    "use strict";

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['squim.types', 'squim.eval', 'squim.parser'],
               function (Types, Eval, Parser) {
            // Also create a global in case some scripts
            // that are loaded still are looking for
            // a global even when an AMD loader is in use.
            return (root.Squim = factory(Types, Eval, Parser));
        });
    } else {
        // Browser globals
        root.Squim = factory(SquimTypes, SquimEval, SquimParser);
    }
}(this, function (Types, Eval, Parser) {
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
