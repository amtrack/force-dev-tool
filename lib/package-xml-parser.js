"use strict";

var xmldoc = require('xmldoc');
var MetadataComponent = require('./metadata-component');

var PackageXmlParser = module.exports = function(xmlString) {
	this.parsed = new xmldoc.XmlDocument(xmlString);
};

PackageXmlParser.prototype.getApiVersion = function() {
	var versions = this.parsed.childrenNamed('version');
	if (Array.isArray(versions) && versions.length) {
		return versions[0].val;
	}
	return null;
};

PackageXmlParser.prototype.getComponents = function() {
	var self = this;
	var components = [];
	self.parsed.childrenNamed('types').forEach(function(metadataTypes) {
		var metadataType = metadataTypes.childrenNamed('name')[0].val;
		metadataTypes.childrenNamed('members').forEach(function(member) {
			components.push(
				new MetadataComponent({
					type: metadataType,
					fullName: member.val
				})
			);
		});
	});
	return components;
};
