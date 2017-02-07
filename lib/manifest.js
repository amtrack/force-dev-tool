"use strict";

var _ = require('underscore');
var multimatch = require('multimatch');
var config = new(require('./config'))();
var PackageXmlParser = require('./package-xml-parser');
var PackageXmlWriter = require('./package-xml-writer');
var FetchResultParser = require('./fetch-result-parser');
var MetadataUtils = require('./utils');

var folderBasedMetadataMap = config.get('folderBasedMetadataMap');

/**
 * Manifest represents the information of a package.xml.
 */
// TODO: inherit from array
var Manifest = module.exports = function(opts) {
	var self = this;
	opts = opts ? opts : {};
	self.apiVersion = opts.apiVersion || config.get('apiVersion');
	self.manifestJSON = opts.manifestJSON || []; // TODO: rename to components or something like this
	self.unique();
};

module.exports.fromPackageXml = function(xmlString) {
	var packageXml = new PackageXmlParser(xmlString);
	return new Manifest({
		manifestJSON: packageXml.getComponents(),
		apiVersion: packageXml.getApiVersion()
	});
};

module.exports.fromFetchResult = function(resultJSON) {
	var fetchResult = new FetchResultParser(resultJSON);
	return new Manifest({
		manifestJSON: fetchResult.getComponents(),
		apiVersion: fetchResult.getApiVersion()
	});
};

Manifest.prototype.toPackageXml = function(destructive) {
	var self = this;
	if (destructive) {
		self.apiVersion = null;
	}
	return new PackageXmlWriter(self).toString();
};

Manifest.prototype.manifest = function() {
	return this.manifestJSON;
};

Manifest.prototype.add = function(component) {
	var self = this;
	if (!_.findWhere(self.manifestJSON, {
			type: component.type,
			fullName: component.fullName
		})) {
		self.manifestJSON.push(component);
	}
	return self;
};

Manifest.prototype.remove = function(expressions) {
	var self = this;
	self.getNotIgnoredMatches(expressions);
	return self;
};

Manifest.prototype.merge = function(other) {
	var self = this;
	other.manifest().forEach(function(component) {
		self.add(component);
	});
	return self;
};

Manifest.prototype.filterTypes = function(types) {
	var self = this;
	self.manifestJSON = _.filter(self.manifestJSON, function(item) {
		return types.indexOf(item.type) !== -1;
	});
	return self;
};

Manifest.prototype.rollup = function() {
	var self = this;
	self.manifestJSON = self.manifestJSON.map(function(item) {
		var metadataType = item.getMetadataType();
		if (metadataType.parent && typeof metadataType.isNamed === 'boolean' && metadataType.isNamed === false) {
			item.fullName = item.fullName.split('.')[0];
			item.type = metadataType.parent
		}
		return item;
	});
	return self.unique();
};

Manifest.prototype.filterUnnamed = function() {
	var self = this;
	self.manifestJSON = _.filter(self.manifestJSON, function(item) {
		var metadataType = item.getMetadataType();
		return !(metadataType.parent && typeof metadataType.isNamed === 'boolean' && metadataType.isNamed === false);
	});
	return self;
};

Manifest.prototype.unique = function() {
	var self = this;
	self.manifestJSON = _.unique(self.manifestJSON, function(item) {
		// use type + fullName as attribute for comparison
		return item.type + item.fullName;
	});
	return self;
}

