/**
 * Copyright (C) 2016, Cloudpify
 * 
 * Tho Q Luong <thoqbk@gmail.com>
 * 
 * Feb 13, 2016
 * 
 */

var expect = require("chai").expect;
var assert = require("chai").assert;

var Promise = require("bluebird");

var $config = require("../config/app.js");

var httpClient = require($config.https.enable ? "https" : "http");

var serverUrl = ($config.https.enable ? "https" : "http") + "://localhost:5102";
var opts = {
    forceNew: true
};

var log4js = require("log4js");
log4js.configure($config.log);
var $logger = log4js.getLogger("app");

describe("test authentication service", function () {

    if (!$config.channelAuthentication.enable) {
        $logger.warn("This case requires $config.channelAuthentication.enable set to 'true'");
        return;
    }
    //Start server    
    //require("../app.js");

    var userId = 1;
    var password = "123";
    var token = null;

    var cloudpifyHandler = new (require("../lib/handler.js"))();

    beforeEach(function (done) {
        cloudpifyHandler.start()
                .then(function () {
                    //get token
                    var options = {
                        hostname: "localhost",
                        port: 5102,
                        path: "/login?userId=" + userId + "&password=" + password,
                        method: "GET"
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
                            if (responseInString == "FAIL") {
                                done(new Error(responseInString));
                            } else {
                                token = responseInString;
                                done();
                            }
                        });
                    });
                    request.on("error", function (error) {
                        done(error);
                    });
                    request.end();
                })
                .catch(done);
    });

    afterEach(function (done) {
        cloudpifyHandler.stop()
                .then(done)
                .catch(done);
    });

    it("should create new connection fail with an invalid token", function (done) {

        opts.query = "userId=" + userId + "&token=this_is_an_invalid_token";
        var io = require("socket.io-client");
        connection = io.connect(serverUrl, opts);
        connection.on("error", function () {
            connection.destroy();
            //using http   
            sendStanzaRequestViaHttpPost("this_is_an_invalid_token_2")
                    .then(function (stanza) {
                        expect(stanza.type).to.equal("error");
                        done();
                    })
                    .catch(done);
        });
        connection.on("connect", function () {
            assert.ok(false, "Still open connection with an invalid token");
            done();
        });
    });

    it("should create new connection successfully with a valid token", function (done) {
        opts.query = "userId=" + userId + "&token=" + token;
        var io = require("socket.io-client");
        connection = io.connect(serverUrl, opts);
        connection.on("connect", function () {
            connection.destroy();
            //using http
            sendStanzaRequestViaHttpPost(token)
                    .then(function (stanza) {
                        expect(stanza.type).to.equal("result");
                        done();
                    })
                    .catch(done);
        });
    });

    it("should expire the token after 10s", function (done) {
        this.timeout(12000);
        sendStanzaRequestViaHttpPost(token)
                .then(function (stanza) {
                    expect(stanza.type).to.equal("result");
                    console.log("Waiting 10s for expiring the authentication token ...");

                    return new Promise(function (resolve) {
                        setTimeout(function () {
                            resolve(sendStanzaRequestViaHttpPost(token));
                        }, 10000);
                    });

                })
                .then(function (stanza) {
                    expect(stanza.type).to.equal("error");
                    done();
                })
                .catch(done);
    });
});

function sendStanzaRequestViaHttpPost(token) {
    
    return new Promise(function (resolve, reject) {
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
                    resolve(JSON.parse(responseInString));
                } catch (e) {
                    reject(e);
                }
            });
        });
        request.on("error", function (error) {
            reject(error);
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
}
