"use strict";

var _ = require('underscore');
var xmldoc = require('xmldoc');
var MetadataFile = require('./metadata-file');
var Manifest = require('./manifest');
var MetadataComponent = require('./metadata-component');
var metadataUtils = require('./utils');
var describeMetadataService = new(require('./describe-metadata-service'))();

var MetadataFileContainer = module.exports = function(opts) {
	MetadataFile.call(this, opts);
};

MetadataFileContainer.prototype = Object.create(MetadataFile.prototype);
MetadataFileContainer.prototype.constructor = MetadataFileContainer;

MetadataFileContainer.prototype.diff = function(other) {
	var self = this;
	var manifest = new Manifest();
	var destructiveManifest = new Manifest();
	var deleted = other === undefined || other.isNull() || !other.path || other.path === '/dev/null';
	var added = self.path === undefined || self.isNull() || !self.path || self.path === '/dev/null';
	var componentFrom = self.getComponent();
	var componentTo = other.getComponent();
	if (deleted && componentFrom) {
		destructiveManifest.add(componentFrom);
	} else if (added && componentTo) {
		manifest.add(componentTo);
	} else {
		var filename = deleted ? self.path : other.path;
		var diffResult = MetadataFileContainer.diffMaps(self.getComponents(), other.getComponents());
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

MetadataFileContainer.prototype.getManifest = function() {
	var self = this;
	var childManifest = new Manifest();
	var childComponents = self.getComponents();
	if (childComponents) {
		Object.keys(childComponents).forEach(function(childType) {
			Object.keys(childComponents[childType]).forEach(function(childMember) {
				childManifest.add(childType + "/" + childMember);
			});
		});
	}
	return childManifest;
};

MetadataFileContainer.prototype.getComponents = function() {
	var self = this;
	var components = {};
	if (!self.contents) {
		return components;
	}
	var parsed = new xmldoc.XmlDocument(self.contents);
	var type = self.getMetadataType();
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

MetadataFileContainer.prototype.addComponent = function(cmp) {
	var self = this;
	if (!self.components) {
		self.components = [];
	}
	self.components.push(cmp);
}

// MetadataFileContainer.prototype.filter = function(manifest) {
// 	var self = this;
// 	var filteredMetadataFileContainer = new MetadataFileContainer({
// 		path: self.path
// 	});
// 	manifest.getComponentNames().forEach(function(cmpName){

// 	});
// 	return filteredMetadataFileContainer;
// };

MetadataFileContainer.prototype.toString = function() {
	var self = this;
	var type = self.getMetadataType();
	var lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<' + type.xmlName + ' xmlns="http://soap.sforce.com/2006/04/metadata">'];
	self.components.forEach(function(cmp) {
		lines.push(cmp);
	});
	lines.push("</" + type.xmlName + ">");
	lines.push("");
	return lines.join("\n");
};

// STATIC
MetadataFileContainer.diffMaps = function(mapA, mapB) {
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

// STATIC
var builtInProps = ['diff', 'getManifest', 'getComponents', 'addComponent', 'toString', 'diffMaps'];

MetadataFileContainer.isCustomProp = function(name) {
	return MetadataFile.isCustomProp(name) && builtInProps.indexOf(name) === -1;
};
