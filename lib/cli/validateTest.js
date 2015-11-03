"use strict";

var DeployCommand = require('./deploy');

var doc = "Usage:\n" +
"	force-dev-tool validateTest [options] [<remote>]\n" +
"\n" +
"Options:\n" +
"	-d=<directory>    Directory containing the metadata and package.xml [default: ./src].";

var SubCommand = module.exports = function(project) {
	var self = this;
	DeployCommand.call(self, project, doc);
	self.action = "Validation with test execution";
	self.deployOpts = {rollbackOnError: true, checkOnly: true, testLevel: 'RunLocalTests'};
};

SubCommand.prototype = Object.create(DeployCommand.prototype);
SubCommand.prototype.constructor = SubCommand;