// TODO: in order to factory reset, the following metadata has to be disabled manually:
// * ApprovalProcess
// * WorkflowRule?
// * Flow (via Process Builder)
Manifest.prototype.filterStandard = function() {
	var self = this;
	var folderTypes = [];
	Object.keys(folderBasedMetadataMap).forEach(function(key) {
		folderTypes.push(key);
		folderTypes.push(folderBasedMetadataMap[key]);
	});
	self.manifestJSON = _.filter(self.manifestJSON, function(component) {
		if (['AppMenu', 'AuraDefinitionBundle', 'Community', 'Layout', 'ListView', 'Profile', 'RecordType', 'Role', 'WebLink', 'Workflow'].indexOf(component.type) >= 0) {
			// delete() not supported for AppMenu
			// cannot delete profile
			// Cannot delete a workflow object; Workflow Rules and Actions must be deleted individually
			// Cannot delete the only layout
			// Cannot delete record type through API
			// invalid parameter value
			// Keeping AuraDefinitionBundle should not cause trouble
			// Deleting ListViews may cause 'cannot delete last filter' error on deletion. keeping them shouldn't cause trouble
			// WebLinks are referenced in Layouts and cannot be deleted without removing from the Layout
			// Roles are connected to users, we do not intend to touch that.
			// (CustomApps may be set as default in Profiles which we don't want to touch)
			return false;
		}
		if (['CustomObject', 'SharingRules', 'CustomObjectTranslation', 'EscalationRules', 'AutoResponseRules', 'AssignmentRules'].indexOf(component.type) >= 0 && !new RegExp('^.*__c$').test(component.fullName)) {
			// ... is standard and cannot be deleted
			return false;
		}
		if (['Dashboard', 'Document', 'EmailTemplate', 'Report'].indexOf(component.type) >= 0 && !new RegExp('^.*/.*$').test(component.fullName)) {
			// don't list folders
			return false;
		}
		if (['MatchingRule'].indexOf(component.type) >= 0 && new RegExp('^.*\.Standard_.*$').test(component.fullName)) {
			// Standard matching rules can't be edited or deleted.
			return false;
		}
		if (['CustomApplication'].indexOf(component.type) >= 0 && new RegExp('^standard__.*$').test(component.fullName)) {
			// ... is standard and cannot be deleted
			return false;
		}
		return true;
	});
	return self;
};

Manifest.prototype.getGroupedAndSortedComponents = function() {
	var self = this;
	var map = _.groupBy(self.manifestJSON, 'type');
	Object.keys(map).forEach(function(metadataType) {
		map[metadataType] = map[metadataType].sort(function(a, b) {
			return MetadataUtils.compareMetadataFullNames(a.fullName, b.fullName);
		});
	});
	return map;
};

Manifest.prototype.getJSON = function() {
	var self = this;
	var types = [];
	var groupedMetadata = self.getGroupedAndSortedComponents();
	_.keys(groupedMetadata).sort(MetadataUtils.compareMetadataTypeNames).forEach(function(metadataType) {
		if (groupedMetadata[metadataType].length > 0) {
			types.push({
				members: _.pluck(groupedMetadata[metadataType], 'fullName'),
				name: [metadataType]
			});
		}
	});
	return {
		types: types,
		version: [self.apiVersion]
	};
};

Manifest.prototype.getMetadataTypes = function() {
	var self = this;
	return _.uniq(_.pluck(self.manifestJSON, 'type').sort(MetadataUtils.compareMetadataTypeNames), true);
};

Manifest.prototype.getFileNames = function() {
	var self = this;
	return _.uniq(_.pluck(self.manifestJSON, 'fileName').sort(MetadataUtils.compareMetadataFileNames), true);
};

Manifest.prototype.getComponentNames = function() {
	var self = this;
	var componentNames = _.map(self.manifestJSON, function(metadataComponent) {
		return metadataComponent.type + '/' + metadataComponent.fullName;
	});
	return _.uniq(componentNames.sort(MetadataUtils.compareMetadataFullNames), true);
};

Manifest.prototype.getMatches = function(matchPatterns) {
	var self = this;
	self.manifestJSON = _.filter(self.manifestJSON, function(metadataComponent) {
		return multimatch([metadataComponent.type + '/' + metadataComponent.fullName], matchPatterns).length > 0;
	});
	return self;
};

Manifest.prototype.getNotIgnoredMatches = function(ignorePatterns) {
	var self = this;
	var matches = _.filter(self.manifestJSON, function(metadataComponent) {
		return multimatch([metadataComponent.type + '/' + metadataComponent.fullName], ignorePatterns).length > 0;
	});
	// self.manifestJSON = _.without(self.manifestJSON, ...matches);
	self.manifestJSON = _.without.apply(_, [self.manifestJSON].concat(matches));
	return self;
};
