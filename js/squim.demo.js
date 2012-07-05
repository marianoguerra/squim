/*global define Squim require*/
require.config({
    baseUrl: "js/",
    paths: {
        "squim": "../src/squim",
        "squim.types": "../src/squim.types",
        "squim.parser": "../src/squim.parser",
        "squim.error": "../src/squim.error",
        "squim.util": "../src/squim.util",
        "squim.ground": "../src/squim.ground",
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
    var obj = {},
        ground = Squim.types.Env.makeGround(),
        env = new Squim.types.Env({}, [ground]);

    function getCode() {
        return $("#code").val();
    }

    function writeResult(result) {
        $("#result").html(result);
    }

    function writeEnv(env) {
        console.log("env", env);
    }

    $(function () {
        $("#run").click(function () {
            var result = Squim.run(getCode(), env);

            writeResult(result.toString());
            writeEnv(env.toJs());
        });
    });

    return obj;
});

