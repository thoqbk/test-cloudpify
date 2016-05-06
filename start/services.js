/**
 * Copyright (C) 2015, Cloudchat
 * 
 * Tho Q Luong <thoqbk@gmail.com>
 * 
 * Aug 9, 2015 12:10:55 AM
 * 
 */

/**
 * 
 * @param {type} $register
 * @param {type} $dbConnectionFactory
 * @returns {Promise}
 */
module.exports = function ($register, $dbConnectionFactory) {

    return new Promise(function (resolve, reject) {
        $dbConnectionFactory.get("mysql")
                .then(function (dbMysql) {
                    $register("dbMysql", dbMysql);
                    resolve();
                })
                .catch(reject);
    });
};