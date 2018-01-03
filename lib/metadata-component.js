"use strict";

var describeMetadataService = new(require('./describe-metadata-service'))();
var metadataUtils = require('./utils');
var path = require('path');
var _ = require('underscore');

var config = new(require("./config"))();
var folderToMetadataType = config.get("folderBasedMetadataMap");
var metadataTypeToFolder = _.invert(folderToMetadataType);

/**
 * MetadataComponent is a wrapper for a metadata component with its content
 * and referring to a MetadataFile.
 */
var MetadataComponent = module.exports = function(opts) {
	var self = this;
	opts = opts ? opts : {};
	if (typeof opts === 'string') {
		opts = {
			expression: opts
		};
	}
	if (opts.expression) {
		var parts = opts.expression.split('/');
		if (parts.length < 2) {
			// TODO: maybe throw an exception
			return null;
		}
		var firstPartType = describeMetadataService.getType(parts[0]);
		if (firstPartType && parts.length >= 2) {
			self.type = firstPartType.xmlName;
			self.fileName = path.join(firstPartType.directoryName, parts[1] + (firstPartType.suffix ? '.' + firstPartType.suffix : ''));
			self.fullName = parts[1];
			if (firstPartType.tagName === 'labels') {
				self.fileName = path.join('labels', 'CustomLabels.labels');
			} else if (firstPartType.tagName) {
				// This is a child type of CustomObject
				self.fileName = path.join(firstPartType.directoryName, parts[1].split('.')[0] + (firstPartType.suffix ? '.' + firstPartType.suffix : ''));
				self.fullName = parts[1];
			} else if (firstPartType.directoryName === 'aura') {
				self.fileName = path.join(firstPartType.directoryName, parts[1].split('.')[0]);
				self.fullName = parts[1].split('.')[0];
			} else if (firstPartType.inFolder) {
				var basename = parts[parts.length - 1];
				var filename = metadataUtils.getFileNameWithoutExtension(basename);
				var filenameParts = [firstPartType.directoryName, parts[1]];
				var fullNameParts = [parts[1]];
				if (parts[2]) {
					// not a Folder
					filenameParts.push(parts[2] + (firstPartType.xmlName === 'Document' ? '' : '.' + firstPartType.suffix));
					fullNameParts.push(firstPartType.xmlName === 'Document' ? basename : filename);
				} else {
					// return the folder type
					self.type = metadataTypeToFolder[self.type];
				}
				self.fileName = path.join.apply('', filenameParts);
				self.fullName = fullNameParts.join('/');
			}
		}
	} else {
		self.fileName = opts.fileName;
		self.fullName = opts.fullName;
		self.type = opts.type;
		if (opts.contents) {
			self.contents = opts.contents;
		}
	}
};

MetadataComponent.prototype.getMetadataType = function() {
	var self = this;
	return describeMetadataService.getType(self.type);
};

MetadataComponent.prototype.toString = function() {
	var self = this;
	return self.type + '/' + self.fullName;
};
