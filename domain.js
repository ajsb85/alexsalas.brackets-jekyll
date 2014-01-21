/*global require, exports */

(function () {
    "use strict";

    var child_process = require("child_process"),
        domainName = "jekyll.execute";

    function jekyll(directory, command, callback) {
        var grep = child_process.exec(command, { cwd: directory}, function (err, stdout, stderr) {
            callback(err ? stderr : undefined, err ? undefined : stdout);
        });
    }
	
    exports.init = function (DomainManager) {
        if (!DomainManager.hasDomain(domainName)) {
            DomainManager.registerDomain(domainName, {
                major: 0,
                minor: 1
            });
        }
        
        DomainManager.registerCommand(domainName, "jekyll", jekyll, true, "Exec Jekyll cmd",
            [
                {
                    name: "directory",
                    type: "string"
                },
                {
                    name: "command",
                    type: "string"
                }
            ],
            [{
                name: "stdout",
                type: "string"
            }]
        );
    };
    	
}());