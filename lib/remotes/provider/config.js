"use strict";

var RemoteProvider = require('../provider');
var Remote = require('../remote');

var path = require('path');
var nconf = require('nconf');
var fs = require('fs');
var mkdirp = require('mkdirp');

var ConfigRemoteProvider = module.exports = function(config) {
	var self = this;
	self.config = config;
	RemoteProvider.call(self, config);
	nconf.use('file', {
		file: config.path
	});
	nconf.load();
};

ConfigRemoteProvider.prototype = Object.create(RemoteProvider.prototype);
ConfigRemoteProvider.prototype.constructor = ConfigRemoteProvider;

ConfigRemoteProvider.prototype.list = function() {
	var remotes = [];
	var result = nconf.get('remotes');
	if (result) {
		Object.keys(result).forEach(function(remoteName) {
			var remoteJSON = result[remoteName];
			var remote = new Remote(remoteJSON.name, remoteJSON.username, remoteJSON.password, {serverUrl: remoteJSON.serverUrl, default: remoteJSON.default});
			remotes.push(remote);
		});
	}
	return remotes;
};

ConfigRemoteProvider.prototype.add = function(remote, callback) {
	nconf.set('remotes:' + remote.name, remote);
	this.save(callback);
};

ConfigRemoteProvider.prototype.get = function(name) {
	return nconf.get('remotes:' + name);
};

ConfigRemoteProvider.prototype.setDefault = function(name, callback) {
	var remotes = nconf.get('remotes') || {};
	var remoteFound = false;
	Object.keys(remotes).forEach(function(remoteName){
		if (remoteName === name) {
			remoteFound = true;
			nconf.set('remotes:' + remoteName + ':default', true);
		}
		else {
			nconf.set('remotes:' + remoteName + ':default', false);
		}
	});
	if (!remoteFound) {
		return callback(new Error("Could not determine remote `" + name + "`"));
	}
	this.save(callback);
};

ConfigRemoteProvider.prototype.remove = function(name, callback) {
	nconf.clear('remotes:' + name);
	this.save(callback);
};

ConfigRemoteProvider.prototype.save = function(callback) {
	var self = this;
	if (!fs.existsSync(path.dirname(self.config.path))) {
		mkdirp.sync(path.dirname(self.config.path), parseInt('0700', 8));
	}
	nconf.save(function(err) {
		if (err) {
			console.error(err.message);
			return callback(err.message);
		}
		callback();
	});
};
