"use strict";

var Command = require('./command');
var config = new (require('../config'))();
var MetadataUtils = require('force-metadata-utils');
var Manifest = MetadataUtils.Manifest;
var CliUtils = require('../cli/utils');
var path = require("path");
var _ = require("underscore");

var doc = "Usage:\n" +
"	force-dev-tool package fmt [options]\n" +
"	force-dev-tool package [options] [<remote>]\n" +
"\n" +
"Options:\n" +
"	-a, --all              Index all metadata types, otherwise only metadata types listed in package.xml\n" +
"	--custom-only          Only index custom metadata components\n" +
"	--template=<template>  Path to template package.xml [default: ./src/package.xml].\n" +
"	--target=<target>      Path to target package.xml [default: ./src/package.xml].";

var SubCommand = module.exports = function(project) {
	Command.call(this, doc, project);
};

SubCommand.prototype = Object.create(Command.prototype);
SubCommand.prototype.constructor = SubCommand;

SubCommand.prototype.complete = function(tabtab, data) {
	return tabtab.log(['-a', '--all', '--custom-only', '--template', '--target', 'fmt', 'REMOTENAME'], data);
};

SubCommand.prototype.process = function(callback) {
	var self = this;
	self.opts = self.docopt();
	var templatePath = path.resolve(self.opts['--template']);
	var targetPath = path.resolve(self.opts['--target']);
	self.currentPackageXml = new Manifest();
	if (self.opts.fmt) {
		self.currentPackageXml = Manifest.fromPackageXml(CliUtils.readFileSafe(templatePath));
		return CliUtils.writePackageXml(self.currentPackageXml, targetPath, false, callback);
	}
	var manifest = self.project.getManifest(self.opts['<remote>']);
	// filter installed metadata components
	var unpackagedManifestJSON = _.filter(manifest.manifest(), function(item) {
		return item.manageableState !== 'installed' && item.type !== 'InstalledPackage';
	});
	manifest = new Manifest({manifestJSON: unpackagedManifestJSON});
	if (!self.opts["--all"]) {
		self.currentPackageXml = Manifest.fromPackageXml(CliUtils.readFileSafe(templatePath));
		var currentMetadataTypes = self.currentPackageXml.getMetadataTypes() || config.get('defaultMetadataTypes');
		manifest = new Manifest({manifestJSON: manifest.filterTypes(currentMetadataTypes)});
	}
	var ignorePatterns = CliUtils.readForceIgnore(self.project.storage.forceIgnorePath);
	manifest = new Manifest({manifestJSON: manifest.getNotIgnoredMatches(ignorePatterns)});
	if (self.opts["--custom-only"]) {
		manifest = new Manifest({manifestJSON: manifest.filterStandard()});
	}
	manifest.apiVersion = self.currentPackageXml.apiVersion || config.get('defaultApiVersion');
	CliUtils.writePackageXml(manifest, targetPath, false, callback);
};

