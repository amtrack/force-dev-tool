"use strict";

var RemoteProvider = require('../provider');

var MultiRemoteProvider = module.exports = function(config) {
	var self = this;
	RemoteProvider.call(self, config);
};

MultiRemoteProvider.prototype = Object.create(RemoteProvider.prototype);
MultiRemoteProvider.prototype.constructor = MultiRemoteProvider;

MultiRemoteProvider.prototype.list = function() {
	var self = this;
	var remotes = [];
	self.config.providers.forEach(function(provider) {
		var results = provider.list();
		if (results) {
			Object.keys(results).forEach(function(remoteName){
				remotes.push(results[remoteName]);
			});
		}
	});
	return remotes;
};

MultiRemoteProvider.prototype.add = function(remote, callback) {
	var self = this;
	self.config.providers.forEach(function(provider) {
		if (!provider.readOnly) {
			provider.add(remote, callback);
		}
	});
};

MultiRemoteProvider.prototype.setDefault = function(name, callback) {
	var self = this;
	self.config.providers.forEach(function(provider) {
		if (!provider.readOnly) {
			provider.setDefault(name, callback);
		}
	});
};

MultiRemoteProvider.prototype.remove = function(name, callback) {
	var self = this;
	self.config.providers.forEach(function(provider) {
		if (!provider.readOnly) {
			provider.remove(name, callback);
		}
	});
};
