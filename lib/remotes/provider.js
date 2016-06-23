"use strict";

var _ = require('underscore');

var RemoteProvider = module.exports = function(config) {
	this.config = config;
	this.remotes = [];
};

/**
 * returns a list of remotes
 * This should always return a list even if it is empty
 */
RemoteProvider.prototype.list = function() {
	var self = this;
	return self.remotes;
};

/**
 * asynchronously add a remote
 */
RemoteProvider.prototype.add = function(remote, callback) {
	var self = this;
	self.remotes.push(remote);
	if (typeof callback === 'function') {
		return callback();
	}
};

/**
 * asynchronously remove a remote
 */
RemoteProvider.prototype.remove = function(name, callback) {
	var self = this;
	var index = _.findIndex(self.remotes, function(item) {
		return item.name === name;
	});
	if (index >= 0) {
		delete self.remotes[index];
	}
	if (typeof callback === 'function') {
		return callback();
	}
};

/**
 * returns a specific remote
 * if name is undefined it will return the default remote
 */
RemoteProvider.prototype.get = function(name) {
	var self = this;
	if (name) {
		var remote = _.findWhere(self.list(), {
			name: name
		});
		if (!remote) {
			throw new Error('Could not determine remote `' + name + '`');
		}
		return remote;
	}
	return self.getDefault();
};

/**
 * returns a default remote
 */
RemoteProvider.prototype.getDefault = function() {
	var self = this;
	var remote = _.findWhere(self.list(), {
		default: true
	});
	if (!remote) {
		throw new Error('Could not determine default remote');
	}
	return remote;
};

RemoteProvider.prototype.setDefault = function(name, callback) {
	var self = this;
	var newDefaultRemote;
	try {
		newDefaultRemote = self.get(name);
	} catch (err) {
		// ignore
	}
	if (newDefaultRemote) {
		self.list().forEach(function(r) {
			r.default = false;
		});
		newDefaultRemote.default = true;
	}
	if (typeof callback === 'function') {
		return callback();
	}
};
