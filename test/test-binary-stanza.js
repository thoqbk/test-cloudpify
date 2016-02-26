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

        $config.channelAuthentication.enable = false;

        var cloudpifyHandler = new (require("../lib/handler.js"))();

        cloudpifyHandler.start()
                .then(function () {

                    var retVal = Q.defer();

                    var serverUrl = ($config.https.enable ? "https" : "http") + "://localhost:5102";
                    var opts = {
                        forceNew: true
                    };

                    var io = require("socket.io-client");
                    var socket = io.connect(serverUrl, opts);
                    socket.on("error", function (error) {
                        socket.off("error");
                        retVal.reject(error);
                    });
                    socket.on("connect", function () {
                        retVal.resolve(socket);
                    });
                    return retVal.promise;
                })
                .then(function (socket) {
                    var retVal = Q.defer();
                    //read file
                    var fs = require("fs");
                    var fileData = fs.readFileSync(__dirname + "/../client/public/image/victorian-houses.jpg");

                    var Stanzas = require("../lib/stanzas");

                    var binaryStanza = Stanzas.wrapAsBinaryStanza({
                        id: 1,
                        type: "iq",
                        action: "cloudchat:sample-controller2:upload-image",
                        body: fileData
                    });
                    socket.emit("cloudpify", binaryStanza);

                    socket.on("cloudpify", function (stanza) {
                        $logger.debug("Receive response stanza from server: " + JSON.stringify(stanza));
                        expect(stanza.type).to.equal("result");
                        retVal.resolve();
                    });
                    return retVal.promise;
                })
                .then(function () {
                    return cloudpifyHandler.stop();
                })
                .then(done)
                .fail(done);




    });
});

