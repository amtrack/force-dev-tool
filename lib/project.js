"use strict";

var path = require('path');
var MetadataUtils = require('force-metadata-utils');
var CliUtils = require('./cli/utils');

var Project = module.exports = function(opts) {
	opts = opts ? opts : {};
	this.storage = opts.storage;
	this.remotes = opts.remotes;
};

Project.prototype.getConfigPath = function(remoteName) {
	var self = this;
	return path.resolve(path.join(self.storage.configPath, self.determineRemote(remoteName).name));
};

Project.prototype.determineRemote = function(optRemoteName) {
	var self = this;
	return self.remotes.get(optRemoteName) || self.remotes.getDefault();
};

Project.prototype.getManifestPath = function(remoteName) {
	var self = this;
	return path.resolve(self.getConfigPath(remoteName) + '-manifest.json');
};

Project.prototype.getManifest = function(remoteName) {
	var self = this;
	return new MetadataUtils.Manifest({manifestJSON: CliUtils.readJsonFile(self.getManifestPath(remoteName))});
};

Project.prototype.getMetadataTypes = function(remoteName) {
	var self = this;
	return new MetadataUtils.Manifest({manifestJSON: CliUtils.readJsonFile(self.getConfigPath(remoteName) + '-metadataTypes.json')});
};
