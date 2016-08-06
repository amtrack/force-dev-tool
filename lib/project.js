"use strict";

var path = require('path');
var Manifest = require('./manifest');
var CliUtils = require('./cli/utils');

var Project = module.exports = function(opts) {
	opts = opts ? opts : {};
	this.storage = opts.storage;
	this.remotes = opts.remotes;
};

Project.prototype.getConfigPath = function(remoteName) {
	var self = this;
	return path.resolve(path.join(self.storage.getConfigPath(), self.remotes.get(remoteName).name));
};

Project.prototype.getFetchResultPath = function(remoteName) {
	var self = this;
	return path.resolve(self.getConfigPath(remoteName) + '-fetch-result.json');
};

Project.prototype.getManifest = function(remoteName) {
	var self = this;
	return Manifest.fromFetchResult(CliUtils.readJsonFile(self.getFetchResultPath(remoteName)))
};
