"use strict";

var Command = require('./command');
var config = new(require('../config'))();
var CliUtils = require('../cli/utils');
var utils = require('../utils');
var Diff = require('../diff');
var MetadataContainer = require('../metadata-container');
var MetadataComponent = require('../metadata-component');
var MetadataFile = require('../metadata-file');
var Manifest = require('../manifest');
var path = require('path');
var fs = require('fs-extra');
var vinylFs = require('vinyl-fs');
var chalk = require('chalk');

var doc = "Usage:\n" +
	"	force-dev-tool changeset create <name> [<metadataFileOrComponentNames>...] [options]\n" +
	"\n" +
	"Options:\n" +
	"	--apiVersion=<apiVersion>    API version. Defaulted to API version of project.\n" +
	"	-d=<directory>               Path to target directory.\n" +
	"	--dry-run              Only print what would be done.\n" +
	"	--destructive          Creates a destructive changeset.\n" +
	"	-f --force             Overwrites the target directory if it exists already.";

var SubCommand = module.exports = function(project) {
	var self = this;
	Command.call(self, doc, project);
};

SubCommand.prototype = Object.create(Command.prototype);
SubCommand.prototype.constructor = SubCommand;

SubCommand.prototype.complete = function(tabtab, data) {
	// TODO: allow glob completion
	return tabtab.log(['create', '-d', '--destructive', '-f', '--force'], data, '');
};

SubCommand.prototype.process = function(proc, callback) {
	var self = this;
	self.opts = self.docopt();
	self.name = self.opts['<name>'] || 'foo';
	var targetBaseDirectory = self.opts['-d'] ? path.resolve(self.opts['-d']) : path.join(self.project.storage.getConfigPath(), 'deployments');
	self.currentPackageXml = Manifest.fromPackageXml(CliUtils.readFileSafe(self.project.storage.getPackageXmlPath()));
	var apiVersion = self.opts['--apiVersion'] || self.currentPackageXml.apiVersion || config.get('defaultApiVersion');
	var input = "";
	// check whether deployment path exists already
	var deploymentPath = path.resolve(path.join(targetBaseDirectory, self.name));
	var force = self.opts['--force'] || false;
	if (fs.existsSync(deploymentPath)) {
		if (force) {
			fs.removeSync(deploymentPath);
		} else {
			return callback("Deployment directory already exists: " + deploymentPath);
		}
	}
	proc.stdin.setEncoding('utf8');
	proc.stdin.on('readable', function() {
		var read = proc.stdin.read();
		if (read === null) {
			proc.stdin.end();
		} else {
			console.error('readable not null');
		}
	});
	proc.stdin.on('data', function(data) {
		input += data;
	});
	proc.stdin.on('close', function() {
		var metadataContainer = new MetadataContainer();
		// 1. get metadataContainer with changes based on unified diff
		try {
			var result = new Diff(input).getMetadataContainers();
			metadataContainer = result.source.diff(result.target);
		} catch (e) {
			if (e.message !== "Unexpected end of input") {
				console.error(e);
			} else {
				throw e;
			}
		}
		// 2. process cli input
		self.opts['<metadataFileOrComponentNames>'].forEach(function(componentOrFileName) {
			var component;
			if (fs.existsSync(componentOrFileName)) {
				component = new MetadataFile({
					path: utils.getRelativePathToUnpackaged(componentOrFileName)
				}).getComponent();
			} else {
				component = new MetadataComponent(componentOrFileName);
			}
			if (component) {
				if (self.opts['--destructive']) {
					metadataContainer.destructiveManifest.add(component);
				} else {
					metadataContainer.manifest.add(component);
				}
			} else {
				console.error('could not determine component for: `' + componentOrFileName + '`');
			}
		});
		// 3. attach missing files and filter
		metadataContainer.manifest.apiVersion = apiVersion;
		metadataContainer = metadataContainer
			.completeMetadataWith({
				path: self.project.storage.getSrcPath()
			})
			.filter(metadataContainer.manifest);
		// debug
		if (metadataContainer.manifest) {
			console.log('Manifest:\n' + chalk.grey(metadataContainer.manifest.toPackageXml()));
		}
		if (metadataContainer.destructiveManifest && metadataContainer.destructiveManifest.manifest().length) {
			console.log('Destructive Manifest:\n' + chalk.grey(metadataContainer.destructiveManifest.toPackageXml(true)));
		}
		// 4. stream to destination
		var s = metadataContainer
			.attachManifestFiles()
			.stream();
		s.pipe(
			vinylFs.dest(deploymentPath)
		);
		s.on('end', function() {
			callback(null, 'exported metadata container to ' + path.relative(proc.cwd, deploymentPath));
		});
		s.on('error', callback);
	});
	proc.stdin.on('end', function() {
		// console.error('end');
	});
	proc.stdin.resume();
};
