"use strict";

var Command = require('./command');
var config = new(require('../config'))();
var Manifest = require('../manifest');
var FetchResultParser = require('../fetch-result-parser');
var CliUtils = require('./utils');
var path = require("path");
var chalk = require('chalk');

var doc = "Usage:\n" +
	"	force-dev-tool package fmt [options]\n" +
	"	force-dev-tool package version [options] [<apiVersion>]\n" +
	"	force-dev-tool package [options] [<remote>] [<metadataComponentExpression>...]\n" +
	"\n" +
	"Options:\n" +
	"	-a, --all              Index all metadata types, otherwise only metadata types listed in package.xml\n" +
	"	--custom-only          Only index custom metadata components\n" +
	"	--template=<template>  Path to template package.xml.\n" +
	"	--target=<target>      Path to target package.xml.";

var SubCommand = module.exports = function(project) {
	Command.call(this, doc, project);
};

SubCommand.prototype = Object.create(Command.prototype);
SubCommand.prototype.constructor = SubCommand;

SubCommand.prototype.complete = function(tabtab, data) {
	return tabtab.log(['-a', '--all', '--custom-only', '--template', '--target', 'fmt', 'version', 'REMOTENAME'], data);
};

SubCommand.prototype.process = function(proc, callback) {
	var self = this;
	self.opts = self.docopt();
	// TODO: merge --template and --target to -f (--file)
	var templatePath = self.opts['--template'] ? path.resolve(self.opts['--template']) : self.project.storage.getPackageXmlPath();
	var targetPath = self.opts['--target'] ? path.resolve(self.opts['--target']) : self.project.storage.getPackageXmlPath();
	var packageXmlExists = true;
	try {
		self.currentPackageXml = Manifest.fromPackageXml(CliUtils.readFileSafe(templatePath));
	} catch (parseErr) {
		// ignore since the package.xml does not have to exist
		self.currentPackageXml = new Manifest();
		packageXmlExists = false;
	}
	if (self.opts.fmt) {
		if (!packageXmlExists) {
			return callback("Package `" + templatePath + "` does not exist");
		}
		return CliUtils.writePackageXml(self.currentPackageXml, targetPath, false, callback);
	}
	if (self.opts.version) {
		if (self.opts['<apiVersion>']) {
			self.currentPackageXml.apiVersion = self.opts['<apiVersion>'];
			return CliUtils.writePackageXml(self.currentPackageXml, targetPath, false, callback);
		} else {
			if (!packageXmlExists) {
				return callback("Package `" + templatePath + "` does not exist");
			}
			console.log(self.currentPackageXml.apiVersion);
			return callback(null);
		}
	}
	var fetchResult = new FetchResultParser(CliUtils.readJsonFile(self.project.getFetchResultPath(self.opts['<remote>'])));
	var manifest = new Manifest({
		manifestJSON: fetchResult.getComponents()
	});
	var warnings = fetchResult.getWarnings();
	if (warnings && warnings.length > 0) {
		console.log(chalk.yellow(warnings.join('\n')));
	}

	if (self.opts['<metadataComponentExpression>'].length > 0) {
		// regard only metadataComponentExpression matches
		manifest.getMatches(self.opts['<metadataComponentExpression>']);
	} else if (!self.opts["--all"]) {
		// only regard metadata for current metadata types
		var currentMetadataTypes = self.currentPackageXml.getMetadataTypes()
		if (!currentMetadataTypes.length) {
			currentMetadataTypes = config.get('defaultMetadataTypes');
		}
		manifest.filterTypes(currentMetadataTypes);
	}
	var ignorePatterns = CliUtils.readForceIgnore(self.project.storage.getForceIgnorePath());
	manifest.getNotIgnoredMatches(ignorePatterns);
	if (self.opts["--custom-only"]) {
		manifest.filterStandard()
	}
	manifest.apiVersion = self.currentPackageXml.apiVersion || config.get('defaultApiVersion');
	CliUtils.writePackageXml(manifest, targetPath, false, callback);
};
