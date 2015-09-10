"use strict";

var Command = require('./command');

var Remote = require('../remotes/remote');

var doc = "Usage:\n" +
"	force-dev-tool remote [-v] [--json]\n" +
"	force-dev-tool remote add <name> <username> <password> [-u <url>] [--default]\n" +
"	force-dev-tool remote default [<name>]\n" +
"	force-dev-tool remote set-pw [<name>] <password>\n" +
"	force-dev-tool remote remove <name>";

var SubCommand = module.exports = function(project) {
	Command.call(this, doc, project);
};

SubCommand.prototype = Object.create(Command.prototype);
SubCommand.prototype.constructor = SubCommand;

SubCommand.prototype.complete = function(tabtab, data) {
	return tabtab.log(['--json', '-v', 'add', 'default', 'set-pw', 'remove'], data);
};

SubCommand.prototype.process = function(callback) {
	var self = this;
	self.opts = self.docopt();
	if (!self.opts.add && !self.opts.remove && !self.opts.default && !self.opts['set-pw']) {
		self.list(callback);
	}
	else if (self.opts.add && self.opts['<name>']) {
		var opts = {};
		if (self.opts['<url>']) {
			opts.serverUrl = self.opts['<url>'];
		}
		if (self.opts['--default']) {
			opts.default = self.opts['--default'];
		}
		var remote = new Remote(self.opts['<name>'], self.opts['<username>'], self.opts['<password>'], opts);
		self.project.remotes.add(remote, callback);
	}
	else if (self.opts.remove && self.opts['<name>']) {
		self.project.remotes.remove(self.opts['<name>'], callback);
	}
	else if (self.opts.default) {
		if (self.opts['<name>'])
		{
			self.project.remotes.setDefault(self.opts['<name>'], callback);
		}
		else {
			console.log(JSON.stringify(self.project.determineRemote()));
			callback();
		}
	}
	else if (self.opts['set-pw']) {
		var existingRemote = self.project.determineRemote(self.opts['<name>']);
		existingRemote.password = self.opts['<password>'];
		self.project.remotes.add(existingRemote, callback);
	}
	else {
		callback('invalid command');
	}
};

SubCommand.prototype.list = function(callback) {
	var self = this;
	var remotes = self.project.remotes.list();
	if (self.opts['--json']) {
		console.log(JSON.stringify(remotes));
	}
	else {
		if (self.opts['-v']) {
			remotes.forEach(function(remote){
				console.log(remote.name + (remote.default ? ' (default)' : '') + ': ' + [remote.username, remote.password, remote.serverUrl].join(' '));
			});
		}
		else {
			remotes.forEach(function(remote){
				console.log(remote.name + (remote.default ? ' (default)' : ''));
			});
		}
	}
	callback();
};
