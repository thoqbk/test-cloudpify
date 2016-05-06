/**
 * Copyright (C) 2016, Cloudpify
 * 
 * Tho Q Luong <thoqbk@gmail.com>
 * 
 * May 6, 2016
 * 
 */

var expect = require("chai").expect;
var assert = require("chai").assert;


var chai = require("chai");
chai.use(require('chai-fuzzy'));

var Promise = require("bluebird");

var $config = require("../config/app.js");

var AnnotationScanner = require("../lib/annotation-scanner.js");

var log4js = require("log4js");
log4js.configure($config.log);
var $logger = log4js.getLogger("app");

var userService = new (require("../service/sample-user-service"))();

var authenticationService = new (require("../lib/service/authentication-service.js"))(function () {
    return userService;
}, $config, $logger);

var httpClient = require($config.https.enable ? "https" : "http");

describe("test annotation scanner", function () {
    it("should scan all controllers and services", function (done) {
        var scanner = new AnnotationScanner();
        scanner.scan(["controller", "service"])
                .then(function () {
                    var controllerFiles = scanner.getFilesByAnnotation("Controller");
                    expect(controllerFiles).to.include("controller/sample-controller.js");
                    expect(controllerFiles).to.include("controller/sample-controller2.js");
                    expect(controllerFiles).to.include("controller/investment/portfolio-controller.js");
                    done();
                })
                .catch(done);

    });
});
