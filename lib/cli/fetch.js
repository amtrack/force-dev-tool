"use strict";

var Command = require('./command');
var fs = require('fs');
var path = require('path');
var async = require('async');
var chalk = require('chalk');
var Manifest = require('../manifest');
var CliUtils = require('./utils');
var config = new(require('../config'))();
var DescribeRemote = require('../describe-remote');

var doc = "Usage:\n" +
	"	force-dev-tool fetch [options] [<remote>]\n" +
	"\n" +
	"Options:\n" +
	"	-a, --all            Fetch all remotes.\n" +
	"	--progress           Show progress.\n" +
	"	--api-versions-only  Only fetch API versions.\n" +
	"	--read=<metadataTypes>   Read metadata for given metadata types (one argument, separated by space).\n" +
	"	--use-forceignore    Use .forceignore file.";

var SubCommand = module.exports = function(project) {
	Command.call(this, doc, project);
};

SubCommand.prototype = Object.create(Command.prototype);
SubCommand.prototype.constructor = SubCommand;

SubCommand.prototype.complete = function(tabtab, data) {
	return tabtab.log(['-a', '--all', '--use-forceignore', '--progress', '--api-versions-only', '--read', 'REMOTENAME'], data, '');
};

SubCommand.prototype.process = function(proc, callback) {
	var self = this;
	self.opts = self.docopt();
	var templatePath = self.project.storage.getPackageXmlPath();
	var currentPackageXml = new Manifest();
	try {
		currentPackageXml = Manifest.fromPackageXml(CliUtils.readFileSafe(templatePath));
		config.set('defaultApiVersion', currentPackageXml.apiVersion);
	} catch (err) {
		// ignore since package.xml does not have to exist yet
	}
	var remotes = [];
	if (self.opts['-a'] || self.opts['--all']) {
		remotes = self.project.remotes.list();
	} else {
		try {
			remotes = [self.project.remotes.get(self.opts['<remote>'])];
		} catch (err) {
			return callback(err);
		}
	}
	var describeRemoteOpts = {};
	if (self.opts['--use-forceignore']) {
		describeRemoteOpts.ignorePatterns = CliUtils.readForceIgnore(self.project.storage.getForceIgnorePath());
	}
	if (self.opts['--api-versions-only']) {
		describeRemoteOpts.apiVersions = true;
		describeRemoteOpts.describeMetadataResult = false;
		describeRemoteOpts.fileProperties = false;
		describeRemoteOpts.personAccountRecordTypes = false;
		describeRemoteOpts.flowDefinitions = false;
		describeRemoteOpts.standardPicklists = false;
	}
	describeRemoteOpts.progress = !!self.opts['--progress'];
	if (self.opts['--read']) {
		describeRemoteOpts.readMetadataTypes = self.opts['--read'].split(' ');
	}
	async.eachSeries(remotes, function(remote, remoteCallback) {
		var remoteName = remote.name;
		console.log('Fetching from remote ' + chalk.cyan(remoteName));
		var prefix = '[' + remoteName + ']: ';
		remote.connect(function(loginErr, conn) {
			if (loginErr) {
				return remoteCallback(prefix + loginErr);
			}
			new DescribeRemote(conn, describeRemoteOpts).fetch(function(err, result) {
				if (err) {
					return remoteCallback(prefix + err);
				}
				if (result) {
					var storagePath = self.project.storage.getConfigPath()
					if (!fs.existsSync(storagePath)) {
						fs.mkdirSync(storagePath);
					}
					var fetchResultPath = self.project.getFetchResultPath(remoteName);
					fs.writeFileSync(fetchResultPath, JSON.stringify(result, null, ' '));
					if (result.warnings && result.warnings.length > 0) {
						console.log(chalk.yellow(result.warnings.join('\n')));
					}
					console.log("Created " + chalk.cyan(path.relative(proc.cwd, fetchResultPath)));
					return remoteCallback(null);
				} else {
					return remoteCallback(prefix + "Fetching failed.");
				}
			});
		});
	}, function(err) {
		if (err) {
			return callback(err);
		}
		callback(null, 'Fetching remotes finished.');
	});
};
