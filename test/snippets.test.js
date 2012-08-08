/*global define QUnit*/
(function (root, factory) {
    "use strict";

    if (typeof define === 'function' && define.amd) {
        define(['qunit', 'squim'], function (Q, Squim) {
            return (root.SnippetsTest = factory(Q, Squim));
        });
    } else {
        root.SnippetsTest = factory(root.QUnit, root.Squim);
    }
}(this, function (Q, Squim) {
    "use strict";
    var obj = {};

    obj.test = function () {
        var _ground;
        Q.module("Squim snippets");

        function aliasSquimName(names, env) {
            var name, newName;

            env.inmutable = false;

            for (name in names) {
                newName = names[name];
                env.define(newName, env.get(name));
            }

            env.inmutable = true;
        }

        /* Squim related functions */
        function getGround() {
            if (_ground === undefined) {
                _ground = Squim.types.Env.makeGround();

                aliasSquimName({"$define!": "set"}, _ground);
            }

            return _ground;
        }

        function runCode(code, bindings) {
            var env = new Squim.types.Env.fromJsObject(bindings || {}, [getGround()]);

            Squim.run(code, env);

            return env;
        }

        Q.test("block with sets and $cond", function () {
            var result, values, code = '($sequence (set itemId item) (set text (+ (value group) :{hint "objattrs"} ":" item "->" (value value) :{hint "objattrs"})) (set symbol "○") (set color ($cond ((<? (value value) 30) :{hint "compare"} "#3c3" :{format "color"}) ((<? (value value) 60) :{hint "compare"} "#cc3" :{format "color"}) (#t "#c33" :{format "color"}))) (set groupName (value group) :{hint "objattrs"}))';

            result = runCode(code, {
                "item": "server",
                "value": {
                    "group": "g1",
                    "value": 59
                }
            });

            values = result.bindings;

            Q.equal(values.itemId.value, "server");
            Q.equal(values.text.value, "g1:server->59");
            Q.equal(values.symbol.value, "○");
            Q.equal(values.color.value, "#cc3");
            Q.equal(values.groupName.value, "g1");
        });
    };

    return obj;
}));
