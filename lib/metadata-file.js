"use strict";

var File = require('vinyl');
var path = require('path');
var _ = require('underscore');
var xmldoc = require('xmldoc');
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
	var manifest = new Manifest();
	var destructiveManifest = new Manifest();
	var deleted = other === undefined || other.isNull() || !other.path || other.path === '/dev/null';
	var added = self.path === undefined || self.isNull() || !self.path || self.path === '/dev/null';
	var modified = !self.isNull() && !other.isNull() && self.path === other.path;
	var componentFrom = self.getComponent();
	var componentTo = other.getComponent();
	var isContainerFile = false;
	if (componentFrom && componentFrom.type) {
		var type = describeMetadataService.getType(componentFrom.type);
		if (type && type.childXmlNames) {
			isContainerFile = true;
		}
	}
	if (deleted && componentFrom) {
		destructiveManifest.add(componentFrom);
	} else if (added && componentTo) {
		manifest.add(componentTo);
	} else if (modified && componentTo && !isContainerFile) {
		manifest.add(componentTo);
	}

	if (isContainerFile) {
		var filename = deleted ? self.path : other.path;
		var diffResult = MetadataFile.diffMaps(self.getComponents(), other.getComponents());
		var objectName = metadataUtils.getFileNameWithoutExtension(filename);
		diffResult.added.forEach(function(addedComponent) {
			var childComponentAdded = new MetadataComponent([
				[addedComponent.split('.')[0], objectName].join('/'), addedComponent.split('.')[1]
			].join('.'));
			if (objectName === 'CustomLabels') {
				childComponentAdded = new MetadataComponent(addedComponent.split('.').join('/'));
			}
			if (childComponentAdded) {
				manifest.add(childComponentAdded);
			}
		});
		diffResult.removed.forEach(function(removedComponent) {
			var childComponentRemoved = new MetadataComponent([
				[removedComponent.split('.')[0], objectName].join('/'), removedComponent.split('.')[1]
			].join('.'));
			if (objectName === 'CustomLabels') {
				childComponentRemoved = new MetadataComponent(removedComponent.split('.').join('/'));
			}
			if (childComponentRemoved) {
				destructiveManifest.add(childComponentRemoved);
			}
		});
	}
	return {
		manifest: manifest,
		destructiveManifest: destructiveManifest
	};
};

MetadataFile.prototype.getComponent = function() {
	var self = this;
	var metadataFilepath = self.path;
	if (metadataUtils.isValidMetaFilename(metadataFilepath)) {
		metadataFilepath = metadataUtils.getMetadataFilenameForMetaFilename(metadataFilepath);
	}
	if (!metadataUtils.isValidFilename(metadataFilepath) && !metadataUtils.isValidMetaFilename(metadataFilepath)) {
		return null;
	}
	var metadataType = describeMetadataService.getTypeForFilepath(metadataFilepath);
	var metadataFile = new MetadataFile({
		path: metadataFilepath
	}); // in case it was a -meta.xml
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
		if (metadataFile.parentDirname()) {
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

MetadataFile.prototype.getComponents = function() {
	var self = this;
	var components = {};
	if (!self.contents) {
		return components;
	}
	var parsed = new xmldoc.XmlDocument(self.contents);
	var containerComponent = self.getComponent();
	var type = describeMetadataService.getType(containerComponent.type);
	if (type.childXmlNames) {
		type.childXmlNames.forEach(function(childXmlName) {
			var childComponent = describeMetadataService.getType(childXmlName);
			var childTypeName = childComponent.xmlName;
			var tagName = childComponent.tagName;
			parsed.childrenNamed(tagName).forEach(function(field) {
				if (!components[childTypeName]) {
					components[childTypeName] = {};
				}
				var childMemberName = field.children[0].val;
				components[childTypeName][childMemberName] = field.toStringWithIndent("    ");
			});
		});
	}
	return components;
};

// STATIC

MetadataFile.diffMaps = function(mapA, mapB) {
	var diffResult = {
		added: [],
		removed: []
	};
	Object.keys(mapB).forEach(function(type) {
		Object.keys(mapB[type]).forEach(function(member) {
			var componentFullName = [type, member].join('.');
			if (mapA[type] && mapA[type][member]) {
				// is not new
				if (!_.isEqual(mapA[type][member], mapB[type][member])) {
					// has changed
					diffResult.added = diffResult.added.concat(componentFullName);
				}
			} else {
				// is new
				diffResult.added = diffResult.added.concat(componentFullName);
			}
		});
	});
	Object.keys(mapA).forEach(function(type) {
		Object.keys(mapA[type]).forEach(function(member) {
			var componentFullName = [type, member].join('.');
			if (!(mapB[type] && mapB[type][member])) {
				// is deleted
				diffResult.removed = diffResult.removed.concat(componentFullName);
			}
		});
	});
	return diffResult;
};
