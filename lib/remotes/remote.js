"use strict";

var config = new(require('../config'))();
var jsforce = require('jsforce');

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

Remote.prototype.login = function(callback) {
	var self = this;
	var credentials = self.getJSON();
	self.conn = new jsforce.Connection({
		loginUrl: credentials.serverUrl,
		version: config.get('defaultApiVersion')
	});
	self.conn.login(credentials.username, credentials.password, callback);
};

Remote.prototype.query = function(soql, callback) {
	var self = this;
	self.conn.query(soql, function(err, result) {
		if (err) {
			return callback(err);
		}
		callback(null, Array.isArray(result.records) ? result.records : [result.records]);
	});
};
