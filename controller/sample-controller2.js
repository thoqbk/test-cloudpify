/**
 * Copyright (C) 2016, Cloudpify
 * 
 * Tho Q Luong <thoqbk@gmail.com>
 * 
 * Feb 13, 2016
 * 
 */

module.exports = SampleController2;

function SampleController2($logger) {

    /**
     * Test session
     * @param {type} $session
     * @param {type} $response
     * @returns {undefined}
     */
    this.increase = function ($session, $response) {
        if ($session.count == null) {
            $session.count = {
                value: 0
            };
        } else {
            $session.count.value++;
        }
        $response.end($session.count);
    };

    this.uploadImage = function ($input, $response) {
        var fs = require('fs');
        var fileName = $input.get("fileName") + "-" + Math.round(Math.random() * 1000000) + "." + $input.get("fileExtension");
        var filePath = __dirname + "/../client/public/image/" + fileName;
        fs.writeFile(filePath, $input.get("fileData"), function (error) {
            if (error != null) {
                $response.error("Error: " + error);
            } else {
                var message = "Write file successful, fileName: " + filePath;
                $response.end(message);
                $logger.debug(message);
            }
        });
    };



}

