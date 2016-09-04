"use strict";

var Command = require('./command');
var config = new(require('../config'))();
var Manifest = require('../manifest');
var CliUtils = require('./utils');
var Unzip = require("../unzip");
var path = require('path');
var fs = require('fs-extra');
var _ = require('underscore');
var chalk = require('chalk');

var doc = "Usage:\n" +
	"	force-dev-tool retrieve [options] [<remote>]\n" +
	"\n" +
	"Options:\n" +
	"	-d=<directory>    Target directory and usually path containing package.xml (unless --template is set).\n" +
	"	--template=<template>  Path to template package.xml.\n" +
	"	--progress    Show progress\n" +
	"	--keep-zip    Don't remove unpackaged.zip after it has been unzipped";


var SubCommand = module.exports = function(project) {
	Command.call(this, doc, project);
};

SubCommand.prototype = Object.create(Command.prototype);
SubCommand.prototype.constructor = SubCommand;

SubCommand.prototype.complete = function(tabtab, data) {
	return tabtab.log(['--keep-zip', '--progress', 'REMOTENAME'], data);
};

SubCommand.prototype.process = function(proc, callback) {
	var self = this;
	self.opts = self.docopt();
	var targetDirectory = self.opts['-d'] ? path.resolve(self.opts['-d']) : self.project.storage.getSrcPath();
	var templatePackageXmlPath = self.opts['--template'] ? path.resolve(self.opts['--template']) : path.join(targetDirectory, 'package.xml');
	var currentPackageXml = Manifest.fromPackageXml(CliUtils.readFileSafe(templatePackageXmlPath));
	config.set('defaultApiVersion', currentPackageXml.apiVersion);
	var remote;
	try {
		remote = self.project.remotes.get(self.opts['<remote>']);
	} catch (err) {
		return callback(err);
	}
	var keepZip = self.opts['--keep-zip'];
	var showProgress = self.opts['--progress'];
	var zipFileName = "unpackaged.zip";
	console.log('Retrieving from remote ' + chalk.cyan(remote.name) + ' to directory ' + chalk.cyan(path.normalize(path.relative(proc.cwd, targetDirectory))));
	remote.connect(function(loginErr, conn) {
		if (loginErr) {
			return callback(loginErr);
		}
		conn.metadata.pollTimeout = config.pollTimeout;
		var r = conn.metadata.retrieve({
			unpackaged: currentPackageXml.getJSON(),
			apiVersion: currentPackageXml.apiVersion
		});
		if (showProgress) {
			var polls = 1;
			r.on('progress', function(progressResult) {
				console.log('poll ' + (polls++) + ' ' + JSON.stringify({
					id: progressResult.id
				}));
			});
		}
		r.complete(function(retrieveErr, result) {
			if (retrieveErr) {
				return callback(retrieveErr);
			}
			var messages = _.compact([].concat(result.errorMessage, result.messages));
			if (messages.length) {
				console.log(chalk.grey(
					_.flatten(messages).map(function(message) {
						return JSON.stringify(message);
					}).join("\n")
				));
			}
			if (!result.zipFile) {
				return callback('Missing zipFile in result!');
			}
			fs.writeFile(zipFileName, result.zipFile, {
				encoding: 'base64'
			}, function(writeErr) {
				if (writeErr) {
					return callback(writeErr);
				}
				new Unzip(zipFileName).target(targetDirectory, function(err) {
					if (err) {
						return callback(err);
					}
					if (keepZip) {
						// finished
						return callback(null, result.status);
					}
					// remove unpackaged.zip
					fs.unlink(zipFileName, function(unlinkErr) {
						if (unlinkErr) {
							return callback(unlinkErr);
						}
						return callback(null, result.status);
					});
				});
			});
		});
	});
};
