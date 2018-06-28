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
	"	-d=<directory>                 Target directory and usually path containing package.xml (unless --template is set).\n" +
	"	--template=<template>          Path to template package.xml.\n" +
	"	--packageNames=<packageNames>  The package names to be retrieved (one argument, separated by newlines).\n" +
	"	--apiVersion=<apiVersion>      The apiVersion to be used in the retrieve request.\n" +
	"	--progress                     Show progress\n" +
	"	--keep-zip                     Don't remove unpackaged.zip after it has been unzipped";

// example:
// echo -e "foo\nbar baz\nbazn" | xargs -0 force-dev-tool retrieve -d config/deployments/packages --packageNames

var SubCommand = module.exports = function(project) {
	Command.call(this, doc, project);
};

SubCommand.prototype = Object.create(Command.prototype);
SubCommand.prototype.constructor = SubCommand;

SubCommand.prototype.process = function(proc, callback) {
	var self = this;
	self.opts = self.docopt();
	var targetDirectory = self.opts['-d'] ? path.resolve(self.opts['-d']) : self.project.storage.getSrcPath();
	var templatePackageXmlPath = self.opts['--template'] ? path.resolve(self.opts['--template']) : path.join(targetDirectory, 'package.xml');
	var packageNames = self.opts['--packageNames'] ? self.opts['--packageNames'].split(/\n+/g) : [];
	// trim each item and remove empty items
	packageNames = packageNames.map(function(item) {
		return item.trim();
	}).filter(Boolean);

	var projectPackageXml;
	try {
		projectPackageXml = Manifest.fromPackageXml(CliUtils.readFileSafe(self.project.storage.getPackageXmlPath()));
	} catch (err) {
		// ignore since a package.xml doesn't have to exist for the project
	}
	var deploymentPackageXml;
	if (!packageNames || !packageNames.length) {
		deploymentPackageXml = Manifest.fromPackageXml(CliUtils.readFileSafe(templatePackageXmlPath));
	}
	var apiVersion = (deploymentPackageXml ? deploymentPackageXml.apiVersion : null) || self.opts['--apiVersion'] || (projectPackageXml ? projectPackageXml.apiVersion : null) || config.get('defaultApiVersion');
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
		var retrieveRequest = {
			apiVersion: apiVersion
		};
		if (packageNames && packageNames.length) {
			retrieveRequest['packageNames'] = packageNames;
		} else {
			retrieveRequest['unpackaged'] = deploymentPackageXml.getJSON();
			retrieveRequest['singlePackage'] = true;
		}
		var r = conn.metadata.retrieve(retrieveRequest);
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
					// TODO: finally
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
