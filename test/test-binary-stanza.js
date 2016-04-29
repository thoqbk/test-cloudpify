/* global it */

/**
 * Copyright (C) 2016, Cloudpify
 * 
 * Tho Q Luong <thoqbk@gmail.com>
 * 
 * Feb 26, 2016
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

var bson = require("bson");

var BSON = new bson.BSONPure.BSON();

var httpClient = require($config.https.enable ? "https" : "http");

describe("test binary stanza", function () {

    it("should wrap and unwrap binary stanza correctly", function () {
        var hello = "Xin chào Việt Nam!";
        var stanza = {
            id: 334,
            type: "iq",
            action: "cloudpify:hello-vietnam",
            body: new Buffer(hello, "utf8")
        };

        //$logger.debug(JSON.stringify(stanza));

        var Stanzas = require("../lib/stanzas");

        var binaryStanza = Stanzas.wrapAsBinaryStanza(stanza);

        var unwrapStanza = Stanzas.unwrapBinaryStanza(binaryStanza);

        expect(unwrapStanza.id).to.equal("" + stanza.id);
        expect(unwrapStanza.type).to.equal(stanza.type);
        expect(unwrapStanza.action).to.equal(stanza.action);
        expect(unwrapStanza.body.length).to.equal(stanza.body.length);

        var unwrapHello = unwrapStanza.body.toString("utf8", 0);
        expect(unwrapHello).to.equal(hello);
    });

    it("should process binary stanza correctly", function (done) {
        this.timeout(5000);

        $config.channelAuthentication.enable = false;

        var cloudpifyHandler = new (require("../lib/handler.js"))();

        //read file
        var fs = require("fs");
        var fileData = fs.readFileSync(__dirname + "/../client/public/image/victorian-houses.jpg");

        var binaryStanza = BSON.serialize({
            id: 1,
            type: "iq",
            action: "cloudchat:sample-controller2:upload-image",
            body: {
                fileName: "victorian-houses",
                fileExtension: "jpg",
                fileData: fileData
            }
        });

        cloudpifyHandler.start()
                .then(function () {

                    return new Promise(function (resolve, reject) {
                        var serverUrl = ($config.https.enable ? "https" : "http") + "://localhost:5102";
                        var opts = {
                            forceNew: true
                        };

                        var io = require("socket.io-client");
                        var socket = io.connect(serverUrl, opts);
                        socket.on("error", function (error) {
                            socket.off("error");
                            reject(error);
                        });
                        socket.on("connect", function () {
                            resolve(socket);
                        });
                    });


                })
                .then(function (socket) {
                    $logger.debug("Begin emitting file having size: " + fileData.length
                            + "; binaryStanza.length: " + binaryStanza.length);
                    socket.emit("cloudpify", binaryStanza);

                    return new Promise(function (resolve) {
                        socket.on("cloudpify", function (stanza) {
                            $logger.debug("Receive response stanza from server: " + JSON.stringify(stanza));
                            expect(stanza.type).to.equal("result");
                            resolve();
                        });
                    });

                })
                .then(function () {
                    return authenticationService.generateToken(1);
                })
                .then(function (token) {
                    //Try to send data via http post binary
                    return new Promise(function (resolve, reject) {
                        var httpClient = require($config.https.enable ? "https" : "http");
                        var options = {
                            hostname: "localhost",
                            port: 5102,
                            path: "/post-stanza?token=" + token,
                            method: "POST",
                            headers: {
                                userId: 1,
                                'Content-Type': 'stanza/binary'// IMPORTANT!!!
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
                                    var responseStanza = JSON.parse(responseInString);
                                    if (responseStanza.type == "result") {
                                        resolve(true);
                                    } else {
                                        reject(new Error(responseStanza.body));
                                    }
                                } catch (e) {
                                    reject(e);
                                }
                            });
                        });

                        request.on("error", function (error) {
                            $logger.debug("Error: " + error.stack);
                            reject(error);
                        });

                        request.write(binaryStanza);
                        request.end();
                    });

                })
                .then(function () {
                    return cloudpifyHandler.stop();
                })
                .then(done)
                .catch(done);
    });
});

