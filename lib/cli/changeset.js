"use strict";

var Command = require('./command');
var config = new (require('../config'))();
var CliUtils = require('../cli/utils');
var utils = require('../utils');
var fdt = require('../');
var MetadataUtils = require('force-metadata-utils');
var MetadataContainer = MetadataUtils.MetadataContainer;
var MetadataComponent = MetadataUtils.MetadataComponent;
var MetadataFile = MetadataUtils.MetadataFile;
var Manifest = MetadataUtils.Manifest;
var path = require('path');
var fs = require('fs-extra');
var vinylFs = require('vinyl-fs');
var chalk = require('chalk');

var doc = "Usage:\n" +
"	force-dev-tool changeset create <name> [<metadataFileOrComponentNames>...] [options]\n" +
"\n" +
"Options:\n" +
"	--package=<package>    Path to package.xml [default: src/package.xml].\n" +
"	--apiVersion=<apiVersion>    API version. Defaulted to API version of project.\n" +
"	--dry-run              Only print what would be done.\n" +
"	--destructive          Creates a destructive changeset.\n" +
"	-f --force             Overwrites the target directory if it exists already.";

var SubCommand = module.exports = function() {
	var self = this;
	Command.call(self, doc);
};

SubCommand.prototype = Object.create(Command.prototype);
SubCommand.prototype.constructor = SubCommand;

SubCommand.prototype.complete = function(tabtab, data) {
	// TODO: allow glob completion
	return tabtab.log(['create', '--destructive', '-f', '--force'], data, '');
};

SubCommand.prototype.process = function(callback) {
	var self = this;
	self.opts = self.docopt();
	self.name = self.opts['<name>'] || 'foo';
	self.packagePath = path.resolve(self.opts['--package']);
	self.currentPackageXml = Manifest.fromPackageXml(CliUtils.readFileSafe(self.packagePath));
	var apiVersion = self.opts['--apiVersion'] || self.currentPackageXml.apiVersion || config.get('defaultApiVersion');
	var input = "";
	// check whether deployment path exists already
	var deploymentPath = path.resolve(path.join('config', 'deployments', self.name));
	var force = self.opts['--force'] || false;
	if (fs.existsSync(deploymentPath)) {
		if (force) {
			fs.removeSync(deploymentPath);
		} else {
			return callback("Deployment directory already exists: " + deploymentPath);
		}
	}
	process.stdin.setEncoding('utf8');
	process.stdin.on('readable', function() {
		var read = process.stdin.read();
		if (read === null) {
			process.stdin.end();
		}
		else {
			console.error('readable not null');
		}
	});
	process.stdin.on('data', function(data) {
		input += data;
	});
	process.stdin.on('close', function() {
		var metadataContainer = new MetadataContainer();
		// 1. get metadataContainer with changes based on unified diff
		try {
			var result = new fdt.Diff(input).getMetadataContainers();
			metadataContainer = result.source.diff(result.target);
		}
		catch (e) {
			if (e.message !== "Unexpected end of input") {
				console.error(e);
			}
			else {
				throw e;
			}
		}
		// 2. process cli input
		self.opts['<metadataFileOrComponentNames>'].forEach(function(componentOrFileName) {
			var component;
			if (fs.existsSync(componentOrFileName)) {
				component = new MetadataFile({path: utils.getRelativePathToUnpackaged(componentOrFileName)}).getComponent();
			}
			else {
				component = new MetadataComponent(componentOrFileName);
			}
			if (component) {
				if (self.opts['--destructive']) {
					metadataContainer.destructiveManifest.add(component);
				}
				else {
					metadataContainer.manifest.add(component);
				}
			}
			else {
				console.error('could not determine component for: `' + componentOrFileName + '`');
			}
		});
		// 3. attach missing files and filter
		metadataContainer.manifest.apiVersion = apiVersion;
		metadataContainer = metadataContainer
			.completeMetadataWith({path: path.join(process.cwd(), 'src')})
			.filter(metadataContainer.manifest);
		if (!metadataContainer.vinyls.length && !metadataContainer.destructiveManifest.manifest().length) {
			return callback('Could not determine changed metadata!');
		}
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
			callback(null, 'exported metadata container to ' + path.relative(process.cwd(), deploymentPath));
		});
		s.on('error', callback);
	});
	process.stdin.on('end', function() {
		// console.error('end');
	});
	process.stdin.resume();
};
