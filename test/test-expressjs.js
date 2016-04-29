/**
 * Copyright (C) 2016, Cloudpify
 * 
 * Tho Q Luong <thoqbk@gmail.com>
 * 
 * March 31, 2016
 * 
 */


var expect = require("chai").expect;
var assert = require("chai").assert;

var Promise = require("bluebird");

var $config = require("../config/app.js");

var log4js = require("log4js");
log4js.configure($config.log);
var $logger = log4js.getLogger("app");

var userService = new (require("../service/sample-user-service"))();

var authenticationService = new (require("../lib/service/authentication-service.js"))(function () {
    return userService;
}, $config, $logger);

var httpClient = require($config.https.enable ? "https" : "http");

describe("test expressjs request and response", function () {
    it("should return default page with code 200 or 404", function (done) {
        var cloudpifyAppHandler = new (require("../lib/handler.js"))();
        cloudpifyAppHandler.start()
                .then(function () {
                    return sendHttpRequest("/", true);
                })
                .then(function (statusCode) {
                    expect(statusCode).to.equal(200);
                    return sendHttpRequest("/", false);
                })
                .then(function (statusCode) {
                    expect(statusCode).to.equal(200);
                    return sendHttpRequest("/random-url-" + Math.floor(Math.random() * 100000000), true);
                })
                .then(function (statusCode) {
                    expect(statusCode).to.equal(404);
                    return sendHttpRequest("/random-url-" + Math.floor(Math.random() * 100000000), false);
                })
                .then(function (statusCode) {
                    expect(statusCode).to.equal(404);
                    return cloudpifyAppHandler.stop();

                })
                .then(function () {
                    done();
                })
                .catch(done);
    });
});


function sendHttpRequest(path, isPost) {

    var options = {
        hostname: "localhost",
        port: 5102,
        path: path,
        method: isPost ? "POST" : "GET",
        headers: {
            userId: 1,
            'Content-Type': 'application/json'
        }
    };

    if ($config.https.enable) {
        options.requestCert = true;
        options.rejectUnauthorized = false;
    }

    return new Promise(function (resolve, reject) {
        var request = httpClient.request(options, function (response) {
            response.setEncoding("utf8");
            var responseInString = "";
            response.on("data", function (chunk) {
                responseInString += chunk;
            });
            response.on("end", function () {
                resolve(response.statusCode);
            });
        });
        request.on("error", function (error) {
            reject(error);
        });

        request.end();
    });
}