"use strict";

var async = require('async');
var _ = require('underscore');
var config = new(require('./config'))();

var DescribeRemote = module.exports = function(conn) {
	this._conn = conn;
};

DescribeRemote.prototype.constructor = DescribeRemote;

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

/**
 * Retrieve FileProperties[] for all MetadataComponents in two steps.
 * First list folders, then list all MetadataComponents including those in folders.
 * @return {FileProperties[]}
 */
DescribeRemote.prototype.fetch = function(callback) {
	var self = this;
	self._conn.metadata.pollTimeout = config.pollTimeout;
	var types = [];
	var manifest = [];
	var warnings = [];
	async.series({
			describeMetadataResult: function(cb) {
				self._conn.metadata.describe(function(describeErr, result) {
					if (describeErr) {
						return cb(describeErr);
					}
					types = result;
					cb(null, result);
				});
			},
			manifest: function(cb) {
				var metadataTypeNames = _.pluck(types.metadataObjects, 'xmlName');
				var childXmlNames = _.pluck(_.filter(types.metadataObjects, function(type) {
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
						manifest = [].concat(foldersManifestJSON, manifestJSON);
						cb(null, manifest);
					});
				});
			},
			warnings: function(cb) {
				manifest.forEach(function(component) {
					if (component.type === 'QuickAction' && new RegExp('^09D26.*').test(component.id)) {
						warnings.push('Warning: Found non-global QuickAction: ' + component.fullName);
					}
					if (component.type === 'Flow' && !new RegExp('^.*-[0-9]+$').test(component.fullName)) {
						warnings.push('Warning: Found non-versioned Flow: ' + component.fullName);
					}
				});
				cb(null, warnings);
			}
		},
		callback
	);
};
