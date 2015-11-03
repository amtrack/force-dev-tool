"use strict";

var Command = require('./command');
var config = new (require('../config'))();
var path = require('path');
var archiver = require('archiver');
var chalk = require('chalk');

var doc = "Usage:\n" +
"	force-dev-tool deploy [options] [<remote>]\n" +
"\n" +
"Options:\n" +
"	-d=<directory>    Directory containing the metadata and package.xml [default: ./src].";

var SubCommand = module.exports = function(project, subcommandDoc) {
	var self = this;
	Command.call(self, subcommandDoc ? subcommandDoc : doc, project);
	self.action = "Deployment";
	self.archive = null;
	archiver.create('zip', {});
	self.deployOpts = {rollbackOnError: true};
	// TODO: make purgeOnDelete configurable
};

SubCommand.prototype = Object.create(Command.prototype);
SubCommand.prototype.constructor = SubCommand;

SubCommand.prototype.complete = function(tabtab, data) {
	// TODO: allow glob completion
	return tabtab.log(['-d', 'REMOTENAME'], data, '');
};

SubCommand.prototype.getComponentFailures = function(details) {
	var failures = details.componentFailures;
	if (!failures) { return ""; }
	if (!failures.length) { failures = [ failures ]; }
	var result = "";
	failures.forEach(function(f) {
		result += ' - ' + f.problemType + ' on ' + f.fileName + ' : ' + f.problem + "\n";
	});
	return result;
};

SubCommand.prototype.getRunTestResult = function(details) {
	var failures = details.runTestResult.failures;
	if (!failures) { return ""; }
	if (!failures.length) { failures = [ failures ]; }
	var result = "";
	failures.forEach(function(f) {
		result += ' - ' + f.message + ', stackTrace: ' + f.stackTrace + "\n";
	});
	return result;
};

SubCommand.prototype.process = function(callback) {
	var self = this;
	self.opts = self.opts ? self.opts : self.docopt();
	var client = self.project.determineRemote(self.opts['<remote>']);
	self.archive = archiver('zip', {});
	if (self.opts['-d']) {
		var deployRoot = path.resolve(self.opts['-d']);
		self.archive.directory(deployRoot, path.basename(deployRoot));
	}
	self.archive.finalize();
	console.log('Running ' + chalk.cyan(self.action) + ' to remote ' + chalk.cyan(client.name));
	client.login(function(loginErr) {
		if (loginErr) {
			callback(loginErr);
		}
		client.conn.metadata.pollTimeout = config.pollTimeout;
		client.conn.metadata.deploy(self.archive, self.deployOpts).complete({details: true}, function(err, res) {
			if (err) {
				callback(err);
			}
			if (res.status === 'Failed') {
				var errorMessage = self.action + ' failed';
				if (res.details) {
					if (res.details.componentFailures) {
						errorMessage = self.action + ' failed.\n' + self.getComponentFailures(res.details);
					}
					else if (res.details.runTestResult) {
						errorMessage = self.action + ' failed.\n' + self.getRunTestResult(res.details);
					}
				}
				if (res.id) {
					errorMessage += '\nVisit ' + client.conn.instanceUrl + '/changemgmt/monitorDeploymentsDetails.apexp?asyncId=' + res.id + ' for more information.';
				}
				callback(errorMessage);
			}
			else {
				var message = self.action + ' succeeded.';
				if (res.id) {
					message += '\nVisit ' + client.conn.instanceUrl + '/changemgmt/monitorDeploymentsDetails.apexp?asyncId=' + res.id + ' for more information.';
				}
				callback(null, message);
			}
		});
	});
};
