/*global define SquimError*/
(function (root, factory) {
    "use strict";

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['squim.error'], function (Error) {
            // Also create a global in case some scripts
            // that are loaded still are looking for
            // a global even when an AMD loader is in use.
            return (root.SquimEnv = factory(Error));
        });
    } else {
        // Browser globals
        root.SquimEnv = factory(SquimError);
    }

}(this, function (Error) {
    "use strict";

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

    // @internal
    Env.prototype.toJs = function () {
        var i, parents = [];

        for (i = 0; i < this.parents.length; i += 1) {
            parents.push(this.parents[i].toJs());
        }

        return {
            "bindings": this.bindings,
            "parents": parents
        };
    };

    // NOTE: functions are added to Env in squim.types to avoid
    // circular dependency
    return Env;
}));
