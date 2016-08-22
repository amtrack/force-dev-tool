"use strict";

var _ = require('underscore');
var path = require('path');
var config = new(require('./config'))();
var MetadataComponent = require('./metadata-component');

var folderBasedMetadataMap = config.get('folderBasedMetadataMap');
var standardPicklistMapping = config.get('standardPicklistMapping');

var getFolderTypes = function() {
	var folderTypes = [];
	Object.keys(folderBasedMetadataMap).forEach(function(key) {
		folderTypes.push(key);
		folderTypes.push(folderBasedMetadataMap[key]);
	});
	return folderTypes;
}

var FetchResultParser = module.exports = function(resultJSON) {
	var self = this;
	self.resultJSON = JSON.parse(JSON.stringify(resultJSON));
	self.apiVersions = self.resultJSON.apiVersions || [];
	self.describeMetadataResult = self.resultJSON.describeMetadataResult || {};
	self.fileProperties = self.resultJSON.fileProperties || [];
	self.personAccountRecordTypes = self.resultJSON.personAccountRecordTypes || [];
	self.flowDefinitions = self.resultJSON.flowDefinitions || [];
	self.standardPicklists = self.resultJSON.standardPicklists || [];
	self.metadata = resultJSON.metadata || {};
	self.warnings = self.resultJSON.warnings || [];
};

FetchResultParser.prototype.getApiVersion = function() {
	var self = this;
	var versions = self.apiVersions;
	if (Array.isArray(versions) && versions.length) {
		return versions[versions.length - 1].version;
	}
	return null;
};

FetchResultParser.prototype.getComponents = function(opts) {
	var self = this;
	opts = opts ? opts : {};
	opts.filterManaged = opts.filterManaged !== undefined ? opts.filterManaged : true;
	opts.filterStandard = opts.filterStandard !== undefined ? opts.filterStandard : false;
	var components = [];
	if (opts.filterManaged) {
		self.filterManaged();
	}
	self.addStandardPicklists();
	if (opts.filterStandard) {
		self.filterStandard();
	}
	self.transform();
	self.filterInvalid();
	self.fileProperties.forEach(function(fileProperty) {
		components.push(
			new MetadataComponent({
				type: fileProperty.type,
				fullName: fileProperty.fullName,
				fileName: fileProperty.fileName ? path.join.apply(null, fileProperty.fileName.split('/')) : fileProperty.fileName
			})
		);
	});
	return components;
};

FetchResultParser.prototype.getWarnings = function() {
	return this.warnings;
}

FetchResultParser.prototype.filterManaged = function() {
	var self = this;
	// filter installed metadata components
	self.fileProperties = _.filter(self.fileProperties, function(fileProperty) {
		return fileProperty.manageableState !== 'installed' && fileProperty.type !== 'InstalledPackage';
	});
	return self;
}

FetchResultParser.prototype.addStandardPicklists = function() {
	var self = this;
	self.standardPicklists.forEach(function(standardPicklistResult) {
		var standardPicklist = standardPicklistResult.EntityDefinition.QualifiedApiName + '.' + standardPicklistResult.QualifiedApiName;
		if (Object.keys(standardPicklistMapping).indexOf(standardPicklist) >= 0) {
			self.fileProperties.push({
				type: 'CustomField',
				fullName: standardPicklist,
				fileName: standardPicklistResult.EntityDefinition.QualifiedApiName + '.object'
			});
		}
	});
	// Workaround for https://success.salesforce.com/ideaView?id=0873A000000cMdrQAE
	if (_.findWhere(self.describeMetadataResult.metadataObjects, {
			xmlName: 'StandardValueSet'
		})) {
		var translations = _.where(self.fileProperties, {
			type: 'Translations'
		});
		self.standardPicklists.forEach(function(standardPicklistResult) {
			var standardPicklist = standardPicklistResult.EntityDefinition.QualifiedApiName + '.' + standardPicklistResult.QualifiedApiName;
			if (Object.keys(standardPicklistMapping).indexOf(standardPicklist) >= 0) {
				var standardValueSetName = standardPicklistMapping[standardPicklist];
				self.fileProperties.push({
					type: 'StandardValueSet',
					fullName: standardValueSetName,
					fileName: standardValueSetName + '.standardValueSet'
				});
				translations.forEach(function(translation) {
					var lang = translation.fullName;
					self.fileProperties.push({
						type: 'StandardValueSetTranslation',
						fullName: standardValueSetName + '-' + lang,
						fileName: standardValueSetName + '-' + lang + '.standardValueSetTranslation'
					});
				})
			}
		});
	}
}

