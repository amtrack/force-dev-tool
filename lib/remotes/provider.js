"use strict";

var _ = require('underscore');

var RemoteProvider = module.exports = function(config) {
	this.config = config;
	this.remotes = [];
};

/**
 * returns a list of remotes
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
		callback();
	}
};

/**
 * asynchronously remove a remote
 */
RemoteProvider.prototype.remove = function(name, callback) {
	var self = this;
	var index = _.findIndex(self.remotes, function(item){
		return item.name === name;
	});
	if (index >= 0) {
		delete self.remotes[index];
	}
	if (typeof callback === 'function') {
		callback();
	}
};

/**
 * returns a specific remote
 */
RemoteProvider.prototype.get = function(name) {
	var self = this;
	var results = self.list();
	if (!results) {
		return [];
	}
	return _.findWhere(results, {name: name});
};

/**
 * returns a default remote
 */
RemoteProvider.prototype.getDefault = function() {
	var self = this;
	var results = self.list();
	if (!results) {
		return [];
	}
	return _.findWhere(results, {default: true});
};
