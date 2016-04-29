/**
 * Copyright (C) 2016, Cloudchat
 * 
 * Tho Q Luong <thoqbk@gmail.com>
 * 
 * Feb 12, 2016
 * 
 */


var expect = require("chai").expect;
var assert = require("chai").assert;

var Promise = require("bluebird");

var _ = require("underscore");


var $config = require("../config/app.js");

var log4js = require("log4js");
log4js.configure($config.log);
var $logger = log4js.getLogger("app");

var userService = new (require("../service/sample-user-service"))();

var authenticationService = new (require("../lib/service/authentication-service.js"))(function () {
    return userService;
}, $config, $logger);

var serverUrl = ($config.https.enable ? "https" : "http") + "://localhost:5102";
var opts = {
    forceNew: true
};

describe("test sample controller", function () {
    var cloudpifyHandler = null;
    var connection = null;

    beforeEach(function (done) {

        cloudpifyHandler = new (require("../cloudpify.js"))();

        cloudpifyHandler.start("full")
                .then(function () {
                    return authenticationService.generateToken(1);
                })
                .then(function (token) {
                    opts.query = "userId=1&token=" + token;
                    var io = require("socket.io-client");
                    connection = io.connect(serverUrl, opts);
                    connection.on("connect", function () {
                        console.log("Open SocketIO connection to server successfully");
                        done();
                    });
                })
                .catch(done);
    });

    afterEach(function (done) {
        cloudpifyHandler.stop()
                .then(function () {
                    connection.destroy();
                    done();
                })
                .catch(done);
    });

    it("should return correct stanza format", function (done) {
        connection.on("cloudpify", function (stanza) {
            console.log("Receive message from server: " + JSON.stringify(stanza));
            expect(stanza.id).to.equal(10);
            expect(stanza.action).to.equal("cloudchat:sample-controller:hello");
            done();
        });

        connection.emit("cloudpify", {
            id: 10,
            action: "cloudchat:sample-controller:hello",
            type: "iq",
            body: {
                deviceId: "android",
                username: "Tho Q Luong"
            }
        });
    });

    it("should return correct message depends on deviceId. Test group.after and group.before", function (done) {
        var requestStanza = {
            id: 10,
            action: "cloudchat:sample-controller:hello",
            type: "iq",
            body: {
                deviceId: "android",
                username: "Tho Q Luong"
            }
        };
        //android: before
        //iphone: sample controller
        //microsoft: after
        connection.on("cloudpify", function (stanza) {
            console.log("DeviceId: " + requestStanza.body.deviceId + ": " + stanza.body);
            //console.log("Receive message from server: " + JSON.stringify(stanza));
            if (requestStanza.body.deviceId == "android") {
                assert.match(stanza.body, /this is before/i);
                requestStanza.body.deviceId = "iphone";
                connection.emit("cloudpify", requestStanza);
            } else if (requestStanza.body.deviceId == "iphone") {
                assert.match(stanza.body, /this is SampleController/i);
                requestStanza.body.deviceId = "microsoft";
                connection.emit("cloudpify", requestStanza);
            } else if (requestStanza.body.deviceId == "microsoft") {
                assert.match(stanza.body, /this is after/i);
                done();
            }

        });

        connection.emit("cloudpify", requestStanza);
    });

});

