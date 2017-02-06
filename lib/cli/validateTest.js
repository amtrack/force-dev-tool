"use strict";

var DeployCommand = require('./deploy');

var doc = "Usage:\n" +
	"	force-dev-tool validateTest [options] [<remote>]\n" +
	"\n" +
	"DEPRECATED! Use `deploy --checkOnly --test` (or short `deploy -ct`) instead.\n" +
	"\n" +
	"Options:\n" +
	"	--runTests=<classNames>  Names of test classes (one argument, separated by whitespace).\n" +
	"	--runAllTests            Run all tests including tests of managed packages.\n" +
	"	--purgeOnDelete          Don't store deleted components in the recycle bin.\n" +
	"	-d=<directory>           Directory to be deployed [default: src].\n" +
	"	-f=<zipFile>             Zip file to be deployed.";

var SubCommand = module.exports = function(project) {
	var self = this;
	DeployCommand.call(self, project, doc);
};

SubCommand.prototype = Object.create(DeployCommand.prototype);
SubCommand.prototype.constructor = SubCommand;

SubCommand.prototype.process = function(proc, callback) {
	var self = this;
	self.opts = self.docopt();
	self.opts['--checkOnly'] = true;
	self.opts['--test'] = true;
	return DeployCommand.prototype.process.call(self, proc, callback);
};
