/**
 * Copyright (C) 2015, Cloudchat
 * 
 * Tho Q Luong <thoqbk@gmail.com>
 * 
 * June 15, 2015
 * 
 */


/**
 * 
 * @param {type} route
 * @returns {undefined}
 */
module.exports = function (route) {
    route.action("cloudchat:sample-controller:hello2", "SampleController@hello");    
    route.group()
            .before(function ($input, $response, $logger) {
                var message = "Hello " + $input.get("username") + ", this is before";
                if ($input.get("deviceId") == "android") {
                    $response.end(message);
                }
                $logger.debug(message);
            })
            .after(function ($input, $logger, $response) {
                var message = "Hello " + $input.get("username") + ", this is after";
                if ($input.get("deviceId") == "microsoft") {
                    $response.end(message);
                }
                $logger.debug(message);
            })
            .action("cloudchat:sample-controller:hello", "SampleController@hello");
    //test session
    route.action("cloudchat:sample-controller2:increase", "SampleController2@increase");
};