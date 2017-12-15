"use strict";

var File = require('vinyl');
var path = require('path');
var metadataUtils = require('./utils');
var Manifest = require('./manifest');
var MetadataComponent = require('./metadata-component');
var describeMetadataService = new(require('./describe-metadata-service'))();

/**
 * MetadataFile represents a file on the filesystem.
 * It inherits from vinyl.
 * Note that the path should be relative to `src`.
 */

var MetadataFile = module.exports = function(opts) {
	File.call(this, opts);
};

MetadataFile.prototype = Object.create(File.prototype);
MetadataFile.prototype.constructor = MetadataFile;

MetadataFile.prototype.basenameDirname = function() {
	var self = this;
	return path.basename(path.dirname(self.path));
};

MetadataFile.prototype.parentDirname = function() {
	var self = this;
	return path.dirname(path.dirname(self.path)) !== '.' ? path.basename(path.dirname(path.dirname(self.path))) : null;
};

MetadataFile.prototype.extnameWithoutDot = function() {
	var self = this;
	return path.basename(self.path).indexOf('.') === 0 ? path.basename(self.path).replace('.', '') : path.extname(self.path).replace('.', '');
};

MetadataFile.prototype.filename = function() {
	var self = this;
	return path.basename(self.path).replace(path.extname(self.path), '');
};

MetadataFile.prototype.diff = function(other) {
	var self = this;
	var added = new Manifest();
	var modified = new Manifest();
	var deleted = new Manifest();
	var isDeleted = other === undefined || other.isNull() || !other.path || other.path === '/dev/null';
	var isNew = self.path === undefined || self.isNull() || !self.path || self.path === '/dev/null';
	var isModified = !self.isNull() && !other.isNull() && self.path === other.path;
	var componentFrom = self.getComponent();
	var componentTo = other.getComponent();
	if (isDeleted && componentFrom) {
		deleted.add(componentFrom);
	} else if (isNew && componentTo) {
		added.add(componentTo);
	} else if (isModified && componentTo) {
		modified.add(componentTo);
	}
	return {
		added: added,
		modified: modified,
		deleted: deleted
	};
};

MetadataFile.prototype.getMetadataFilename = function() {
	var self = this;
	var metadataFilepath = self.path;
	if (!metadataUtils.isValidFilename(metadataFilepath) && !metadataUtils.isValidMetaFilename(metadataFilepath)) {
		return null;
	}
	if (metadataUtils.isValidMetaFilename(metadataFilepath)) {
		return metadataUtils.getMetadataFilenameForMetaFilename(metadataFilepath);
	}
	return metadataFilepath;
};

MetadataFile.prototype.getMetadataType = function() {
	var self = this;
	var metadataFilename = self.getMetadataFilename();
	return metadataFilename ? describeMetadataService.getTypeForFilepath(metadataFilename) : null;
};

MetadataFile.prototype.getComponent = function() {
	var self = this;
	var metadataFile = new MetadataFile({
		path: self.getMetadataFilename() // in case it was a -meta.xml
	});
	var metadataType = metadataFile.getMetadataType();
	if (!metadataType) {
		return null;
	}
	var result = {
		type: metadataType.xmlName,
		fileName: path.join(metadataType.directoryName, metadataFile.basename),
		fullName: metadataFile.filename()
	};
	if (metadataType.directoryName === 'aura') {
		if (!metadataFile.extnameWithoutDot()) {
			result.fileName = path.join(metadataType.directoryName, metadataFile.basename);
			result.fullName = metadataFile.basename;
		} else {
			result.fileName = path.join(metadataType.directoryName, metadataFile.basenameDirname());
			result.fullName = metadataFile.basenameDirname();
		}
	} else if (metadataType.inFolder) {
		var fileNameParts = [metadataFile.basename];
		var fullNameParts = [metadataType.xmlName === 'Document' ? metadataFile.basename : metadataFile.filename()];
		if (metadataFile.parentDirname() && metadataFile.parentDirname() !== '..') {
			// not a Folder, then prepend folder name
			fileNameParts.unshift(metadataFile.basenameDirname());
			fullNameParts.unshift(metadataFile.basenameDirname());
		}
		var fileNamePartsPath = path.join.apply('', fileNameParts);
		result.fileName = path.join(metadataType.directoryName, fileNamePartsPath);
		result.fullName = fullNameParts.join('/');
	}
	return new MetadataComponent(result);
};

// STATIC
var builtInProps = ['basenameDirname', 'parentDirname', 'extnameWithoutDot', 'filename', 'diff', 'getMetadataFilename', 'getMetadataType', 'getComponent'];

MetadataFile.isCustomProp = function(name) {
	return File.isCustomProp(name) && builtInProps.indexOf(name) === -1;
};
