"use strict";

var config = new(require('../config'))();
var jsforce = require('jsforce');
var async = require('async');
var _ = require('underscore');

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

/*
	List metadata in chunks of 3 queries because of this limit:
	LIMIT_EXCEEDED: No more than 3 allowed in request
 */
Remote.prototype.listMetadata = function(queries, callback) {
	var self = this;
	var allFileProperties = [];
	var CHUNK_SIZE = 3;
	var chunksOfQueries = _.toArray(_.groupBy(queries, function(element, index) {
		return Math.floor(index / CHUNK_SIZE);
	}));
	async.each(chunksOfQueries,
		function(chunkOfQueries, cb) {
			self.conn.metadata.list(chunkOfQueries, function(err, fileProperties) {
				if (err) {
					return cb(err);
				}
				if (fileProperties !== undefined && fileProperties !== null) {
					allFileProperties = allFileProperties.concat(fileProperties);
				}
				cb(null, allFileProperties);
			});
		},
		function(err) {
			if (err) {
				return callback(err);
			}
			callback(null, allFileProperties);
		}
	);
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

/**
 * Retrieve FileProperties[] for all MetadataComponents in two steps.
 * First list folders, then list all MetadataComponents including those in folders.
 * @return {FileProperties[]}
 */
Remote.prototype.fetch = function(callback) {
	var self = this;
	var remoteName = self.name;
	self.login(function(loginErr) {
		if (loginErr) {
			return callback('Login failed for remote ' + remoteName + ': ' + loginErr);
		}
		self.conn.metadata.pollTimeout = config.pollTimeout;
		self.types = [];
		self.manifest = [];
		var warnings = [];
		async.series({
				describeMetadataResult: function(cb) {
					self.conn.metadata.describe(function(describeErr, types) {
						if (describeErr) {
							return cb(describeErr);
						}
						self.types = types;
						cb(null, types);
					});
				},
				manifest: function(cb) {
					var metadataTypeNames = _.pluck(self.types.metadataObjects, 'xmlName');
					var childXmlNames = _.pluck(_.filter(self.types.metadataObjects, function(type) {
						return type.childXmlNames;
					}), 'childXmlNames');
					metadataTypeNames = _.flatten([].concat(metadataTypeNames, childXmlNames));
					var queries = metadataTypeNames.map(function(item) {
						return {
							type: item
						};
					});
					var folderBasedMetadataMap = config.get('folderBasedMetadataMap');
					var folderBasedMetadataTypes = Object.keys(folderBasedMetadataMap);
					var inFolderQueries = folderBasedMetadataTypes.map(function(item) {
						return {
							type: item
						};
					});
					self.listMetadata(inFolderQueries, function(inFolderErr, foldersManifestJSON) {
						if (inFolderErr) {
							return cb(inFolderErr);
						}
						if (foldersManifestJSON) {
							var folderBasedQueries = foldersManifestJSON.map(function(item) {
								return {
									type: folderBasedMetadataMap[item.type],
									folder: item.fullName
								};
							});
							queries = [].concat(queries, folderBasedQueries);
						}
						self.listMetadata(queries, function(err, manifestJSON) {
							if (err) {
								return cb(err);
							}
							self.manifest = [].concat(foldersManifestJSON, manifestJSON);
							cb(null, self.manifest);
						});
					});
				},
				toolingObjects: function(cb) {
					self.query("SELECT Id,Name,TableEnumOrId FROM ApexTrigger WHERE Status = 'Active'", function(err, result) {
						if (err) {
							// ignore errors here since GE/PE do not have Apex available
							warnings.push('Warning: [' + remoteName + '] Ignoring error: ' + err);
						}
						return cb(null, result);
					});
				},
				warnings: function(cb) {
					self.manifest.forEach(function(component) {
						if (component.type === 'QuickAction' && new RegExp('^09D26.*').test(component.id)) {
							warnings.push('Warning: [' + remoteName + '] Found non-global QuickAction: ' + component.fullName);
						}
						if (component.type === 'Flow' && !new RegExp('^.*-[0-9]+$').test(component.fullName)) {
							warnings.push('Warning: [' + remoteName + '] Found non-versioned Flow: ' + component.fullName);
						}
					});
					cb(null, warnings);
				}
			},
			callback);
	});
};
