/* global it */

/**
 * Copyright (C) 2016, Cloudpify
 * 
 * Tho Q Luong <thoqbk@gmail.com>
 * 
 * April 29, 2016
 * 
 */

var Promise = require("bluebird");

describe("test bluebird", function () {

    it.skip("should work correctly", function (done) {

        this.timeout(12000);

        console.log("Beginning ...");
        new Promise(function (resolve) {
            setTimeout(function () {
                console.log("Finish sleeping in 3s");
                resolve(1);
            }, 3000);
        }).then(function (step) {
            console.log("Finish step " + step);
        }).then(function () {
            console.log("Begin sleeping in 5s");
            setTimeout(function () {
                Promise.resolve();
            }, 5000);
        }).then(function () {
            console.log("Finished");
            done();
        }).catch(function (err) {
            console.log("Catch: " + err);
            done(err);
        });
    });

});

