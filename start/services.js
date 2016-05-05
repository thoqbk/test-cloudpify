/**
 * Copyright (C) 2015, Cloudchat
 * 
 * Tho Q Luong <thoqbk@gmail.com>
 * 
 * Aug 9, 2015 12:10:55 AM
 * 
 */

var UserService = require("../service/sample-user-service.js");

module.exports = function ($registerFx, $registerByClassFx, $config, $dbConnectionFactory) {
    if ($config.applicationMode == "full" || $config.applicationMode == "service") {
        $registerByClassFx("userService", UserService);
    }

    return new Promise(function (resolve, reject) {
        $dbConnectionFactory.get("mysql")
                .then(function (dbMysql) {
                    $registerFx("dbMysql", dbMysql);
                    resolve();
                })
                .catch(reject);
    });

};