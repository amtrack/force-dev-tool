"use strict";

var async = require('async');
var _ = require('underscore');
var multimatch = require('multimatch');
var chalk = require('chalk');
var config = new(require('./config'))();

var DescribeRemote = module.exports = function(conn, opts) {
	this._conn = conn;
	this.opts = opts ? opts : {};
	if (typeof(this.opts.progress) !== 'boolean') {
		this.opts.progress = false;
	}
	if (typeof(this.opts.apiVersions) !== 'boolean') {
		this.opts.apiVersions = true;
	}
	if (typeof(this.opts.describeMetadataResult) !== 'boolean') {
		this.opts.describeMetadataResult = true;
	}
	if (typeof(this.opts.fileProperties) !== 'boolean') {
		this.opts.fileProperties = true;
	}
	if (typeof(this.opts.personAccountRecordTypes) !== 'boolean') {
		this.opts.personAccountRecordTypes = true;
	}
	if (typeof(this.opts.flowDefinitions) !== 'boolean') {
		this.opts.flowDefinitions = true;
	}

	// intermediate results
	this.describeMetadataResult = {};
	this.warnings = [];
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

DescribeRemote.prototype.fetchApiVersions = function(cb) {
	var self = this;
	self.opts.progress && console.log(chalk.grey('API Versions'));
	self._conn.request({
		method: 'get',
		url: '/services/data',
		headers: {
			'Content-Type': 'application/json'
		}
	}, {}, function(err, response) {
		if (err) {
			self.warnings.push('Error retrieving api versions from /services/data: ' + err);
			return cb(null, []);
		}
		return cb(null, response);
	});
};

DescribeRemote.prototype.fetchDescribeMetadataResult = function(cb) {
	var self = this;
	// DescribeMetadataResult
	// https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_describemeta_result.htm
	self.opts.progress && console.log(chalk.grey('Available Metadata Types'));
	self._conn.metadata.describe(function(err, result) {
		if (err) {
			return cb(err);
		}
		// store this to be able to reuse later
		self.describeMetadataResult = result;
		cb(null, result);
	});
};

DescribeRemote.prototype.fetchFileProperties = function(cbFileProperties) {
	var self = this;
	// FileProperties[]
	var folderBasedQueries = [];
	var filePropertyQueries = [];
	async.series([
		function(cbFolder) {
			// folders
			self.opts.progress && console.log(chalk.grey('Folders'));
			var metadataTypeNames = _.pluck(self.describeMetadataResult.metadataObjects, 'xmlName');
			var childXmlNames = _.pluck(_.filter(self.describeMetadataResult.metadataObjects, function(type) {
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
};

DescribeRemote.prototype.fetchPersonAccountRecordTypes = function(cb) {
	var self = this;
	self.opts.progress && console.log(chalk.grey('RecordTypes of PersonAccount'));
	self._conn.query("SELECT DeveloperName, SobjectType, IsPersonType FROM RecordType WHERE SobjectType='Account' AND IsPersonType=True", function(err, result) {
		// ignore errors here since the query only succeeds when PersonAccounts are enabled
		if (err || !result.records) {
			return cb(null, []);
		}
		return cb(null, result.records);
	});
};

DescribeRemote.prototype.fetchFlowDefinitions = function(cb) {
	var self = this;
	self.opts.progress && console.log(chalk.grey('Active Flow versions'));
	self._conn.tooling.query("SELECT DeveloperName, ActiveVersion.VersionNumber FROM FlowDefinition", function(err, result) {
		// don't fail on error
		if (err) {
			self.warnings.push('Warning: ' + err);
			return cb(null, []);
		} else if (!result.records) {
			return cb(null, []);
		}
		return cb(null, result.records);
	});
};

DescribeRemote.prototype.collectWarnings = function(cb) {
	var self = this;
	return cb(null, self.warnings);
};

DescribeRemote.prototype.fetch = function(callback) {
	var self = this;
	self._conn.metadata.pollTimeout = config.pollTimeout;

	var fetchFunctions = {};
	if (self.opts.apiVersions) {
		fetchFunctions.apiVersions = self.fetchApiVersions.bind(self);
	}
	if (self.opts.describeMetadataResult) {
		fetchFunctions.describeMetadataResult = self.fetchDescribeMetadataResult.bind(self);
	}
	if (self.opts.fileProperties) {
		fetchFunctions.fileProperties = self.fetchFileProperties.bind(self);
	}
	if (self.opts.personAccountRecordTypes) {
		fetchFunctions.personAccountRecordTypes = self.fetchPersonAccountRecordTypes.bind(self);
	}
	if (self.opts.flowDefinitions) {
		fetchFunctions.flowDefinitions = self.fetchFlowDefinitions.bind(self);
	}
	fetchFunctions.warnings = self.collectWarnings.bind(self);

	async.series(fetchFunctions, callback);
};
