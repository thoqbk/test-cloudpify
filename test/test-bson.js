/**
 * Copyright (C) 2016, Cloudpify
 * 
 * Tho Q Luong <thoqbk@gmail.com>
 * 
 * March 22, 2016
 * 
 */

var bson = require("bson");

var BSON = new bson.BSONPure.BSON();

var expect = require("chai").expect;
var assert = require("chai").assert;

var Q = require("q");

var $config = require("../config/app.js");

var log4js = require("log4js");
log4js.configure("./config/log4js.json");
var $logger = log4js.getLogger("app");

describe("Cloudpify with BSON", function () {
    it("should serialize and deserialize data correctly", function () {

        var fakeAvatarDataInString = "fake avatar data";
        var avatarData = new Buffer(fakeAvatarDataInString);

        var user = {
            username: "hiendt",
            age: 20,
            height: 1.57,
            avatar: avatarData
        };

        var userInBinary = BSON.serialize(user, false, true, false);

        var user2 = BSON.deserialize(userInBinary,{
            promoteBuffers:true
        });
        
        $logger.debug("Desirialized avatarData.length: " + user2.avatar.length+"; avatarData is buffer: " + Buffer.isBuffer(user2.avatar));
        $logger.debug("Binary length: " + userInBinary.length);
        $logger.debug("Binary in base64: " + userInBinary.toString("base64"));

        expect(user.username).to.equal(user2.username);
        expect(user.age).to.equal(user2.age);
        expect(user.height).to.be.within(user2.height - 0.0001, user2.height + 0.0001);// compare two float numbers
        expect(user2.avatar.toString()).to.equal(fakeAvatarDataInString);


    });
});