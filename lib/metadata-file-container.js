"use strict";

var _ = require('underscore');
var xmldoc = require('xmldoc');
var MetadataFile = require('./metadata-file');
var Manifest = require('./manifest');
var MetadataComponent = require('./metadata-component');
var MetadataUtils = require('./utils');
var describeMetadataService = new(require('./describe-metadata-service'))();

// TODO: this represents the child of a MetadataFileContainer
// though some components are not being listed in the manifest
var MetadataFileComponent = function(opts) {
	MetadataComponent.call(this, opts);
}

MetadataFileComponent.prototype = Object.create(MetadataComponent.prototype);
MetadataFileComponent.prototype.constructor = MetadataFileComponent;

var MetadataFileContainer = module.exports = function(opts) {
	MetadataFile.call(this, opts);
	this.components = [];
	this.parse();
};

MetadataFileContainer.prototype = Object.create(MetadataFile.prototype);
MetadataFileContainer.prototype.constructor = MetadataFileContainer;

MetadataFileContainer.prototype.diff = function(other) {
	var self = this;
	var added = new Manifest();
	var modified = new Manifest();
	var deleted = new Manifest();
	var isDeleted = other === undefined || other.isNull() || !other.path || other.path === '/dev/null';
	var isNew = self.path === undefined || self.isNull() || !self.path || self.path === '/dev/null';
	var componentFrom = self.getComponent();
	var componentTo = other.getComponent();
	if (isDeleted && componentFrom) {
		deleted.add(componentFrom);
	} else if (isNew && componentTo) {
		added.add(componentTo);
	} else {
		// modified
		// TODO: parse should not be necessary to call explicitly
		self.parse();
		other.parse();
		var filename = isDeleted ? self.path : other.path;
		var m1 = _.groupBy(self.components, 'type');
		Object.keys(m1).forEach(function(type) {
			m1[type] = _.indexBy(m1[type], 'fullName');
		});
		var m2 = _.groupBy(other.components, 'type');
		Object.keys(m2).forEach(function(type) {
			m2[type] = _.indexBy(m2[type], 'fullName');
		});
		var diffResult = MetadataFileContainer.diffMaps(m1, m2);

		diffResult.added.manifest().forEach(function(addedComponent) {
			added.add(new MetadataComponent({
				fullName: addedComponent.fullName,
				fileName: filename,
				type: addedComponent.type
			}));
		});
		diffResult.modified.manifest().forEach(function(modifiedComponent) {
			modified.add(new MetadataComponent({
				fullName: modifiedComponent.fullName,
				fileName: filename,
				type: modifiedComponent.type
			}));
		});
		diffResult.deleted.manifest().forEach(function(deletedComponent) {
			deleted.add(new MetadataComponent({
				fullName: deletedComponent.fullName,
				fileName: filename,
				type: deletedComponent.type
			}));
		});
	}
	return {
		added: added,
		modified: modified,
		deleted: deleted
	};
};

MetadataFileContainer.prototype.getManifest = function() {
	var self = this;
	var childManifest = new Manifest();
	self.components.forEach(function(component) {
		childManifest.add(component);
	});
	return childManifest;
};

MetadataFileContainer.prototype.parse = function() {
	var self = this;
	self.components = [];
	if (!self.contents || self.contents.length === 0) {
		return self;
	}
	var parsed = new xmldoc.XmlDocument(self.contents);
	var type = self.getMetadataType();
	var objectName = self.getComponent().fullName;
	if (type.childXmlNames) {
		type.childXmlNames.forEach(function(childXmlName) {
			var childType = describeMetadataService.getType(childXmlName);
			var childTypeName = childType.xmlName;
			parsed.childrenNamed(childType.tagName).forEach(function(field) {
				var childMember = field.childNamed(childType.key);
				if (childMember && childMember.val) {
					self.components.push(new MetadataFileComponent({
						fullName: childType.notCustomObjectRelated ? childMember.val : objectName + '.' + childMember.val,
						type: childTypeName,
						contents: "    " + field.toString({
							compressed: true,
							trimmed: false,
							preserveWhitespace: true
						}),
						parent: type
					}));
				}
			});
		});
	}
	return self;
};

MetadataFileContainer.prototype.addComponent = function(cmp) {
	var self = this;
	self.components.push(cmp);
	return self;
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

MetadataFileContainer.prototype.getGroupedAndSortedComponents = function() {
	var self = this;
	var map = _.groupBy(self.components, 'type');
	Object.keys(map).forEach(function(metadataType) {
		map[metadataType] = map[metadataType].sort(function(a, b) {
			return MetadataUtils.compareMetadataFullNames(a.fullName, b.fullName);
		});
	});
	return map;
};

MetadataFileContainer.prototype.writeContents = function() {
	var self = this;
	self.contents = new Buffer(self.toString());
	return self;
};

MetadataFileContainer.prototype.toString = function() {
	var self = this;
	var type = self.getMetadataType();
	var lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<' + type.xmlName + ' xmlns="http://soap.sforce.com/2006/04/metadata">'];
	var groupedComponents = self.getGroupedAndSortedComponents();
	_.keys(groupedComponents).sort(MetadataUtils.compareMetadataTypeNames).forEach(function(metadataType) {
		groupedComponents[metadataType].forEach(function(cmp) {
			lines.push(cmp.contents);
		});
	});
	lines.push("</" + type.xmlName + ">");
	lines.push("");
	return lines.join("\n");
};

// STATIC
MetadataFileContainer.diffMaps = function(mapA, mapB) {
	var diffResult = {
		added: new Manifest(),
		modified: new Manifest(),
		deleted: new Manifest()
	};
	Object.keys(mapB).forEach(function(type) {
		Object.keys(mapB[type]).forEach(function(member) {
			if (mapA[type] && mapA[type][member]) {
				// is not new
				if (!_.isEqual(mapA[type][member], mapB[type][member])) {
					// has changed
					diffResult.modified.add(mapB[type][member]);
				}
			} else {
				// is new
				diffResult.added.add(mapB[type][member]);
			}
		});
	});
	Object.keys(mapA).forEach(function(type) {
		Object.keys(mapA[type]).forEach(function(member) {
			if (!(mapB[type] && mapB[type][member])) {
				// is deleted
				diffResult.deleted.add(mapA[type][member]);
			}
		});
	});
	return diffResult;
};

// STATIC
var builtInProps = ['diff', 'getManifest', 'parse', 'addComponent', 'getGroupedAndSortedComponents', 'writeContents', 'toString', 'diffMaps'];

MetadataFileContainer.isCustomProp = function(name) {
	return MetadataFile.isCustomProp(name) && builtInProps.indexOf(name) === -1;
};
