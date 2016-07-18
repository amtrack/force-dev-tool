"use strict";

var _ = require('underscore');
var MetadataUtils = require('./utils');

var PackageXmlWriter = module.exports = function(manifest) {
	this.manifest = manifest;
};

PackageXmlWriter.prototype.toString = function() {
	var self = this;
	var groupedAndSortedComponents = self.manifest.getGroupedAndSortedComponents();
	var lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<Package xmlns="http://soap.sforce.com/2006/04/metadata">'];
	_.keys(groupedAndSortedComponents).sort(MetadataUtils.compareMetadataTypeNames).forEach(function(metadataType) {
		var members = groupedAndSortedComponents[metadataType];
		lines.push("    <types>");
		members.forEach(function(member) {
			lines.push("        <members>" + member.fullName + "</members>");
		});
		lines.push("        <name>" + metadataType + "</name>");
		lines.push("    </types>");
	});
	if (self.manifest.apiVersion) {
		lines.push("    <version>" + self.manifest.apiVersion + "</version>");
	}
	lines.push("</Package>");
	lines.push("");
	return lines.join("\n");
};
