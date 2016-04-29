/**
 * Register public resources
 */

var path = require('path');

module.exports = function ($getResourceFx, $useStaticResourceFx, authenticationService) {

    $useStaticResourceFx(path.resolve(__dirname + "/../client/public"));

    //common js libraries
    $getResourceFx("/service/string-service.js", function (req, res) {
        res.sendFile(path.resolve(__dirname + "/../lib/service/string-service.js"));
    });

    $getResourceFx("/script/q.js", function (req, res) {
        res.sendFile(path.resolve(__dirname + "/../node_modules/q/q.js"));
    });

    $getResourceFx("/login", function (req, res) {
        var userId = req.query.userId;
        var password = req.query.password;
        if (userId == 1 && password == "123") {
            authenticationService.generateToken(1)
                    .then(function (token) {
                        res.end(token);
                    })
                    .catch(function (error) {
                        res.end("FAIL");
                    });
        } else {
            res.end("FAIL");
        }
    });
};

