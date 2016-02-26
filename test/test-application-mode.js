/**
 * Copyright (C) 2016, Cloudpify
 * 
 * Tho Q Luong <thoqbk@gmail.com>
 * 
 * Feb 16, 2016
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

describe("test application mode", function () {
    it("should start 2 cloudpify instance successfully (mode = service, app)", function (done) {
        var cloudpifyAppHandler = new (require("../lib/handler.js"))();
        var cloudpifyServiceHandler = new (require("../lib/handler.js"))();

        //1. start service
        //2. start app
        //3. test and expect that works
        //4. stop service
        //5. stop app
        //6. test and expect that doesn't work
        //
        //7. start service (to allow app could detect remote service and start successfully)
        //8. start app
        //9. stop service
        //10.test and exepect that doesn't work (because of missing remote userServcice)
        cloudpifyServiceHandler.start("service")
                .then(function () {
                    return cloudpifyAppHandler.start("app");
                })
                .then(function () {
                    return testServer();
                })
                .then(function (isRunning) {
                    expect(isRunning).to.equal(true);
                    //stop app and service
                    return cloudpifyServiceHandler.stop();
                })
                .then(function () {
                    return cloudpifyAppHandler.stop();
                })
                .then(function () {
                    return testServer();
                })
                .then(function (isRunning) {
                    expect(isRunning).to.equal(false);
                    //start service
                    return cloudpifyServiceHandler.start("service");
                })
                .then(function () {
                    return cloudpifyAppHandler.start("app");
                })
                .then(function () {
                    return cloudpifyServiceHandler.stop();
                })
                .then(function () {
                    return testServer();
                })
                .then(function (isRunning) {
                    if(!$config.channelAuthentication.enable){
                        $logger.warn("This test require enable channel-authentication to work perfectly");
                    }
                    expect(isRunning).to.equal(!$config.channelAuthentication.enable);
                    //stop app
                    return cloudpifyAppHandler.stop();
                })
                .then(done)
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

                if ($config.https.enable) {
                    options.requestCert = true;
                    options.rejectUnauthorized = false;
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
                            var responseInJson = JSON.parse(responseInString);
                            retVal.resolve(responseInJson.type == "result");
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