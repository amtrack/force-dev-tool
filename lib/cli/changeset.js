"use strict";

var Command = require('./command');
var config = new(require('../config'))();
var CliUtils = require('../cli/utils');
var Diff = require('../diff');
var MetadataContainer = require('../metadata-container');
var MetadataComponent = require('../metadata-component');
var MetadataFile = require('../metadata-file');
var Manifest = require('../manifest');
var path = require('path');
var fs = require('fs-extra');
var vinylFs = require('vinyl-fs');
var miss = require('mississippi')
var split = require('split2');
var es = require('event-stream');

var doc = "Usage:\n" +
	"	force-dev-tool changeset create <name> [<metadataFileOrComponentNames>...] [options]\n" +
	"\n" +
	"Options:\n" +
	"	--apiVersion=<apiVersion>    API version. Defaulted to API version of project.\n" +
	"	-d=<directory>               Path to target directory.\n" +
	"	--dry-run                    Only print what would be done.\n" +
	"	--ignore-whitespace          Whether to include whitespace when comparing metadata for inclusion/removal.\n" +
	"	--destructive                Creates a destructive changeset.\n" +
	"	-f --force                   Overwrites the target directory if it exists already.";

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

	var metadataContainer = new MetadataContainer();
	self.opts['<metadataFileOrComponentNames>'].forEach(function(componentOrFileName) {
		var component;
		if (fs.existsSync(componentOrFileName)) {
			component = new MetadataFile({
				path: path.relative(path.join(process.cwd(), 'src'), componentOrFileName)
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

	var stdin = proc.stdin
		.pipe(split())
		.pipe(miss.through.obj(function(line, enc, cb) {
			if (line.indexOf('diff --git') == 0) {
				if (this.diff) this.push(this.diff);
				this.diff = line;
			} else {
				this.diff += '\n' + line;
			}
			cb();
		}, function(cb) {
			cb(null, this.diff);
		}))
		.pipe(Diff.stream({
			ignoreWhitespace: !!self.opts['--ignore-whitespace']
		}))
		.pipe(MetadataContainer.diffStream())

	proc.stdin.on('close', function() {
		stdin.end();
	});

	es.merge(stdin, metadataContainer.getStream())
		.pipe(MetadataContainer.completeMetadataStream())
		.pipe(MetadataContainer.outputStream({
			apiVersion: apiVersion
		}))
		.pipe(vinylFs.dest(deploymentPath))
		.on('end', function(){
			callback(null, "exported metadata container to " + path.relative(proc.cwd, deploymentPath));
		});

	proc.stdin.on('end', function() {
		// console.error('end');
	});
	proc.stdin.resume();
};
