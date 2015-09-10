"use strict";

var Command = require('./command');

var doc = "Usage:\n" +
"	force-dev-tool baseBranch <branchname>";

var SubCommand = module.exports = function(project) {
	var self = this;
	Command.call(self, doc, project);
};

SubCommand.prototype = Object.create(Command.prototype);
SubCommand.prototype.constructor = SubCommand;

SubCommand.prototype.complete = function(tabtab, data) {
	return tabtab.log(['BRANCHNAME'], data, '');
};

SubCommand.prototype.process = function(callback) {
	var self = this;
	self.opts = self.docopt();
	var branch = self.opts['<branchname>'];
	if (branch.split('/')[0] === 'feature') {
		console.log('develop');
	}
	else if (branch === 'develop' || branch.split('/')[0] === 'hotfix') {
		console.log('master');
	}
	else {
		callback('could not determine base branch of ' + branch);
	}
	callback();
};
