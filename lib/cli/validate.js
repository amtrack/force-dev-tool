"use strict";

var DeployCommand = require('./deploy');

var doc = "Usage:\n" +
"	force-dev-tool validate [options] [<remote>]\n" +
"\n" +
"Options:\n" +
"	-d=<directory>    Directory containing the metadata and package.xml.";

var SubCommand = module.exports = function(project) {
	var self = this;
	DeployCommand.call(self, project, doc);
	self.action = "Validation";
	self.deployOpts = {rollbackOnError: true, checkOnly: true};
};

SubCommand.prototype = Object.create(DeployCommand.prototype);
SubCommand.prototype.constructor = SubCommand;
