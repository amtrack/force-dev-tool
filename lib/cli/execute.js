"use strict";

var Command = require('./command');
var path = require('path');
var fs = require('fs-extra');

var doc = "Usage:\n" +
	"	force-dev-tool execute [options] [<remote>]\n" +
	"\n" +
	"Execute anonymous Apex.\n" +
	"Note that there is no debug log being returned currently.\n" +
	"\n" +
	"Examples:\n" +
	"	$ force-dev-tool execute --file insert-account-script.txt\n" +
	"	$ echo \"insert new Account(Name = 'Test Account');\" | force-dev-tool execute\n" +
	"\n" +
	"Options:\n" +
	"	--file=<file>      Path to file with anonymous Apex.";

var SubCommand = module.exports = function(project) {
	Command.call(this, doc, project);
};

SubCommand.prototype = Object.create(Command.prototype);
SubCommand.prototype.constructor = SubCommand;

SubCommand.prototype.complete = function(tabtab, data) {
	// TODO: allow glob completion
	return tabtab.log(['--file'], data, '');
};

SubCommand.prototype.process = function(proc, callback) {
	var self = this;
	self.opts = self.opts ? self.opts : self.docopt();
	self.inFile = self.opts['--file'] ? path.resolve(self.opts['--file']) : null;

	var inputStream;
	if (self.inFile) {
		// 1. read from file
		inputStream = fs.createReadStream(self.inFile);
	} else {
		// 2. try to read from stdin
		inputStream = proc.stdin;
		inputStream.setEncoding('utf8');
	}

	var remote;
	try {
		remote = self.project.remotes.get(self.opts['<remote>']);
	} catch (err) {
		return callback(err);
	}

	var chunks = [];
	inputStream.on("data", function(chunk) {
		chunks.push(chunk);
	});
	inputStream.on("end", function() {
		var apexBody = chunks.join("");
		remote.connect(function(loginErr, conn) {
			if (loginErr) {
				return callback('Login failed for remote ' + remote.name + ': ' + loginErr);
			}
			conn.tooling.executeAnonymous(apexBody, function(executeErr, res) {
				if (executeErr) {
					return callback(executeErr);
				}
				if (!res.compiled) {
					return callback(new Error("Compile Error: " + res.compileProblem));
				}
				if (!res.success) {
					return callback(new Error("Execute Error: " + res.exceptionMessage + "\n" + res.exceptionStackTrace));
				}
				return callback(null, "Executed successfully");
			});
		});
	});
};
