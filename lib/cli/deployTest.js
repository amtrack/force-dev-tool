"use strict";

var DeployCommand = require('./deploy');

var doc = "Usage:\n" +
	"	force-dev-tool deployTest [options] [<remote>]\n" +
	"\n" +
	"Options:\n" +
	"	-d=<directory>    Directory containing the metadata and package.xml.";

var Subcommand = module.exports = function(project) {
	var self = this;
	DeployCommand.call(self, project, doc);
	self.action = "Deployment with test execution";
	self.deployOpts = {
		rollbackOnError: true,
		testLevel: 'RunLocalTests'
	};
};

Subcommand.prototype = Object.create(DeployCommand.prototype);
Subcommand.prototype.constructor = Subcommand;
