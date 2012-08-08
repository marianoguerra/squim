/*global define require*/

require.config({
    paths: {
        qunit: "http://code.jquery.com/qunit/qunit-git",
        "squim": "../src/squim",
        "squim.types": "../src/squim.types",
        "squim.parser": "../src/squim.parser",
        "squim.error": "../src/squim.error",
        "squim.util": "../src/squim.util",
        "squim.ground": "../src/squim.ground",
        "json": "http://cdnjs.cloudflare.com/ajax/libs/json2/20110223/json2"
    },

    shim: {
        qunit: {
            exports: "QUnit"
        },
        json: {
            exports: "JSON"
        }
    }
});

(function (root, factory) {
    "use strict";

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['squim.env.test', 'squim.pair.test', 'squim.parser.test',
                'squim.types.test', 'squim.util.test', 'squim.modules.test',
                'snippets.test'],
                function (EnvTest, PairTest, ParserTest, TypesTest, UtilTest,
                         ModulesTest, SnippetsTest) {
            // Also create a global in case some scripts
            // that are loaded still are looking for
            // a global even when an AMD loader is in use.
            return (root.SquimTest = factory(EnvTest, PairTest, ParserTest,
                                             TypesTest, UtilTest, ModulesTest,
                                             SnippetsTest));
        });
    } else {
        // Browser globals
        root.SquimTest = factory(root.SquimEnvTest, root.SquimPairTest,
                                 root.SquimParserTest, root.SquimTypesTest,
                                 root.SquimUtilTest, root.SquimModulesTest,
                                 root.SnippetsTest);
    }
}(this, function (EnvTest, PairTest, ParserTest, TypesTest, UtilTest,
                  ModulesTest, SnippetsTest) {
    "use strict";
    var obj = {};

    obj.test = function () {
        EnvTest.test();
        PairTest.test();
        ParserTest.test();
        TypesTest.test();
        UtilTest.test();
        ModulesTest.test();
        SnippetsTest.test();
    };

    obj.test();

    return obj;
}));
