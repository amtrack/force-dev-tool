"use strict";

var _ = require('underscore');
var MetadataUtils = require('./utils');
var MetadataWriter = require('./metadata-writer');

var PackageXmlWriter = module.exports = function(manifest) {
	this.manifest = manifest;
};

PackageXmlWriter.prototype.toString = function() {
	var self = this;
	var packageJson = {
		types: []
	};
	if (self.manifest.apiVersion) {
		packageJson.version = self.manifest.apiVersion;
	}
	var groupedAndSortedComponents = self.manifest.getGroupedAndSortedComponents();
	_.keys(groupedAndSortedComponents).sort(MetadataUtils.compareMetadataTypeNames).forEach(function(metadataType) {
		var members = _.pluck(groupedAndSortedComponents[metadataType], 'fullName');
		packageJson.types.push({
			members: members,
			name: metadataType
		});
	});
	var writer = new MetadataWriter('Package', packageJson);
	return writer.toString();
};
