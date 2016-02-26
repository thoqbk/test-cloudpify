/**
 * Copyright (C) 2016, Cloudpify
 * 
 * Tho Q Luong <thoqbk@gmail.com>
 * 
 * Feb 12, 2016
 * 
 */

var expect = require("chai").expect;
var assert = require("chai").assert;

var Q = require("q");

var Fx = require("../lib/fx.js");

var _ = require("underscore");

var container = new (require("../lib/container.js"))();

var log4js = require("log4js");
log4js.configure("./config/log4js.json");
var $logger = log4js.getLogger("app");
container.register("$logger", $logger);

describe("IoC container", function () {
    //1. register a service instance and test
    it("should register a service instance successfully", function () {
        var service1 = {
            hello: function () {
                return "service1.hello";
            }
        };
        container.register("service1", service1);
        expect(container.resolve("service1")).to.not.equal(null);
        expect(container.resolve("service1").hello()).to.equal("service1.hello");
    });
    //2. register a service class and test
    it("should register service by class and test successfully", function () {
        var Service2 = function () {
            this.hello2 = function () {
                return "service2.hello2";
            };
            this.hi2 = function () {
                return "service2.hi2";
            };
        };
        container.registerByClass("service2", Service2);
        container.flushLazyServiceClasses();
        expect(container.resolve("service2")).to.not.equal(null);
        expect(container.resolve("service2").hello2()).to.equal("service2.hello2");
        expect(container.resolve("service2").hi2()).to.equal("service2.hi2");
    });
    //3. register a service class but missing dependency and test
    var Service3 = function (service1, service2, service4) {
        this.hi3 = function () {
            return "service3.hi3";
        };
    };
    it("should be fail if register a service class but missing dependency for it", function () {
        container.registerByClass("service3", Service3);
        assert.throws(function () {
            container.flushLazyServiceClasses();
        }, /Cannot build service class/);
    });
    //4. fix 3. by add missing dependency and attempt to flushLazyServiceClasses
    it("should flush lazy service-classes successfully when add missing service4", function () {
        var Service4 = function (service1, service2) {
            this.hi4 = function () {
                return "service4.hi4";
            };
        };
        container.registerByClass("service4", Service4);
        assert.doesNotThrow(function () {
            container.flushLazyServiceClasses();
        });

        assert.instanceOf(container.resolve("service3"), Service3);
        assert.instanceOf(container.resolve("service4"), Service4);

        expect(container.resolve("service3").hi3()).to.equal("service3.hi3");
    });
    //5. try to build object from by passing a constructor
    it("should build an object sucessfully", function () {
        var Controller5 = function (service3, service1) {
            expect(service3.hi3()).to.equal("service3.hi3");
            expect(service1.hello()).to.equal("service1.hello");
        };

        var $buildFx = container.resolve("$buildFx");
        try {
            $buildFx(Controller5);
        } catch (e) {
            assert.ok(false, "Build Container5 fail, message: " + e);
        }

        var Controller51 = function (service5) {
            expect(service5.hello5()).to.equal("service5.hello5");
        };
        try {
            var service5 = {
                hello5: function () {
                    return "service5.hello5";
                }
            };
            $buildFx(Controller51, function (name) {
                if (name == "service5") {
                    return service5;
                }
            });
        } catch (e) {
            assert.ok(false, "Build Container51 with dependency resolver fail, message: " + e);
        }
    });

    //6. invoke method with missing resolver
    it("should invoke method with missing resolver correctly", function () {
        var f = function (service1, service6) {
            expect(service1.hello()).to.equal("service1.hello");
            expect(service6.hello6()).to.equal("service6.hello6");

            return "service6.hi6";
        };
        $invokeFx = container.resolve("$invokeFx");
        var message = $invokeFx(f, null, function (name) {
            if (name == "service6") {
                return {
                    hello6: function () {
                        return "service6.hello6";
                    }
                };
            }
        });
        expect(message).to.equal("service6.hi6");
    });
});



