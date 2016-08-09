"use strict";

var async = require('async');
var _ = require('underscore');
var multimatch = require('multimatch');
var chalk = require('chalk');
var config = new(require('./config'))();

var DescribeRemote = module.exports = function(conn, opts) {
	this._conn = conn;
	this.opts = opts ? opts : {};
};

DescribeRemote.prototype.constructor = DescribeRemote;

DescribeRemote.getMatches = function(queries, matchPatterns) {
	var filtered = _.filter(queries, function(query) {
		return multimatch([query.type + '/' + query.folder], matchPatterns).length > 0;
	});
	return filtered;
};

DescribeRemote.getNotIgnoredMatches = function(queries, ignorePatterns) {
	var matchPatterns = ['**/*'];
	ignorePatterns.forEach(function(ignorePattern) {
		matchPatterns.push('!' + ignorePattern);
	});
	return DescribeRemote.getMatches(queries, matchPatterns);
};

/*
	List metadata in chunks of 3 queries because of this limit:
	LIMIT_EXCEEDED: No more than 3 allowed in request
 */
DescribeRemote.prototype.listMetadata = function(queries, callback) {
	var self = this;
	var allFileProperties = [];
	var CHUNK_SIZE = 3;
	var chunksOfQueries = _.toArray(_.groupBy(queries, function(element, index) {
		return Math.floor(index / CHUNK_SIZE);
	}));
	async.each(chunksOfQueries,
		function(chunkOfQueries, cb) {
			self._conn.metadata.list(chunkOfQueries, function(err, fileProperties) {
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

DescribeRemote.prototype.fetch = function(callback) {
	var self = this;
	self._conn.metadata.pollTimeout = config.pollTimeout;

	// intermediate results
	var describeMetadataResult = {};
	var warnings = [];

	async.series({
			apiVersions: function(cb) {
				self.opts.progress && console.log(chalk.grey('API Versions'));
				self._conn.request({
					method: 'get',
					url: '/services/data',
					headers: {
						'Content-Type': 'application/json'
					}
				}, {}, function(err, response) {
					if (err) {
						warnings.push('Error retrieving api versions from /services/data: ' + err);
						return cb(null, []);
					}
					return cb(null, response);
				});
			},
			describeMetadataResult: function(cb) {
				// DescribeMetadataResult
				// https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_describemeta_result.htm
				self.opts.progress && console.log(chalk.grey('Available Metadata Types'));
				self._conn.metadata.describe(function(err, result) {
					if (err) {
						return cb(err);
					}
					// store this to be able to reuse later
					describeMetadataResult = result;
					cb(null, result);
				});
			},
			fileProperties: function(cbFileProperties) {
				// FileProperties[]
				var folderBasedQueries = [];
				var filePropertyQueries = [];
				async.series([
					function(cbFolder) {
						// folders
						self.opts.progress && console.log(chalk.grey('Folders'));
						var metadataTypeNames = _.pluck(describeMetadataResult.metadataObjects, 'xmlName');
						var childXmlNames = _.pluck(_.filter(describeMetadataResult.metadataObjects, function(type) {
							return type.childXmlNames;
						}), 'childXmlNames');
						metadataTypeNames = _.flatten([].concat(metadataTypeNames, childXmlNames));
						filePropertyQueries = metadataTypeNames.map(function(item) {
							return {
								type: item
							};
						});
						var folderBasedMetadataMap = config.get('folderBasedMetadataMap');
						var folderBasedMetadataTypes = Object.keys(folderBasedMetadataMap);
						var queries = folderBasedMetadataTypes.map(function(item) {
							return {
								type: item
							};
						});
						if (self.opts.ignorePatterns) {
							queries = DescribeRemote.getNotIgnoredMatches(queries, self.opts.ignorePatterns);
						}
						self.listMetadata(queries, function(err, result) {
							if (err) {
								return cbFolder(err);
							}
							// store this to be able to reuse later
							folderBasedQueries = result.map(function(item) {
								return {
									type: folderBasedMetadataMap[item.type],
									folder: item.fullName
								};
							});
							return cbFolder(null, result);
						});
					},
					function(cbComponents) {
						// components
						self.opts.progress && console.log(chalk.grey('Metadata Components'));
						var queries = [].concat(folderBasedQueries, filePropertyQueries); // from previous step
						if (self.opts.ignorePatterns) {
							queries = DescribeRemote.getNotIgnoredMatches(queries, self.opts.ignorePatterns);
						}
						self.listMetadata(queries, function(err, result) {
							if (err) {
								return cbComponents(err);
							}
							cbComponents(null, result);
						});
					}
				], function(err, results) {
					if (err) {
						return cbFileProperties(err);
					}
					return cbFileProperties(null, _.flatten(results));
				});
			},
			personAccountRecordTypes: function(cb) {
				self.opts.progress && console.log(chalk.grey('RecordTypes of PersonAccount'));
				self._conn.query("SELECT Name, SobjectType, IsPersonType FROM RecordType WHERE SobjectType='Account' AND IsPersonType=True", function(err, result) {
					// ignore errors here since the query only succeeds when PersonAccounts are enabled
					if (err || !result.records) {
						return cb(null, []);
					}
					return cb(null, result.records);
				});
			},
			flowDefinitions: function(cb) {
				self.opts.progress && console.log(chalk.grey('Active Flow versions'));
				self._conn.tooling.query("SELECT DeveloperName, ActiveVersion.VersionNumber FROM FlowDefinition", function(err, result) {
					// don't fail on error
					if (err) {
						warnings.push('Warning: ' + err);
						return cb(null, []);
					} else if (!result.records) {
						return cb(null, []);
					}
					return cb(null, result.records);
				});
			},
			warnings: function(cb) {
				return cb(null, warnings);
			}
		},
		callback
	);
};
