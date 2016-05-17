"use strict";

var Command = require('./command');
var config = new(require('../config'))();
var Manifest = require('../manifest');
var CliUtils = require('./utils');
var path = require('path');
var archiver = require('archiver');
var chalk = require('chalk');

var doc = "Usage:\n" +
	"	force-dev-tool deploy [options] [<remote>]\n" +
	"\n" +
	"Options:\n" +
	"	-d=<directory>    Directory containing the metadata and package.xml.";

var SubCommand = module.exports = function(project, subcommandDoc) {
	var self = this;
	Command.call(self, subcommandDoc ? subcommandDoc : doc, project);
	self.action = "Deployment";
	self.archive = null;
	archiver.create('zip', {});
	self.deployOpts = {
		rollbackOnError: true
	};
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
		if (!Array.isArray(componentFailures)) {
			componentFailures = [componentFailures];
		}
		messages = messages.concat(componentFailures.map(function(f) {
			return ' - ' + f.problemType + ' on ' + f.fileName + ' : ' + f.problem;
		}));
	}
	if (details.runTestResult && details.runTestResult.failures) {
		var failures = details.runTestResult.failures;
		if (!Array.isArray(failures)) {
			failures = [failures];
		}
		messages = messages.concat(failures.map(function(f) {
			return ' - ' + f.message + ', stackTrace: ' + f.stackTrace;
		}));
	}
	if (details.runTestResult && details.runTestResult.codeCoverageWarnings) {
		var warnings = details.runTestResult.codeCoverageWarnings;
		if (!Array.isArray(warnings)) {
			warnings = [warnings];
		}
		messages = messages.concat(warnings.map(function(f) {
			return ' - ' + f.message;
		}));
	}
	return messages.join("\n");
};

SubCommand.prototype.process = function(proc, callback) {
	var self = this;
	self.opts = self.opts ? self.opts : self.docopt();
	var remote;
	try {
		remote = self.project.remotes.get(self.opts['<remote>']);
	} catch (err) {
		return callback(err);
	}
	self.archive = archiver('zip', {});
	var deployRoot = self.opts['-d'] ? path.resolve(self.opts['-d']) : self.project.storage.getSrcPath();
	var currentPackageXml = new Manifest();
	try {
		currentPackageXml = Manifest.fromPackageXml(CliUtils.readFileSafe(path.join(deployRoot, 'package.xml')));
		config.set('defaultApiVersion', currentPackageXml.apiVersion);
	} catch (err) {
		// ignore since running unit tests using an empty deployment does not require a package.xml
	}
	if (self.action === 'Test execution') {
		console.log('Running ' + chalk.cyan(self.action) + ' to remote ' + chalk.cyan(remote.name));
	} else {
		self.archive.directory(deployRoot, path.basename(deployRoot));
		console.log('Running ' + chalk.cyan(self.action) + ' of directory ' + chalk.cyan(path.relative(proc.cwd, deployRoot)) + ' to remote ' + chalk.cyan(remote.name));
	}
	self.archive.finalize();
	remote.connect(function(loginErr, conn) {
		if (loginErr) {
			return callback(loginErr);
		}
		conn.metadata.pollTimeout = config.pollTimeout;
		conn.metadata.deploy(self.archive, self.deployOpts).complete({
			details: true
		}, function(err, res) {
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
				messages.push('Visit ' + conn.instanceUrl + '/changemgmt/monitorDeploymentsDetails.apexp?asyncId=' + res.id + ' for more information.');
			}
			if (res.status === 'Failed') {
				return callback(messages.join("\n"));
			}
			return callback(null, messages.join("\n"));
		});
	});
};
