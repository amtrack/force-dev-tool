"use strict";

var Command = require('./command');
var config = new (require('../config'))();
var MetadataUtils = require('force-metadata-utils');
var CliUtils = require('./utils');
var yauzl = require("yauzl");
var mkdirp = require("mkdirp");
var path = require('path');
var fs = require('fs-extra');
var _ = require('underscore');
var chalk = require('chalk');

var doc = "Usage:\n" +
"	force-dev-tool retrieve [options] [<remote>]\n" +
"\n" +
"Options:\n" +
"	-d=<directory>    Directory containing the metadata and package.xml [default: ./src].\n" +
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

SubCommand.prototype.process = function(callback) {
	var self = this;
	self.opts = self.docopt();
	var retrieveRoot = path.resolve(self.opts['-d']);
	var client = self.project.determineRemote(self.opts['<remote>']);
	var keepZip = self.opts['--keep-zip'];
	var showProgress = self.opts['--progress'];
	var zipFileName = "unpackaged.zip";
	console.log('Retrieving from remote ' + chalk.cyan(client.name) + ' to directory ' + chalk.cyan(path.relative(process.cwd(), retrieveRoot)));
	var localPackageXml = MetadataUtils.Manifest.fromPackageXml(CliUtils.readPackageXml(path.join(retrieveRoot, 'package.xml')));
	client.login(function(loginErr) {
		if (loginErr) {
			callback(loginErr);
		}
		client.conn.metadata.pollTimeout = config.pollTimeout;
		var r = client.conn.metadata.retrieve({unpackaged: localPackageXml.getJSON()});
		if (showProgress) {
			var polls = 1;
			r.on('progress', function(progressResult){
				console.log('poll ' + (polls++) + ' ' + JSON.stringify({id: progressResult.id}));
			});
		}
		r.complete(function(retrieveErr, result){
			if (retrieveErr) {
				callback(retrieveErr);
			}
			var messages = _.compact([].concat(result.errorMessage, result.messages));
			if (messages.length) {
				console.log(chalk.grey(
					_.flatten(messages).map(function(message){
						return JSON.stringify(message);
					}).join("\n")
				));
			}
			if (!result.zipFile) {
				callback('Missing zipFile in result!');
			}
			fs.writeFile(zipFileName, result.zipFile, {encoding: 'base64'}, function(writeErr) {
				if (writeErr) {
					callback(writeErr);
				}
				yauzl.open(zipFileName, function(openErr, zipfile) {
					if (openErr) {
						callback(openErr);
					}
					zipfile.on("entry", function(entry) {
						zipfile.openReadStream(entry, function(unzipErr, readStream) {
							if (unzipErr) {
								callback(unzipErr);
							}
							if (/\/$/.test(entry.fileName)) {
								// directory file names end with '/'
								return;
							}
							var outputDir = path.dirname(entry.fileName);
							mkdirp(outputDir, function(mkdirErr){
								if (mkdirErr) {
									callback(mkdirErr);
								}
								readStream.pipe(fs.createWriteStream(entry.fileName));
							});
						});
					});
					zipfile.once("close", function() {
						fs.move(path.resolve('unpackaged'), retrieveRoot, {clobber: true}, function(mvErr) {
							if (mvErr) {
								callback(mvErr);
							}
							if (keepZip) {
								// finished
								callback(null, result.status);
							}
							// remove unpackaged.zip
							fs.unlink(zipFileName, function(unlinkErr) {
								if (unlinkErr) {
									callback(unlinkErr);
								}
								callback(null, result.status);
							});
						});
					});
				});
			});
		});
	});
};