FetchResultParser.prototype.filterStandard = function() {
	// best effort to filter standard fileProperties remaining only custom fileProperties
	// TODO: accept parameters for flows, layouts and approval processes
	var self = this;
	self.fileProperties = _.filter(self.fileProperties, function(fileProperty) {
		if (["Layout", "FlowDefinition"].indexOf(fileProperty.type) >= 0) {
			// generate empty or deactivate before
			return false;
		}
		if (["Workflow", "Settings", "Translations", "ListView", "MatchingRule", "MatchingRules", "EscalationRules", "CustomObjectTranslation", "Community", "AppMenu", "AssignmentRules", "AutoResponseRules", "CompactLayout", "Certificate", "RecordType"].indexOf(fileProperty.type) >= 0) {
			return false;
		}
		if (["CustomApplication", "Profile", "PermissionSet", "Role"].indexOf(fileProperty.type) >= 0) {
			// might be linked to users
			return false;
		}
		if (["SharingRules"].indexOf(fileProperty.type) >= 0) {
			return false;
		}
		if (["CustomObject"].indexOf(fileProperty.type) >= 0 && !(new RegExp('^.*__c$').test(fileProperty.fullName))) {
			return false;
		}
		if (["AppMenu"].indexOf(fileProperty.type) >= 0 && fileProperty.fullName === 'Salesforce1') {
			return false;
		}
		if (["CustomApplication"].indexOf(fileProperty.type) >= 0 && new RegExp('^standard__.*').test(fileProperty.fullName)) {
			return false;
		}
		if (["EmailTemplate", "Dashboard", "Document", "Report"].indexOf(fileProperty.type) >= 0) {
			if (!(new RegExp('.*\/.*').test(fileProperty.fullName))) {
				// TODO: match folders and sub folders
				return false;
			} else if (!(new RegExp('unfiled\$public\/(SupportSelfService.*)', 'i').test(fileProperty.fullName)) || !(new RegExp('unfiled\$public\/(SupportCase.*)').test(fileProperty.fullName))) {
				// used in Case.settings caseAssignNotificationTemplate webToCase.defaultResponseTemplate: SupportCase.*
				// used in Self-Service Setup: SupportSelfService.* SUPPORTSelfService
				return false;
			}
		}
		return true;
	});
	return self;
}

FetchResultParser.prototype.transform = function() {
	var self = this;
	self.fileProperties = self.fileProperties.map(function(fileProperty) {
		if (Object.keys(folderBasedMetadataMap).indexOf(fileProperty.type) > -1) {
			// DocumentFolder has to be listed as Document
			fileProperty.type = folderBasedMetadataMap[fileProperty.type];
		} else if (fileProperty.type === 'Flow' && !new RegExp('^.*-[0-9]+$').test(fileProperty.fullName) && self.flowDefinitions) {
			// determine the active version number using the FlowDefinition Metadata
			var flowDefinitionMatch = _.findWhere(self.flowDefinitions, {
				DeveloperName: fileProperty.fullName
			});
			if (flowDefinitionMatch && flowDefinitionMatch.ActiveVersion && flowDefinitionMatch.ActiveVersion.VersionNumber) {
				fileProperty.fullName = fileProperty.fullName + '-' + flowDefinitionMatch.ActiveVersion.VersionNumber;
			}
		} else if (fileProperty.type === 'RecordType' && self.personAccountRecordTypes) {
			// PersonAccount RecordTypes are being listed incorrectly as Account RecordTypes
			var fullNameParts = fileProperty.fullName.split('.');
			var itemType = fullNameParts[0];
			var itemName = fullNameParts[1];
			var personAccountRecordTypeMatch = _.findWhere(self.personAccountRecordTypes, {
				DeveloperName: itemName,
				SobjectType: itemType,
				IsPersonType: true
			});
			if (personAccountRecordTypeMatch) {
				fileProperty.fullName = 'PersonAccount.' + itemName;
			}
		} else if (fileProperty.type === 'CustomFeedFilter') {
			// Apparently the fullName returned in the FileProperty does not include the necessary Case prefix:
			// http://salesforce.stackexchange.com/questions/156714/listmetadata-query-of-type-customfeedfilter-returns-fullname-without-sobject
			if (fileProperty.fullName.indexOf('.') < 0) {
				fileProperty.fullName = 'Case.' + fileProperty.fullName;
			}
		}
		return fileProperty;
	});
	return self;
};

FetchResultParser.prototype.filterInvalid = function() {
	var self = this;
	var folderTypes = getFolderTypes();
	var describeMetadataService = new(require('./describe-metadata-service'))(self.describeMetadataResult);
	var metadataObjectsExtended = describeMetadataService.getTypes();

	self.fileProperties = _.filter(self.fileProperties, function(fileProperty) {
		if (!fileProperty.type || typeof fileProperty.type !== 'string') {
			return false;
		}
		var metadataType = _.findWhere(metadataObjectsExtended, {
			xmlName: fileProperty.type
		});
		if (folderTypes.indexOf(fileProperty.type) > -1 && fileProperty.fullName === 'unfiled$public') {
			// we don't consider this as a warning
			// self.warnings.push('Warning: Skipped standard ' + fileProperty.type + ': ' + fileProperty.fullName);
			return false;
		} else if (fileProperty.type === 'QuickAction' && new RegExp('^09D26.*').test(fileProperty.id)) {
			self.warnings.push('Warning: Skipped non-global QuickAction: ' + fileProperty.fullName);
			return false;
		} else if (fileProperty.type === 'Flow' && !new RegExp('^.*-[0-9]+$').test(fileProperty.fullName)) {
			self.warnings.push('Warning: Skipped non-versioned Flow: ' + fileProperty.fullName);
			return false;
		} else if (metadataType.childXmlNames && ['CustomObject', 'Profile', 'PermissionSet'].indexOf(fileProperty.type) < 0) {
			// don't list types which have named children only
			return false;
		}
		return true;
	});
	return self;
};
