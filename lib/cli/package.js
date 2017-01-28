"use strict";

var Command = require('./command');
var config = new(require('../config'))();
var Manifest = require('../manifest');
var MetadataComponent = require('../metadata-component');
var FetchResultParser = require('../fetch-result-parser');
var CliUtils = require('./utils');
var path = require("path");
var chalk = require('chalk');

var doc = "Usage:\n" +
	"	force-dev-tool package fmt [options]\n" +
	"	force-dev-tool package version [options] [<apiVersion>]\n" +
	"	force-dev-tool package list [options]\n" +
	"	force-dev-tool package grep [options] <expression>...\n" +
	"	force-dev-tool package add [options] <component>...\n" +
	"	force-dev-tool package remove [options] <expression>...\n" +
	"	force-dev-tool package [options] [<remote>] [<expression>...]\n" +
	"\n" +
	"Options:\n" +
	"	-f, --file=<path>      Path to package.xml.\n" +
	"	-a, --all              Index all metadata types, otherwise only metadata types listed in package.xml\n" +
	"	--custom-only          Only index custom metadata components\n" +
	"	--template=<template>  DEPRECATED! Use `-f` instead.\n" +
	"	--target=<target>      DEPRECATED! Use `-f` instead.\n" +
	"\n" +
	"Examples:\n" +
	"	Generating a package.xml based on a remote fetch result\n" +
	"		$ force-dev-tool package\n" +
	"		Created src/package.xml\n" +
	"\n" +
	"	Formatting the current package.xml file\n" +
	"		$ force-dev-tool package fmt\n" +
	"		Created src/package.xml\n" +
	"\n" +
	"	Getting and setting the version of the package.xml\n" +
	"		$ force-dev-tool package version\n" +
	"		37.0\n" +
	"		$ force-dev-tool package version 38.0\n" +
	"		Created src/package.xml\n" +
	"		$ force-dev-tool package version\n" +
	"		38.0\n" +
	"\n" +
	"	Listing the components of the package.xml\n" +
	"		$ force-dev-tool package list\n" +
	"		ApexClass/Bar\n" +
	"		ApexClass/MockFoo\n" +
	"		ApexClass/TestFoo\n" +
	"\n" +
	"	Grep the package.xml using expressions\n" +
	"		$ force-dev-tool package grep 'ApexClass/Test*'\n" +
	"		ApexClass/TestFoo\n" +
	"		$ force-dev-tool package grep 'ApexClass/Test*' 'ApexClass/Mock*'\n" +
	"		ApexClass/MockFoo\n" +
	"		ApexClass/TestFoo\n" +
	"\n" +
	"	Adding components to the package.xml\n" +
	"		$ force-dev-tool package add ApexClass/Test_Foo ApexClass/Test_MockFoo\n" +
	"		Created src/package.xml\n" +
	"\n" +
	"	Removing components from the package.xml using expressions\n" +
	"		$ force-dev-tool package remove 'ApexClass/Test_*'\n" +
	"		Created src/package.xml";

var SubCommand = module.exports = function(project) {
	Command.call(this, doc, project);
};

SubCommand.prototype = Object.create(Command.prototype);
SubCommand.prototype.constructor = SubCommand;

SubCommand.prototype.complete = function(tabtab, data) {
	return tabtab.log(['-a', '--all', '--custom-only', '-f', '--file', '--template', '--target', 'fmt', 'version', 'grep', 'REMOTENAME'], data);
};

SubCommand.prototype.process = function(proc, callback) {
	var self = this;
	self.opts = self.docopt();
	var templatePath = self.opts['--template'] ? path.resolve(self.opts['--template']) : self.project.storage.getPackageXmlPath();
	var targetPath = self.opts['--target'] ? path.resolve(self.opts['--target']) : self.project.storage.getPackageXmlPath();
	if (self.opts['--file']) {
		templatePath = path.resolve(self.opts['--file']);
		targetPath = path.resolve(self.opts['--file']);
	}
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
	if (self.opts.list) {
		if (!packageXmlExists) {
			return callback("Package `" + templatePath + "` does not exist");
		}
		if (self.currentPackageXml.manifestJSON && self.currentPackageXml.manifestJSON.length) {
			console.log(self.currentPackageXml.manifestJSON.sort().join("\n"));
			return callback(null);
		}
		return callback("No matches found");
	}
	if (self.opts.grep) {
		if (!packageXmlExists) {
			return callback("Package `" + templatePath + "` does not exist");
		}
		var matches = self.currentPackageXml.getMatches(CliUtils.handleXargsNull(self.opts['<expression>']));
		if (matches && matches.manifestJSON && matches.manifestJSON.length) {
			console.log(matches.manifestJSON.sort().join("\n"));
			return callback(null);
		}
		return callback("No matches found");
	}
	if (self.opts.add) {
		var invalidComponents = [];
		CliUtils.handleXargsNull(self.opts['<component>']).forEach(function(componentName) {
			var c = new MetadataComponent(componentName);
			if (!c.type || !c.fullName) {
				invalidComponents.push(componentName);
			} else {
				self.currentPackageXml.add(c);
			}
		});
		if (invalidComponents && invalidComponents.length > 0) {
			return callback('Invalid components: ' + invalidComponents.join(', '));
		}
		return CliUtils.writePackageXml(self.currentPackageXml, targetPath, false, callback);
	}
	if (self.opts.remove) {
		if (!packageXmlExists) {
			return callback("Package `" + templatePath + "` does not exist");
		}
		self.currentPackageXml.remove(CliUtils.handleXargsNull(self.opts['<expression>']));
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

	if (self.opts['<expression>'].length > 0) {
		// regard only matches
		manifest.getMatches(CliUtils.handleXargsNull(self.opts['<expression>']));
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
