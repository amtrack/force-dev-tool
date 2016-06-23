"use strict";

var _ = require('underscore');
var multimatch = require('multimatch');
var config = new(require('./config'))();
var PackageXmlParser = require('./package-xml-parser');
var PackageXmlWriter = require('./package-xml-writer');

var folderBasedMetadataMap = config.get('folderBasedMetadataMap');

/**
 * Manifest represents the information of a package.xml.
 */
// TODO: inherit from array
var Manifest = module.exports = function(opts) {
	var self = this;
	opts = opts ? opts : {};
	self.apiVersion = opts.apiVersion || config.get('apiVersion');
	self.manifestJSON = []; // TODO: rename to components or something like this
	if (opts.manifestJSON) {
		self.manifestJSON = _.unique(opts.manifestJSON, function(item) {
			// use type + fullName as attribute for comparison
			return item.type + item.fullName;
		});
	}
};

module.exports.fromPackageXml = function(xmlString) {
	var packageXml = new PackageXmlParser(xmlString);
	return new Manifest({
		manifestJSON: packageXml.getComponents(),
		apiVersion: packageXml.getApiVersion()
	});
};

Manifest.prototype.toPackageXml = function(destructive) {
	var self = this;
	self.manifestJSON = self.transform();
	self.manifestJSON = self.filterInvalid();
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
};

Manifest.prototype.merge = function(other) {
	var self = this;
	other.manifest().forEach(function(component) {
		self.add(component);
	});
};

Manifest.prototype.filterTypes = function(types) {
	var self = this;
	return _.filter(self.transform(), function(item) {
		return types.indexOf(item.type) !== -1;
	});
};

// filter invalid components for now
Manifest.prototype.filterInvalid = function() {
	var self = this;
	var folderTypes = [];
	Object.keys(folderBasedMetadataMap).forEach(function(key) {
		folderTypes.push(key);
		folderTypes.push(folderBasedMetadataMap[key]);
	});
	return _.filter(self.manifestJSON, function(component) {
		if (component.type === 'QuickAction' && new RegExp('^09D26.*').test(component.id)) {
			console.error('Warning: Skipped non-global QuickAction: ' + component.fullName);
			return false;
		} else if (component.type === 'Flow' && !new RegExp('^.*-[0-9]+$').test(component.fullName)) {
			console.error('Warning: Skipped non-versioned Flow: ' + component.fullName);
			return false;
		} else if (folderTypes.indexOf(component.type) > -1 && component.fullName === 'unfiled$public') {
			// console.error('Warning: Skipped standard ' + component.type + ': ' + component.fullName);
			return false;
		}
		return true;
	});
};

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
	return _.filter(self.manifestJSON, function(component) {
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
};

Manifest.prototype.transform = function() {
	var self = this;
	return self.manifestJSON.map(function(item) {
		if (Object.keys(folderBasedMetadataMap).indexOf(item.type) > -1) {
			// DocumentFolder has to be listed as Document
			item.type = folderBasedMetadataMap[item.type];
		} else if (item.type === 'Flow' && !new RegExp('^.*-[0-9]+$').test(item.fullName)) {
			// postfix '-10' resolves to current active version
			// TODO: the active version does not have a postfix
			item.fullName = item.fullName + '-10';
		}
		return item;
	});
};

Manifest.prototype.getGroupedAndSortedComponents = function() {
	var self = this;
	var map = _.groupBy(self.manifestJSON, 'type');
	Object.keys(map).forEach(function(metadataType) {
		map[metadataType] = _.sortBy(map[metadataType], 'fullName');
	});
	return map;
};

Manifest.prototype.getJSON = function() {
	var self = this;
	self.manifestJSON = self.transform();
	self.manifestJSON = self.filterInvalid();
	var types = [];
	var groupedMetadata = self.getGroupedAndSortedComponents();
	_.keys(groupedMetadata).sort().forEach(function(metadataType) {
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
	return _.uniq(_.pluck(self.manifestJSON, 'type').sort(), true);
};

Manifest.prototype.getFileNames = function() {
	var self = this;
	return _.uniq(_.pluck(self.manifestJSON, 'fileName').sort(), true);
};

Manifest.prototype.getComponentNames = function() {
	var self = this;
	var componentNames = _.map(self.manifestJSON, function(metadataComponent) {
		return metadataComponent.type + '/' + metadataComponent.fullName;
	});
	return _.uniq(componentNames.sort(), true);
};

Manifest.prototype.getMatches = function(matchPatterns) {
	var self = this;
	var filtered = _.filter(self.manifestJSON, function(metadataComponent) {
		return multimatch([metadataComponent.type + '/' + metadataComponent.fullName], matchPatterns).length > 0;
	});
	return filtered;
};

Manifest.prototype.getNotIgnoredMatches = function(ignorePatterns) {
	var self = this;
	var matchPatterns = ['**/*'];
	ignorePatterns.forEach(function(ignorePattern) {
		matchPatterns.push('!' + ignorePattern);
	});
	return self.getMatches(matchPatterns);
};
