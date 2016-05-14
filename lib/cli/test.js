"use strict";

var DeployCommand = require('./deploy');

var doc = "Usage:\n" +
	"	force-dev-tool test [<remote>]";

var Subcommand = module.exports = function(project) {
	var self = this;
	DeployCommand.call(self, project, doc);
	self.action = "Test execution";
	self.opts = self.docopt();
	self.deployOpts = {
		rollbackOnError: true,
		checkOnly: true,
		testLevel: 'RunLocalTests'
	};
};

Subcommand.prototype = Object.create(DeployCommand.prototype);
Subcommand.prototype.constructor = Subcommand;
