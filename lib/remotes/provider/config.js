"use strict";

var RemoteProvider = require('../provider');
var Remote = require('../remote');

var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');

var ConfigRemoteProvider = module.exports = function(config) {
	var self = this;
	self.config = config;
	RemoteProvider.call(self, config);
	self.remotesDict = {};
	try {
		self.remotesDict = require(self.config.path).remotes;
	} catch (err) {
		// ignore
	}
};

ConfigRemoteProvider.prototype = Object.create(RemoteProvider.prototype);
ConfigRemoteProvider.prototype.constructor = ConfigRemoteProvider;

ConfigRemoteProvider.prototype.list = function() {
	var self = this;
	var remotes = [];
	Object.keys(self.remotesDict).forEach(function(remoteName) {
		var remoteJSON = self.remotesDict[remoteName];
		var remote = new Remote(remoteJSON.name, remoteJSON.username, remoteJSON.password, {
			serverUrl: remoteJSON.serverUrl,
			default: remoteJSON.default
		});
		remotes.push(remote);
	});
	return remotes;
};

ConfigRemoteProvider.prototype.add = function(remote, callback) {
	var self = this;
	self.remotesDict[remote.name] = remote;
	if (remote.default) {
		return self.setDefault(remote.name, callback);
	}
	self.save(callback);
};

ConfigRemoteProvider.prototype.setDefault = function(name, callback) {
	var self = this;
	if (self.remotesDict[name]) {
		Object.keys(self.remotesDict).forEach(function(remoteName) {
			self.remotesDict[remoteName].default = false;
		});
		self.remotesDict[name].default = true;
		return self.save(callback);
	}
	callback("Could not determine remote `" + name + "`");
};

ConfigRemoteProvider.prototype.remove = function(name, callback) {
	var self = this;
	delete self.remotesDict[name];
	this.save(callback);
};

ConfigRemoteProvider.prototype.save = function(callback) {
	var self = this;
	if (!fs.existsSync(path.dirname(self.config.path))) {
		mkdirp.sync(path.dirname(self.config.path), parseInt('0700', 8));
	}
	fs.writeFile(self.config.path, JSON.stringify({
		remotes: self.remotesDict
	}, null, 4), callback);
};
