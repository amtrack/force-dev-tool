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
	"	--use-forceignore    Use .forceignore file.";

var SubCommand = module.exports = function(project) {
	Command.call(this, doc, project);
};

SubCommand.prototype = Object.create(Command.prototype);
SubCommand.prototype.constructor = SubCommand;

SubCommand.prototype.complete = function(tabtab, data) {
	return tabtab.log(['-a', '--all', '--use-forceignore', 'REMOTENAME'], data, '');
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
