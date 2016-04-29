/**
 * Copyright (C) 2015, Cloudchat
 * 
 * Tho Q Luong <thoqbk@gmail.com>
 * 
 * Jul 23, 2015 11:23:11 PM
 * 
 */

var expect = require("chai").expect;
var assert = require("chai").assert;

var Fx = require("../lib/fx.js");

var _ = require("underscore");

function fx1() {

}

function fx2($a1, a2, a3) {

}

function fx3(
        //test
//test2
        ///* hello 1 */
        /* hello 2 */param1,
        /* hello3
         * Vietnam
         *  */
        $param2/* hello4 */,
//test
        param3) {//hello

}

var fx4 = fx3;

var fx5 = function (x1, $x2) {

};

var o = {
    fx1: fx1,
    fx2: fx2,
    fx3: fx3,
    fx4: fx4,
    fx5: fx5
};

describe("Fx: function util", function () {
    it("should detects all methods of object using getMethodNames", function () {
        var methodNames = Fx.getMethodNames(o);
        expect(methodNames.length).to.equal(5);
        assert.include(methodNames, "fx5");
    });

    it("should detects all parameters of function using extractParameters", function () {
        var fx1Parameters = Fx.extractParameters(fx1);
        var fx2Parameters = Fx.extractParameters(fx2);
        var fx3Parameters = Fx.extractParameters(fx3);
        var fx4Parameters = Fx.extractParameters(fx4);
        var fx5Parameters = Fx.extractParameters(fx5);

        expect(fx1Parameters.length).to.equal(0);

        expect(fx2Parameters.length).to.equal(3);
        assert.include(fx2Parameters, "$a1");

        expect(fx3Parameters.length).to.equal(3);

        assert.include(fx3Parameters, "$param2");
        assert.include(fx4Parameters, "param3");

        expect(fx5Parameters.length).to.equal(2);
    });
});

