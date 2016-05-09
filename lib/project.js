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

Project.prototype.getManifestPath = function(remoteName) {
	var self = this;
	return path.resolve(self.getConfigPath(remoteName) + '-manifest.json');
};

Project.prototype.getManifest = function(remoteName) {
	var self = this;
	return new Manifest({manifestJSON: CliUtils.readJsonFile(self.getManifestPath(remoteName))});
};

Project.prototype.getMetadataTypes = function(remoteName) {
	var self = this;
	return new Manifest({manifestJSON: CliUtils.readJsonFile(self.getConfigPath(remoteName) + '-metadataTypes.json')});
};
