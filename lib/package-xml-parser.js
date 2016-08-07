"use strict";

var xmldoc = require('xmldoc');
var MetadataComponent = require('./metadata-component');

var PackageXmlParser = module.exports = function(xmlString) {
	this.parsed = new xmldoc.XmlDocument(xmlString);
};

PackageXmlParser.prototype.getApiVersion = function() {
	var versionChild = this.parsed.childNamed('version');
	if (versionChild) {
		return versionChild.val;
	} else {
		// package.xml does not necessarily have a version
		return null;
	}
};

PackageXmlParser.prototype.getComponents = function() {
	var self = this;
	var components = [];
	self.parsed.childrenNamed('types').forEach(function(metadataTypes) {
		var metadataTypeChild = metadataTypes.childNamed('name');
		if (metadataTypeChild) {
			metadataTypes.childrenNamed('members').forEach(function(member) {
				components.push(
					new MetadataComponent({
						type: metadataTypeChild.val,
						fullName: member.val
					})
				);
			});
		} else {
			throw new Error('Missing `name` child');
		}
	});
	return components;
};
