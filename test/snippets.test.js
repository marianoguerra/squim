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

        Q.test("function call as object attr value gets evaluated", function () {
            var result, values, code = '($sequence ($define! headers (list "first" {label "second" childs (list "2.1" "2.2" third {label "inner" childs (list "3.1" fourth)})})))';

            result = runCode(code, {"third": "2.3", "fourth": "3.2"});

            values = result.bindings;

            Q.equal(values.headers.left.value, "first");
            Q.equal(values.headers.right.left.attrs.label.value, "second");
            Q.equal(values.headers.right.left.attrs.childs.left.value, "2.1");
            Q.equal(values.headers.right.left.attrs.childs.right.left.value, "2.2");
            Q.equal(values.headers.right.left.attrs.childs.right.right.left.value, "2.3");
            Q.equal(values.headers.right.left.attrs.childs.right.right.right.left.attrs.label.value, "inner");
            Q.equal(values.headers.right.left.attrs.childs.right.right.right.left.attrs.childs.left.value, "3.1");
            Q.equal(values.headers.right.left.attrs.childs.right.right.right.left.attrs.childs.right.left.value, "3.2");
        });

        Q.test("complex comparison", function () {
            var result, values, code = '($define! result (<=? (value msg errorThreshold) :{hint "objattrs"} (value msg currentValue) :{hint "objattrs"}) :{hint "compare"})';

            result = runCode(code, {
                "value": {
                    "msg": {
                        "errorThreshold": 70,
                        "currentValue": 80
                    }
                }
            });

            values = result.bindings;

            Q.equal(values.result.value, true);
            Q.equal(values.value.attrs.msg.attrs.errorThreshold.value, 70);
            Q.equal(values.value.attrs.msg.attrs.currentValue.value, 80);
        });

    };

    return obj;
}));
