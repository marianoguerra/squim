/*global define SquimError SquimTypes*/
(function (root, factory) {
    "use strict";

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['squim.error'], function (Error) {
            // Also create a global in case some scripts
            // that are loaded still are looking for
            // a global even when an AMD loader is in use.
            return (root.SquimUtil = factory(Error));
        });
    } else {
        // Browser globals
        root.SquimUtil = factory(SquimError);
    }
}(this, function (Error) {
    "use strict";
    var obj = {};

    obj.isArray = function (obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    };

    return obj;
}));
