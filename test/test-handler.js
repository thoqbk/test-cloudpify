/**
 * Copyright (C) 2016, Cloudpify
 * 
 * Tho Q Luong <thoqbk@gmail.com>
 * 
 * Feb 15, 2016
 * 
 */

var expect = require("chai").expect;
var assert = require("chai").assert;

var Q = require("q");

var $config = require("../config/app.js");

var log4js = require("log4js");
log4js.configure("./config/log4js.json");
var $logger = log4js.getLogger("app");

var userService = new (require("../service/sample-user-service"))();

var authenticationService = new (require("../lib/service/authentication-service.js"))(function () {
    return userService;
}, $config, $logger);

var httpClient = require($config.https.enable ? "https" : "http");

describe("cloudpify handler", function () {
    it("should start server successfully", function (done) {
        //start
        var cloudpifyHandler = new (require("../cloudpify.js"))();
        cloudpifyHandler.start("full")
                .then(function () {
                    return testServer();
                })
                .then(function (isStart) {
                    expect(isStart).to.equal(true);

                    //stop server
                    return cloudpifyHandler.stop();
                })
                .then(function () {
                    return testServer();
                })
                .then(function (isRunning) {
                    expect(isRunning).to.equal(false);
                    return cloudpifyHandler.start();//full
                })
                .then(function () {
                    return testServer();
                })
                .then(function (isStart) {
                    expect(isStart).to.equal(true);
                    //stop server
                    return cloudpifyHandler.stop();
                })
                .then(function () {
                    done();
                })
                .fail(done);
    });

    it("should start server in app and service mode", function (done) {
        //start service        
        //start app
        //test
        //stop service
        //test
        //stop app
        var cloudpifyServiceHandler = new (require("../lib/handler.js"))();
        var cloudpifyAppHandler = new (require("../lib/handler.js"))();
        cloudpifyServiceHandler.start("service")
                .then(function () {
                    return cloudpifyAppHandler.start("app");
                })
                .then(function () {
                    return testServer();
                })
                .then(function (isStart) {
                    expect(isStart).to.equal(true);
                    return cloudpifyServiceHandler.stop();
                })
                .then(function () {
                    return testServer();
                })
                .then(function (isRunning) {
                    expect(isRunning).to.equal(true);
                    return cloudpifyAppHandler.stop();
                })
                .then(function () {
                    return testServer();
                })
                .then(function (isRunning) {
                    expect(isRunning).to.equal(false);
                    done();
                })
                .fail(done);
    });
});

function testServer() {
    var retVal = Q.defer();

    authenticationService.generateToken(1)
            .then(function (token) {
                var options = {
                    hostname: "localhost",
                    port: 5102,
                    path: "/post-stanza?token=" + token,
                    method: "POST",
                    headers: {
                        userId: 1,
                        'Content-Type': 'application/json'
                    }
                };
                
                if($config.https.enable){
                    options.rejectUnauthorized = false;
                    options.requestCert = true;
                }
                
                var request = httpClient.request(options, function (response) {
                    response.setEncoding("utf8");
                    var responseInString = "";
                    response.on("data", function (chunk) {
                        responseInString += chunk;
                    });
                    response.on("end", function () {
                        try {
                            console.log("Receive message from server: " + responseInString);
                            retVal.resolve(true);
                        } catch (e) {
                            retVal.reject(e);
                        }
                    });
                });
                request.on("error", function (error) {
                    retVal.resolve(false);
                });
                request.write(JSON.stringify({
                    id: 10,
                    action: "cloudchat:sample-controller:hello",
                    type: "iq",
                    body: {
                        deviceId: "android",
                        username: "Tho Q Luong"
                    }
                }));
                request.end();
            });

    return retVal.promise;

}