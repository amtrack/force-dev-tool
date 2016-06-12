"use strict";

var path = require('path');
var describeMetadataService = new(require('./describe-metadata-service'))();

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
