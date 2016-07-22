"use strict";

var _ = require('underscore');
var path = require('path');

var xmlNameToTagName = {
	'ActionOverride': 'actionOverrides',
	'CustomField': 'fields',
	'BusinessProcess': 'businessProcesses',
	'CompactLayout': 'compactLayouts',
	'RecordType': 'recordTypes',
	'WebLink': 'webLinks',
	'ValidationRule': 'validationRules',
	'SharingReason': 'sharingReasons',
	'ListView': 'listViews',
	'FieldSet': 'fieldSets',
	'WorkflowFieldUpdate': 'fieldUpdates',
	'WorkflowFlowAction': 'flowActions',
	'WorkflowTask': 'tasks',
	'WorkflowAlert': 'alerts',
	'WorkflowOutboundMessage': 'outboundMessages',
	'WorkflowRule': 'rules',
	'CustomLabel': 'labels'
};

var DescribeMetadataService = module.exports = function(describeMetadataResult) {
	var self = this;
	self.describeMetadataResult = describeMetadataResult ? describeMetadataResult : require('./describe-metadata-result.json');
	self.metadataObjectsExtended = [];
	// TODO: how to get describe information for child metadata types?
	self.describeMetadataResult.metadataObjects.forEach(function(metadataObject) {
		if (metadataObject.childXmlNames) {
			metadataObject.childXmlNames.forEach(function(childXmlName) {
				var childMetadataType = {
					directoryName: metadataObject.directoryName,
					inFolder: metadataObject.inFolder,
					metaFile: metadataObject.metaFile,
					xmlName: childXmlName
				};
				childMetadataType.tagName = xmlNameToTagName[childXmlName];
				if (metadataObject.suffix) {
					childMetadataType.suffix = metadataObject.suffix;
				}
				self.metadataObjectsExtended.push(childMetadataType);
			});
		}
		self.metadataObjectsExtended.push(metadataObject);
	});
};

DescribeMetadataService.prototype.getTypes = function() {
	var self = this;
	return self.metadataObjectsExtended;
};

DescribeMetadataService.prototype.getType = function(xmlName) {
	var self = this;
	return _.findWhere(self.metadataObjectsExtended, {
		xmlName: xmlName
	});
};

DescribeMetadataService.prototype.getTypeNames = function() {
	var self = this;
	return _.pluck(self.metadataObjectsExtended, 'xmlName');
};

DescribeMetadataService.prototype.getDirectoryNames = function() {
	var self = this;
	return _.unique(_.pluck(self.metadataObjectsExtended, 'directoryName'));
};

DescribeMetadataService.prototype.getTypesForDirectoryName = function(directoryName) {
	var self = this;
	return _.where(self.metadataObjectsExtended, {
		directoryName: directoryName
	});
};

DescribeMetadataService.prototype.getTypeForFilepath = function(filepath) {
	var self = this;
	var directoryName = path.basename(path.dirname(filepath));
	var parentDirectoryName = path.basename(path.dirname(path.dirname(filepath)));
	var extname = path.extname(filepath).split('.')[1];
	if (!extname) {
		extname = '';
	}
	var directoryMatches = self.getTypesForDirectoryName(directoryName);
	var parentDirectoryMatches = self.getTypesForDirectoryName(parentDirectoryName);
	var matches = _.unique([].concat(directoryMatches, parentDirectoryMatches));
	if (matches.length > 1) {
		// find the container metadata type
		return _.find(matches, function(item) {
			return item.childXmlNames;
		});
	} else {
		return matches[0];
	}
};
