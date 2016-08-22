"use strict";

var Command = require('./command');
var Manifest = require('../manifest');
var FetchResultParser = require('../fetch-result-parser');
var MetadataContainer = require('../metadata-container');
var MetadataFile = require('../metadata-file');
var MetadataWriter = require('../metadata-writer');
var CliUtils = require('./utils');
var path = require("path");
var fs = require('fs-extra');
var vinylFs = require('vinyl-fs');
var chalk = require('chalk');

var doc = "Usage:\n" +
	"	force-dev-tool factory-reset [options] [<remote>]\n" +
	"\n" +
	"Options:\n" +
	"	--delete               Delete all metadata that can be deleted.\n" +
	"	--approval-processes   Deactivate approval processes.\n" +
	"	--flows                Deactivate flows.\n" +
	"	--layouts              Remove visualforce pages and custom links from layouts.\n" +
	"	-d=<directory>         Path to target directory.\n" +
	"	-f --force             Overwrites the target directory if it exists already.";

var SubCommand = module.exports = function(project) {
	Command.call(this, doc, project);
};

SubCommand.prototype = Object.create(Command.prototype);
SubCommand.prototype.constructor = SubCommand;

SubCommand.prototype.complete = function(tabtab, data) {
	return tabtab.log(['-d', '-f', '--force', '--delete', '--approval-processes', '--flows', '--layouts', 'REMOTENAME'], data);
};

SubCommand.prototype.process = function(proc, callback) {
	var self = this;
	self.opts = self.docopt();
	// check whether deployment path exists already
	var deploymentPath = path.resolve(self.opts['-d'] ? path.resolve(self.opts['-d']) : path.join(self.project.storage.getConfigPath(), 'deployments', 'factory-reset'));
	var force = self.opts['--force'] || false;
	if (fs.existsSync(deploymentPath)) {
		if (force) {
			fs.removeSync(deploymentPath);
		} else {
			return callback("Deployment directory already exists: " + deploymentPath);
		}
	}
	var fetchResult = new FetchResultParser(CliUtils.readJsonFile(self.project.getFetchResultPath(self.opts['<remote>'])));
	var allComponents = fetchResult.getComponents();
	var warnings = fetchResult.getWarnings();
	if (warnings && warnings.length > 0) {
		console.log(chalk.yellow(warnings.join('\n')));
	}
	var metadataContainer = new MetadataContainer();
	metadataContainer.manifest = new Manifest({
		apiVersion: fetchResult.getApiVersion()
	});
	if (self.opts['--flows']) {
		var existingFlowDefinitions = new Manifest({
			manifestJSON: allComponents
		}).filterTypes(['FlowDefinition']);
		existingFlowDefinitions.manifest().forEach(function(cmp) {
			var flowDefinition = {
				activeVersionNumber: 0
			}
			var metadataXml = new MetadataWriter('FlowDefinition', flowDefinition).toString();
			var v = new MetadataFile({
				path: cmp.fileName,
				contents: new Buffer(metadataXml)
			});
			metadataContainer.add(v);
		});
	}
	if (self.opts['--approval-processes']) {
		var approvalProcesses = fetchResult.metadata['ApprovalProcess'];
		if (!approvalProcesses) {
			return;
		}
		approvalProcesses.forEach(function(approvalProcess) {
			var fullName = approvalProcess.fullName;
			approvalProcess.active = false;
			var metadataXml = new MetadataWriter('ApprovalProcess', approvalProcess).toString();
			var v = new MetadataFile({
				path: path.join('approvalProcesses', fullName + '.approvalProcess'),
				contents: new Buffer(metadataXml)
			});
			metadataContainer.add(v);
		});
	}
	if (self.opts['--layouts']) {
		var layouts = fetchResult.metadata['Layout'];
		if (!layouts) {
			return;
		}
		layouts.forEach(function(layout) {
			var fullName = layout.fullName;
			if (layout.customButtons) {
				delete layout.customButtons;
			}
			if (layout.layoutSections) {
				if (!Array.isArray(layout.layoutSections)) {
					layout.layoutSections = [layout.layoutSections];
				}
				layout.layoutSections.forEach(function(layoutSection) {
					if (layoutSection.layoutColumns) {
						if (!Array.isArray(layoutSection.layoutColumns)) {
							layoutSection.layoutColumns = [layoutSection.layoutColumns];
						}
						layoutSection.layoutColumns.forEach(function(layoutColumn) {
							if (layoutColumn.layoutItems) {
								if (!Array.isArray(layoutColumn.layoutItems)) {
									layoutColumn.layoutItems = [layoutColumn.layoutItems];
								}
								for (var i = 0; i < layoutColumn.layoutItems.length; i++) {
									if (layoutColumn.layoutItems[i].customLink) {
										// remove all custom links
										delete layoutColumn.layoutItems[i];
									} else if (layoutColumn.layoutItems[i].page) {
										// remove all visualforce pages
										delete layoutColumn.layoutItems[i];
									}
								}
							}
						})
					}
				});
			}
			var metadataXml = new MetadataWriter('Layout', layout).toString();
			var v = new MetadataFile({
				path: path.join('layouts', fullName + '.layout'),
				contents: new Buffer(metadataXml)
			});
			metadataContainer.add(v);
		});
	}
	if (self.opts['--delete']) {
		var destructiveManifest = new Manifest({
			manifestJSON: fetchResult.getComponents({
				filterStandard: true
			})
		});
		// delete after deploying other metadata
		metadataContainer.post = true;
		metadataContainer.destructiveManifest = destructiveManifest;
	}
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
};
