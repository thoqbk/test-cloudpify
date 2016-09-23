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
  var cloudpifyHandler = new (require("../lib/handler.js"))();
  var userId = 1;
  var token = null;

  //read file
  var fs = require("fs");
  var fileData = fs.readFileSync(__dirname + "/../client/public/image/victorian-houses.jpg");

  var stanzaWithBinary = {
    id: 1,
    type: "iq",
    action: "cloudchat:sample-controller2:upload-image",
    body: {
      fileName: "victorian-houses",
      fileExtension: "jpg",
      fileData: fileData
    }
  };

  beforeEach(function (done) {
    cloudpifyHandler.start()
    .then(function () {
      return authenticationService.generateToken(userId);
    })
    .then(function(generatedToken) {
      token = generatedToken;
      done();
    }).catch(done);
  });

  afterEach(function(done) {
    cloudpifyHandler
    .stop()
    .then(function(){
      done();
    })
    .catch(done);
  });

  it("should process binary stanza correctly", function (done) {
    var emitPromise = new Promise(function (resolve, reject) {
      var serverUrl = ($config.https.enable ? "https" : "http") + "://localhost:5102";
      var opts = {
        forceNew: true,
        query: 'userId=' + userId + '&token=' + token
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

    emitPromise.then(function (socket) {
      socket.emit("cloudpify", stanzaWithBinary);
      return new Promise(function (resolve) {
        socket.on("cloudpify", function (stanza) {
          $logger.debug("Receive response stanza from server: " + JSON.stringify(stanza));
          expect(stanza.type).to.equal("result");
          resolve();
        });
      });
    })
    .then(function () {
      done();
    })
    .catch(done);
  });

  it("should post binary stanza successfully", function(done) {

    var stanzaInBinary = BSON.serialize(stanzaWithBinary, false, true, false);
    var httpClient = require($config.https.enable ? "https" : "http");
    var options = {
      hostname: "localhost",
      port: 5102,
      path: "/post-stanza?token=" + token,
      method: "POST",
      headers: {
        userId: userId,
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
            done();
          } else {
            done(new Error(responseStanza.body));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    request.on("error", function (error) {
      $logger.debug("Error: " + error.stack);
      done(error);
    });
    request.write(stanzaInBinary);
    request.end();
  });
});
