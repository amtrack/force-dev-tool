"use strict";

var path = require('path');
var _ = require('underscore');
var describeMetadataService = new(require('./describe-metadata-service'))();

exports.ensureArray = function(objectOrArray) {
	if (!objectOrArray) {
		return [];
	}
	return _.isArray(objectOrArray) ? objectOrArray : [objectOrArray];
};

exports.getFileNameWithoutExtension = function(filename) {
	return path.basename(filename).replace(path.extname(filename), '');
};

exports.getFileExtension = function(filename) {
	filename = filename || "";
	if (path.basename(filename).indexOf('.') === 0) {
		return path.basename(filename).replace('.', '');
	}
	return path.extname(filename).replace('.', '');
};

exports.isValidFilename = function(filename) {
	if (filename === undefined || filename === null || filename === '' || filename === '/dev/null') {
		return false;
	}
	if (path.basename(filename).match(/.*-meta\.xml$/)) {
		return false;
	}
	// walk up and see if directory name matches a known type
	var dirname = path.dirname(filename);
	while (dirname && dirname !== '.') {
		var matchedTypes = describeMetadataService.getTypesForDirectoryName(path.basename(dirname));
		if (matchedTypes && matchedTypes.length) {
			return true;
		}
		dirname = path.dirname(dirname);
	}
	return false;
};

exports.isValidMetaFilename = function(filename) {
	var self = this;
	if (filename === undefined || filename === null || filename === '' || filename === '/dev/null') {
		return false;
	}
	var metadataFilename = self.getMetadataFilenameForMetaFilename(filename);
	return self.getFileExtension(filename) === 'xml' && self.isValidFilename(metadataFilename);
};

exports.getMetadataFilenameForMetaFilename = function(metaFilename) {
	return metaFilename.replace('-meta.xml', '');
};

// always put Setings at the end
// otherwise alphanumeric
exports.compareMetadataTypeNames = function(a, b) {
	if (a === 'Settings' && b !== 'Settings') {
		return 1;
	}
	if (a !== 'Settings' && b === 'Settings') {
		return -1;
	}
	if (a < b) {
		return -1;
	}
	if (a > b) {
		return 1;
	}
	return 0;
};

// alphanumeric
exports.compareMetadataFileNames = function(a, b) {
	if (a < b) {
		return -1;
	}
	if (a > b) {
		return 1;
	}
	return 0;
};

// alphanumeric
exports.compareMetadataFullNames = function(a, b) {
	if (a < b) {
		return -1;
	}
	if (a > b) {
		return 1;
	}
	return 0;
};
