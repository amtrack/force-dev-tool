"use strict";

var config = new(require('../config'))();

/**
 * Represents a Forcedotcom login.
 * @constructor
 * @param {string} name - a human readable name.
 * @param {string} username - username.
 * @param {string} password - password.
 * @param {object} opts - options.
 */
var Remote = module.exports = function(name, username, password, opts) {
	opts = opts || {};
	this.name = name;
	this.default = opts.default !== undefined ? opts.default : false;
	this.username = username;
	this.password = password;
	this.serverUrl = opts.serverUrl ? opts.serverUrl : 'https://test.salesforce.com';
};

Remote.prototype.getJSON = function() {
	var self = this;
	return {
		username: self.username,
		password: self.securityToken ? self.password + self.securityToken : self.password,
		serverUrl: self.serverUrl
	};
};

Remote.prototype.connect = function(callback) {
	var jsforce = require('jsforce');
	var self = this;
	var credentials = self.getJSON();
	var conn = new jsforce.Connection({
		loginUrl: credentials.serverUrl,
		version: config.get('defaultApiVersion')
	});
	conn.login(credentials.username, credentials.password, function(loginErr) {
		if (loginErr) {
			return callback(loginErr);
		}
		return callback(null, conn);
	});
};
