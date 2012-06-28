/*global define SquimError SquimTypes*/
(function (root, factory) {
    "use strict";

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['json', 'squim.error'], function (JSON, Error) {
            // Also create a global in case some scripts
            // that are loaded still are looking for
            // a global even when an AMD loader is in use.
            return (root.SquimUtil = factory(JSON, Error));
        });
    } else {
        // Browser globals
        root.SquimUtil = factory(JSON, SquimError);
    }
}(this, function (JSON, Error) {
    "use strict";
    var obj = {};

    obj.isArray = function (obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    };

    return obj;
}));
