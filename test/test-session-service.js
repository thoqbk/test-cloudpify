/**
 * Copyright (C) 2016, Cloudchat
 * 
 * Tho Q Luong <thoqbk@gmail.com>
 * 
 * Feb 13, 2016
 * 
 */



var expect = require("chai").expect;
var assert = require("chai").assert;

var Q = require("q");

var $config = require("../config/app.js");

var httpClient = require($config.https.enable ? "https" : "http");

var log4js = require("log4js");
log4js.configure("./config/log4js.json");
var $logger = log4js.getLogger("app");

var userService = new (require("../service/sample-user-service"))();

var authenticationService = new (require("../lib/service/authentication-service.js"))(function () {
    return userService;
}, $config, $logger);

describe("test session service", function () {

    var cloudpifyHandler = new (require("../cloudpify.js"));

    beforeEach(function (done) {
        cloudpifyHandler.start()
                .then(done)
                .fail(done);
    });

    afterEach(function (done) {
        cloudpifyHandler.stop()
                .then(done)
                .fail(done);
    });

    it("should increase a count variable after each request. Via HTTP Post", function (done) {

        authenticationService.generateToken(1)
                .then(function (token) {
                    sendStanzaRequestViaHttpPost(token)
                            .then(function (stanza) {
                                expect(stanza.body.value).to.equal(0);
                                return sendStanzaRequestViaHttpPost(token);
                            })
                            .then(function (stanza) {
                                expect(stanza.body.value).to.equal(1);
                                return sendStanzaRequestViaHttpPost(token);
                            })
                            .then(function (stanza) {
                                expect(stanza.body.value).to.equal(2);
                                done();
                            })
                            .fail(done);
                })
                .fail(done);
    });

    it("should increase a count variable after each request. Via Socket IO", function (done) {
        authenticationService.generateToken(1)
                .then(function (token) {
                    var serverUrl = ($config.https.enable ? "https" : "http") + "://localhost:5102";
                    var opts = {
                        forceNew: true
                    };
                    opts.query = "userId=1&token=" + token;

                    var requestStanza = {
                        id: 10,
                        action: "cloudchat:sample-controller2:increase",
                        type: "iq"
                    };

                    var io = require("socket.io-client");
                    connection = io.connect(serverUrl, opts);
                    connection.on("connect", function () {
                        console.log("Open SocketIO connection to server successfully");
                        connection.emit("cloudpify", requestStanza);
                    });

                    connection.on("cloudpify", function (stanza) {
                        var limit = 10;
                        if (stanza.body.value < limit) {
                            connection.emit("cloudpify", requestStanza);
                        } else if (stanza.body.value == limit) {
                            connection.destroy();
                            done();
                        }
                    });
                });
    });
});

function sendStanzaRequestViaHttpPost(token) {
    var retVal = Q.defer();

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
                retVal.resolve(JSON.parse(responseInString));
            } catch (e) {
                retVal.reject(e);
            }
        });
    });
    request.on("error", function (error) {
        retVal.reject(error);
    });
    request.write(JSON.stringify({
        id: 10,
        action: "cloudchat:sample-controller2:increase",
        type: "iq"
    }));
    request.end();

    return retVal.promise;
}
