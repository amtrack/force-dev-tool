"use strict";

var Command = require('./command');
var fs = require('fs');
var path = require('path');
var async = require('async');
var chalk = require('chalk');

var doc = "Usage:\n" +
"	force-dev-tool fetch [options] [<remote>]\n" +
"\n" +
"Options:\n" +
"	-a, --all    Fetch all remotes.";

var SubCommand = module.exports = function(project) {
	Command.call(this, doc, project);
};

SubCommand.prototype = Object.create(Command.prototype);
SubCommand.prototype.constructor = SubCommand;

SubCommand.prototype.complete = function(tabtab, data) {
	return tabtab.log(['-a', '--all', 'REMOTENAME'], data, '');
};

SubCommand.prototype.process = function(callback) {
	var self = this;
	self.opts = self.docopt();
	var remotes = [];
	if (self.opts['-a'] || self.opts['--all']) {
		remotes = self.project.remotes.list();
	}
	else {
		try {
			remotes = [self.project.determineRemote(self.opts['<remote>'])];
		}
		catch (err) {
			return callback(err);
		}
	}
	async.eachSeries(remotes, function(client, remoteCallback) {
		var remoteName = client.name;
		console.log('Fetching from remote ' + chalk.cyan(remoteName));
		var prefix = '[' + remoteName + ']: ';
		client.fetch(function(err, result){
			if (err) {
				remoteCallback(prefix + err);
			}
			var manifestDir = path.dirname(self.project.getManifestPath(remoteName));
			if (!fs.existsSync(manifestDir)){
				fs.mkdirSync(manifestDir);
			}
			if (result.warnings && result.warnings.length > 0) {
				console.log(chalk.yellow(result.warnings.join('\n')));
			}
			if (result.describeMetadataResult) {
				var describeMetadataResultPath = self.project.getConfigPath(remoteName) + '-describe-metadata-result.json';
				fs.writeFileSync(describeMetadataResultPath, JSON.stringify(result.describeMetadataResult));
				console.log("Created " + chalk.cyan(path.relative(process.cwd(), describeMetadataResultPath)));
			}
			if (result.toolingObjects) {
				var describeToolingObjectsResultPath = self.project.getConfigPath(remoteName) + '-describe-tooling-objects-result.json';
				fs.writeFileSync(describeToolingObjectsResultPath, JSON.stringify(result.toolingObjects));
				console.log("Created " + chalk.cyan(path.relative(process.cwd(), describeToolingObjectsResultPath)));
			}
			if (result.manifest) {
				var manifestPath = self.project.getManifestPath(remoteName);
				fs.writeFile(manifestPath, JSON.stringify(result.manifest), function(writeErr) {
					if (writeErr) {
						remoteCallback(prefix + writeErr);
					}
					console.log("Created " + chalk.cyan(path.relative(process.cwd(), manifestPath)));
					remoteCallback(null);
				});
			}
			else {
				remoteCallback(prefix + "Fetching failed.");
			}
		});
	}, function(err) {
		if (err) {
			return callback(err);
		}
		callback(null, 'Fetching remotes finished.');
	});
};

