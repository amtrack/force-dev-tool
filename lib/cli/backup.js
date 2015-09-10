"use strict";

var Command = require('./command');
var child = require('child_process');
var async = require('async');
var chalk = require('chalk');

var doc = "Usage:\n" +
"	force-dev-tool backup [options] [<remote>]\n" +
"\n" +
"Options:\n" +
"	-a, --all    Backup all remotes.";

var SubCommand = module.exports = function(project) {
	var self = this;
	Command.call(self, doc, project);
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
		remotes = [self.project.determineRemote(self.opts['<remote>'])];
	}
	async.eachSeries(remotes, function(remote, remoteCallback) {
		var remoteName = remote.name;
		var branch = 'org/' + remoteName;
		console.log("backing up remote " + chalk.cyan(remoteName) + " to branch " + chalk.cyan(branch));
		var result;
		var localBranchExists = child.spawnSync('git', ['rev-parse', '--verify', branch]).status === 0;
		var remoteBranchExists = child.spawnSync('git', ['rev-parse', '--verify', 'origin/' + branch]).status === 0;
		if (localBranchExists) {
			console.log("checking out local branch " + branch);
			result = child.spawnSync('git', ['checkout', branch]).status === 0;
			if (result) {
				result = child.spawnSync('git', ['reset', '--hard', 'origin/' + branch]).status === 0;
				result = child.spawnSync('git', ['clean', '-f']).status === 0;
			}
		}
		else if (remoteBranchExists) {
			console.log("checking out remote branch " + chalk.cyan(branch));
			result = child.spawnSync('git', ['checkout', '-b', branch, 'origin/' + branch]).status === 0;
		}
		else {
			console.log("creating new branch " + chalk.cyan(branch));
			result = child.spawnSync('git', ['checkout', 'master']).status === 0;
			result = child.spawnSync('git', ['checkout', '--orphan', branch]).status === 0;
		}
		async.series([
			function(callback2){
				console.log('creating a complete package.xml');
				var c = child.spawn('force-dev-tool', ['package', '-a', remoteName]);
				var stdout = [];
				c.stdout.on('data', function(data){
					stdout = [].concat(stdout, data);
				});
				var stderr = [];
				c.stderr.on('data', function(data){
					stderr = [].concat(stderr, data);
				});
				c.on('close', function(code){
					if (code === 0) {
						callback2(null, stdout.join("\n"));
					}
					else {
						callback2([].concat(stdout, stderr).join("\n"));
					}
				});
			},
			function(callback3){
				console.log('retrieving metadata from remote ' + chalk.cyan(remoteName));
				var c = child.spawn('force-dev-tool', ['retrieve', remoteName]);
				var stdout = [];
				c.stdout.on('data', function(data){
					stdout = [].concat(stdout, data);
				});
				var stderr = [];
				c.stderr.on('data', function(data){
					stderr = [].concat(stderr, data);
				});
				c.on('close', function(code){
					if (code === 0) {
						callback3(null, stdout.join("\n"));
					}
					else {
						callback3([].concat(stdout, stderr).join("\n"));
					}
				});
			},
			function(callback4){
				console.log('staging changes');
				var c = child.spawn('git', ['add', 'src']);
				var stdout = [];
				c.stdout.on('data', function(data){
					stdout = [].concat(stdout, data);
				});
				var stderr = [];
				c.stderr.on('data', function(data){
					stderr = [].concat(stderr, data);
				});
				c.on('close', function(code){
					if (code === 0) {
						callback4(null, stdout.join("\n"));
					}
					else {
						callback4([].concat(stdout, stderr).join("\n"));
					}
				});
			},
			function(callback5){
				var gitDiff = child.spawn('git', ['diff', '--cached', '--quiet']);
				gitDiff.on('close', function(code){
					if (code === 0) {
						console.log('nothing to commit');
						callback5(null, 'nothing to commit');
					}
					else {
						console.log('commiting');
						var gitCommit = child.spawn('git', ['commit', '-m', 'backup of ' + remoteName]);
						var stdout = [];
						gitCommit.stdout.on('data', function(data){
							stdout = [].concat(stdout, data);
						});
						var stderr = [];
						gitCommit.stderr.on('data', function(data){
							stderr = [].concat(stderr, data);
						});
						gitCommit.on('close', function(gitCommitReturnCode){
							if (gitCommitReturnCode === 0) {
								callback5(null, stdout.join("\n"));
							}
							else {
								callback5([].concat(stdout, stderr).join("\n"));
							}
						});
					}
				});
			}
		], function(err, results){
			remoteCallback(err, results);
		});
	}, callback);
};
