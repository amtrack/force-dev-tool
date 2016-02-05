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

SubCommand.prototype.formatDetails = function(details) {
	var messages = [];
	if (details.componentFailures) {
		var componentFailures = details.componentFailures;
		if (!Array.isArray(componentFailures)) { componentFailures = [ componentFailures ]; }
		messages = messages.concat(componentFailures.map(function(f) {
			return ' - ' + f.problemType + ' on ' + f.fileName + ' : ' + f.problem;
		}));
	}
	if (details.runTestResult && details.runTestResult.failures) {
		var failures = details.runTestResult.failures;
		if (!Array.isArray(failures)) { failures = [ failures ]; }
		messages = messages.concat(failures.map(function(f) {
			return ' - ' + f.message + ', stackTrace: ' + f.stackTrace;
		}));
	}
	if (details.runTestResult && details.runTestResult.codeCoverageWarnings) {
		var warnings = details.runTestResult.codeCoverageWarnings;
		if (!Array.isArray(warnings)) { warnings = [ warnings ]; }
		messages = messages.concat(warnings.map(function(f) {
			return ' - ' + f.message;
		}));
	}
	return messages.join("\n");
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
			return callback(loginErr);
		}
		client.conn.metadata.pollTimeout = config.pollTimeout;
		client.conn.metadata.deploy(self.archive, self.deployOpts).complete({details: true}, function(err, res) {
			if (err) {
				return callback(err);
			}
			var messages = []
			if (res.status === 'Failed') {
				messages.push(self.action + ' failed.');
				if (res.details) {
					messages.push(self.formatDetails(res.details));
				}
			}
			if (res.id) {
				messages.push('Visit ' + client.conn.instanceUrl + '/changemgmt/monitorDeploymentsDetails.apexp?asyncId=' + res.id + ' for more information.');
			}
			if (res.status === 'Failed') {
				return callback(messages.join("\n"));
			}
			return callback(null, messages.join("\n"));
		});
	});
};
