"use strict";

var Command = require('./command');
var CliUtils = require('./utils');
var FetchResultParser = require('../fetch-result-parser');
var Manifest = require('../manifest');
var Utils = require('./utils');

var doc = "Usage:\n" +
	"	force-dev-tool info version [<remote>]\n" +
	"	force-dev-tool info api-versions [<remote>]\n" +
	"	force-dev-tool info list [<remote>]\n" +
	"	force-dev-tool info grep <remote> <expression>...\n" +
	"	force-dev-tool info show <remote> <expression>...\n" +
	"	force-dev-tool info [<remote>]\n" +
	"\n" +
	"Show describe information from a remote.\n" +
	"\n" +
	"Examples:\n" +
	"	$ force-dev-tool info version\n" +
	"	38.0";

var SubCommand = module.exports = function(project) {
	Command.call(this, doc, project);
};

SubCommand.prototype = Object.create(Command.prototype);
SubCommand.prototype.constructor = SubCommand;

SubCommand.prototype.complete = function(tabtab, data) {
	// TODO: allow glob completion
	return tabtab.log(['--quiet'], data, '');
};

SubCommand.prototype.process = function(proc, callback) {
	var self = this;
	self.opts = self.opts ? self.opts : self.docopt();

	var fetchResult = new FetchResultParser(CliUtils.readJsonFile(self.project.getFetchResultPath(self.opts['<remote>'])));
	if (self.opts['version']) {
		console.log(fetchResult.getApiVersion());
		return callback(null);
	}
	if (self.opts['api-versions']) {
		console.log(JSON.stringify(fetchResult.apiVersions, ' ', 2));
		return callback(null);
	}
	if (self.opts['list']) {
		console.log(fetchResult.getComponents().sort().join("\n"));
		return callback(null);
	}
	if (self.opts['grep']) {
		var manifest = new Manifest({
			manifestJSON: fetchResult.getComponents()
		});
		var matches = manifest.getMatches(Utils.handleXargsNull(self.opts['<expression>']));
		if (matches && matches.manifestJSON && matches.manifestJSON.length) {
			console.log(matches.manifestJSON.sort().join("\n"));
			return callback(null);
		}
		return callback("No matches found");
	}
	if (self.opts['show']) {
		var rawManifest = new Manifest({
			manifestJSON: fetchResult.fileProperties
		});
		var rawMatches = rawManifest.getMatches(Utils.handleXargsNull(self.opts['<expression>']));
		if (rawMatches && rawMatches.manifestJSON && rawMatches.manifestJSON.length) {
			console.log(JSON.stringify(rawMatches.manifestJSON, " ", 2));
			return callback(null);
		}
		return callback("No matches found");
	}
	console.log(JSON.stringify(fetchResult.resultJSON, ' ', 2))
	return callback(null);
};
