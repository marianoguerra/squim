/*global define Squim require*/
require.config({
    baseUrl: "js/",
    paths: {
        "squim": "../src/squim",
        "squim.env": "../src/squim.env",
        "squim.types": "../src/squim.types",
        "squim.parser": "../src/squim.parser",
        "squim.error": "../src/squim.error",
        "squim.eval": "../src/squim.eval",
        "jquery": "http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min",
        "json": "http://cdnjs.cloudflare.com/ajax/libs/json2/20110223/json2"
    },

    shim: {
        json: {
            exports: "JSON"
        }
    }
});

require(['squim', 'jquery'], function (Squim, $) {
    "use strict";
    var obj = {}, env = Squim.types.Env.makeGround();

    function getCode() {
        return $("#code").val();
    }

    function writeResult(result) {
        $("#result").html(JSON.stringify(result));
    }

    function writeEnv(env) {
        console.log("env", env);
    }

    $(function () {
        $("#run").click(function () {
            var
                exp = Squim.parse(getCode()),
                result;

            result = Squim.eval_(exp, env);
            writeResult(result.toJs());
            writeEnv(env.toJs());
        });
    });

    return obj;
});

