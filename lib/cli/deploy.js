"use strict";

var Command = require('./command');
var config = new(require('../config'))();
var Manifest = require('../manifest');
var CliUtils = require('./utils');
var path = require('path');
var Zip = require('../zip');
var chalk = require('chalk');
var fs = require('fs');

var doc = "Usage:\n" +
	"	force-dev-tool deploy [options] [<remote>]\n" +
	"\n" +
	"Options:\n" +
	"	-d=<directory>    Directory containing the metadata and package.xml.\n" +
	"	-f=<zipFile>      Zip file containing the metadata and package.xml.";

var SubCommand = module.exports = function(project, subcommandDoc) {
	var self = this;
	Command.call(self, subcommandDoc ? subcommandDoc : doc, project);
	self.action = "Deployment";
	self.deployOpts = {
		rollbackOnError: true
	};
	// TODO: make purgeOnDelete configurable
};

SubCommand.prototype = Object.create(Command.prototype);
SubCommand.prototype.constructor = SubCommand;

SubCommand.prototype.complete = function(tabtab, data) {
	// TODO: allow glob completion
	return tabtab.log(['-d', '-f', 'REMOTENAME'], data, '');
};

SubCommand.prototype.formatDetails = function(details) {
	var messages = [];
	if (details.componentFailures) {
		var componentFailures = details.componentFailures;
		if (!Array.isArray(componentFailures)) {
			componentFailures = [componentFailures];
		}
		messages = messages.concat(componentFailures.map(function(f) {
			if (f.fullName && f.componentType) {
				return ' - ' + f.problemType + " in " + f.componentType + " component '" + f.fullName + "': " + f.problem;
			} else {
				return ' - ' + f.problemType + " in file '" + f.fileName + "': " + f.problem;
			}
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
	var zipStream;
	if (self.opts['-f']) {
		var zipFilePath = path.resolve(self.opts['-f']);
		console.log('Running ' + chalk.cyan(self.action) + ' of zip file ' + chalk.cyan(path.relative(proc.cwd, zipFilePath)) + ' to remote ' + chalk.cyan(remote.name));
		zipStream = fs.createReadStream(zipFilePath);
	} else {
		var deployRoot = self.opts['-d'] ? path.resolve(self.opts['-d']) : self.project.storage.getSrcPath();
		var currentPackageXml = new Manifest();
		try {
			currentPackageXml = Manifest.fromPackageXml(CliUtils.readFileSafe(path.join(deployRoot, 'package.xml')));
			config.set('defaultApiVersion', currentPackageXml.apiVersion);
		} catch (err) {
			// ignore since running unit tests using an empty deployment does not require a package.xml
		}
		var zipFile = new Zip();
		if (self.action === 'Test execution') {
			console.log('Running ' + chalk.cyan(self.action) + ' to remote ' + chalk.cyan(remote.name));
		} else {
			zipFile.directory(deployRoot);
			console.log('Running ' + chalk.cyan(self.action) + ' of directory ' + chalk.cyan(path.relative(proc.cwd, deployRoot)) + ' to remote ' + chalk.cyan(remote.name));
		}
		zipStream = zipFile.stream();
	}
	remote.connect(function(loginErr, conn) {
		if (loginErr) {
			return callback(loginErr);
		}
		conn.metadata.pollTimeout = config.pollTimeout;
		conn.metadata.deploy(zipStream, self.deployOpts).complete({
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
