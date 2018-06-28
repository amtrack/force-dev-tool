"use strict";

var Command = require('./command');

var doc = "Usage:\n" +
	"	force-dev-tool login [options] [<remote>]\n" +
	"\n" +
	"Login using Metadata API and show login URL.\n" +
	"\n" +
	"Options:\n" +
	"	--quiet            Do not show login URL.\n" +
	"\n" +
	"Examples:\n" +
	"	$ force-dev-tool login";

var SubCommand = module.exports = function(project) {
	Command.call(this, doc, project);
};

SubCommand.prototype = Object.create(Command.prototype);
SubCommand.prototype.constructor = SubCommand;

SubCommand.prototype.process = function(proc, callback) {
	var self = this;
	self.opts = self.opts ? self.opts : self.docopt();

	var remote;
	try {
		remote = self.project.remotes.get(self.opts['<remote>']);
	} catch (err) {
		return callback(err);
	}

	remote.connect(function(loginErr, conn) {
		if (loginErr) {
			return callback('Login failed for remote ' + remote.name + ': ' + loginErr);
		}
		var message = "Logged in successfully to remote " + remote.name + ".";
		if (!self.opts['--quiet']) {
			message += "\nUse the following URL to open Salesforce in your web browser:\n\n" + conn.instanceUrl + '/secur/frontdoor.jsp?sid=' + conn.accessToken;
		}
		return callback(null, message);
	});
};
