"use strict";

var _ = require('underscore');
var path = require('path');

var childTypes = [{
	xmlName: 'AssignmentRule',
	tagName: 'assignmentRule',
	parent: 'AssignmentRules',
	key: 'fullName',
	isNamed: true
}, {
	xmlName: 'AutoResponseRule',
	tagName: 'autoResponseRule',
	parent: 'AutoResponseRules',
	key: 'fullName',
	isNamed: true
}, {
	xmlName: 'ActionOverride',
	tagName: 'actionOverrides',
	parent: 'CustomObject',
	key: 'actionName'
}, {
	xmlName: 'BusinessProcess',
	tagName: 'businessProcesses',
	parent: 'CustomObject',
	key: 'fullName',
	isNamed: true
}, {
	xmlName: 'CompactLayout',
	tagName: 'compactLayouts',
	parent: 'CustomObject',
	key: 'fullName',
	isNamed: true
}, {
	xmlName: 'CustomField',
	tagName: 'fields',
	parent: 'CustomObject',
	key: 'fullName',
	isNamed: true
}, {
	xmlName: 'FieldSet',
	tagName: 'fieldSets',
	parent: 'CustomObject',
	key: 'fullName',
	isNamed: true
}, {
	xmlName: 'Index',
	tagName: 'indexes',
	parent: 'CustomObject',
	key: 'fullName',
	isNamed: true
}, {
	xmlName: 'ListView',
	tagName: 'listViews',
	parent: 'CustomObject',
	key: 'fullName',
	isNamed: true
}, {
	xmlName: 'RecordType',
	tagName: 'recordTypes',
	parent: 'CustomObject',
	key: 'fullName',
	isNamed: true
}, {
	xmlName: 'SharingReason',
	tagName: 'sharingReasons',
	parent: 'CustomObject',
	key: 'fullName',
	isNamed: true
}, {
	xmlName: 'SharingRecalculation',
	tagName: 'sharingRecalculations',
	parent: 'CustomObject',
	key: 'className'
}, {
	xmlName: 'ValidationRule',
	tagName: 'validationRules',
	parent: 'CustomObject',
	key: 'fullName',
	isNamed: true
}, {
	xmlName: 'WebLink',
	tagName: 'webLinks',
	parent: 'CustomObject',
	key: 'fullName',
	isNamed: true
}, {
	xmlName: 'SharingCriteriaRule',
	tagName: 'sharingCriteriaRules',
	parent: 'SharingRules',
	key: 'fullName',
	isNamed: true
}, {
	xmlName: 'SharingOwnerRule',
	tagName: 'sharingOwnerRules',
	parent: 'SharingRules',
	key: 'fullName',
	isNamed: true
}, {
	xmlName: 'WorkflowFieldUpdate',
	tagName: 'fieldUpdates',
	parent: 'Workflow',
	key: 'fullName',
	isNamed: true
}, {
	xmlName: 'WorkflowKnowledgePublish',
	tagName: 'knowledgePublishes',
	parent: 'Workflow',
	key: 'fullName',
	isNamed: true
}, {
	xmlName: 'WorkflowFlowAction',
	tagName: 'flowActions',
	parent: 'Workflow',
	key: 'fullName',
	isNamed: true
}, {
	xmlName: 'WorkflowTask',
	tagName: 'tasks',
	parent: 'Workflow',
	key: 'fullName',
	isNamed: true
}, {
	xmlName: 'WorkflowAlert',
	tagName: 'alerts',
	parent: 'Workflow',
	key: 'fullName',
	isNamed: true
}, {
	xmlName: 'WorkflowOutboundMessage',
	tagName: 'outboundMessages',
	parent: 'Workflow',
	key: 'fullName',
	isNamed: true
}, {
	xmlName: 'WorkflowRule',
	tagName: 'rules',
	parent: 'Workflow',
	key: 'fullName',
	isNamed: true
}, {
	xmlName: 'EscalationRule',
	tagName: 'escalationRule',
	parent: 'EscalationRules',
	key: 'fullName',
	isNamed: true
}, {
	xmlName: 'MatchingRule',
	tagName: 'matchingRules',
	parent: 'MatchingRules',
	key: 'fullName',
	isNamed: true
}, {
	xmlName: 'CustomLabel',
	tagName: 'labels',
	parent: 'CustomLabels',
	key: 'fullName',
	isNamed: true,
	notCustomObjectRelated: true
}, {
	xmlName: 'ProfileApplicationVisibility',
	tagName: 'applicationVisibilities',
	parent: 'Profile',
	key: 'application'
}, {
	xmlName: 'ProfileCategoryGroupVisibility',
	tagName: 'categoryGroupVisibilities',
	parent: 'Profile',
	key: 'dataCategoryGroup'
}, {
	xmlName: 'ProfileApexClassAccess',
	tagName: 'classAccesses',
	parent: 'Profile',
	key: 'apexClass'
}, {
	xmlName: 'ProfileCustomMetadataTypeAccess',
	tagName: 'customMetadataTypeAccesses',
	parent: 'Profile',
	key: 'name'
}, {
	xmlName: 'ProfileCustomPermissions',
	tagName: 'customPermissions',
	parent: 'Profile',
	key: 'name'
}, {
	xmlName: 'ProfileCustomSettingAccesses',
	tagName: 'customSettingAccesses',
	parent: 'Profile',
	key: 'name'
}, {
	xmlName: 'ProfileExternalDataSourceAccess',
	tagName: 'externalDataSourceAccesses',
	parent: 'Profile',
	key: 'externalDataSource'
}, {
	xmlName: 'ProfileFieldLevelSecurity',
	tagName: 'fieldPermissions',
	parent: 'Profile',
	key: 'field'
}, {
	xmlName: 'ProfileLayoutAssignments',
	tagName: 'layoutAssignments',
	parent: 'Profile',
	key: 'layout',
	value: 'recordType'
}, {
	xmlName: 'ProfileObjectPermissions',
	tagName: 'objectPermissions',
	parent: 'Profile',
	key: 'object'
}, {
	xmlName: 'ProfileApexPageAccess',
	tagName: 'pageAccesses',
	parent: 'Profile',
	key: 'apexPage'
}, {
	xmlName: 'ProfileActionOverride',
	tagName: 'profileActionOverrides',
	parent: 'Profile',
	key: 'actionName'
}, {
	xmlName: 'ProfileRecordTypeVisibility',
	tagName: 'recordTypeVisibilities',
	parent: 'Profile',
	key: 'recordType'
}, {
	xmlName: 'ProfileTabVisibility',
	tagName: 'tabVisibilities',
	parent: 'Profile',
	key: 'tab'
}, {
	xmlName: 'ProfileUserPermission',
	tagName: 'userPermissions',
	parent: 'Profile',
	key: 'name'
}];

var metadataTypesAdditions = [];

var additionalMetadataTypes = [{
		directoryName: "dashboards",
		inFolder: false,
		metaFile: true,
		xmlName: "DashboardFolder"
	},
	{
		directoryName: "documents",
		inFolder: false,
		metaFile: true,
		xmlName: "DocumentFolder"
	},
	{
		directoryName: "email",
		inFolder: false,
		metaFile: true,
		xmlName: "EmailFolder"
	},
	{
		directoryName: "reports",
		inFolder: false,
		metaFile: true,
		xmlName: "ReportFolder"
	}
];

var DescribeMetadataService = module.exports = function(describeMetadataResult) {
	var self = this;
	self.describeMetadataResult = describeMetadataResult ? describeMetadataResult : require('./describe-metadata-result.json');
	self.metadataObjectsExtended = [];
	if (!self.describeMetadataResult.metadataObjects) {
		self.describeMetadataResult.metadataObjects = [];
	}
	self.describeMetadataResult.metadataObjects.forEach(function(metadataObject) {
		var additionalChildTypes = _.where(childTypes, {
			'parent': metadataObject.xmlName
		});
		var addition = _.findWhere(metadataTypesAdditions, {
			xmlName: metadataObject.xmlName
		});
		if (addition) {
			metadataObject = _.extend(metadataObject, addition);
		}
		if (additionalChildTypes && additionalChildTypes.length) {
			if (!metadataObject.childXmlNames) {
				metadataObject.childXmlNames = [];
			}
			metadataObject.childXmlNames = _.uniq(metadataObject.childXmlNames.concat(_.pluck(additionalChildTypes, 'xmlName')));
		}
		if (metadataObject.childXmlNames) {
			metadataObject.childXmlNames.forEach(function(childXmlName) {
				var childMetadataType = {
					directoryName: metadataObject.directoryName,
					inFolder: metadataObject.inFolder,
					metaFile: metadataObject.metaFile,
					xmlName: childXmlName
				};
				var childType = _.findWhere(childTypes, {
					'xmlName': childXmlName
				});
				if (childType) {
					childMetadataType.parent = childType.parent;
					childMetadataType.tagName = childType.tagName;
					childMetadataType.key = childType.key;
					childMetadataType.value = childType.value;
					childMetadataType.isNamed = typeof childType.isNamed === 'boolean' ? childType.isNamed : false;
					childMetadataType.notCustomObjectRelated = typeof childType.notCustomObjectRelated === 'boolean' ? childType.notCustomObjectRelated : false;
				}
				if (metadataObject.suffix) {
					childMetadataType.suffix = metadataObject.suffix;
				}
				self.metadataObjectsExtended.push(childMetadataType);
			});
		}
		self.metadataObjectsExtended.push(metadataObject);
	});
	self.metadataObjectsExtended = self.metadataObjectsExtended.concat(additionalMetadataTypes);
};

DescribeMetadataService.prototype.getTypes = function() {
	var self = this;
	return self.metadataObjectsExtended;
};

DescribeMetadataService.prototype.getType = function(xmlName) {
	var self = this;
	return _.findWhere(self.metadataObjectsExtended, {
		xmlName: xmlName
	});
};

DescribeMetadataService.prototype.getTypeNames = function() {
	var self = this;
	return _.pluck(self.metadataObjectsExtended, 'xmlName');
};

DescribeMetadataService.prototype.getDirectoryNames = function() {
	var self = this;
	return _.unique(_.pluck(self.metadataObjectsExtended, 'directoryName'));
};

DescribeMetadataService.prototype.getTypesForDirectoryName = function(directoryName) {
	var self = this;
	return _.where(self.metadataObjectsExtended, {
		directoryName: directoryName
	});
};

DescribeMetadataService.prototype.getTypeForFilepath = function(filepath) {
	var self = this;
	var directoryName = path.basename(path.dirname(filepath));
	var parentDirectoryName = path.basename(path.dirname(path.dirname(filepath)));

	// Metadata like WaveTemplateBundles are deeply nested and contain ambiguous subfolders
	// like 'dashboard'. Give precedence to the top-level folder name in this case
	var pathComponents = filepath.split(path.sep);
	var deeplyNestedComponent = pathComponents.length > 3;
	if (deeplyNestedComponent) {
		return self.getTypesForDirectoryName(pathComponents[0])[0];
	}

	var metaXmlInfo = filepath.match(/^(.*)-meta.xml$/);
	if (metaXmlInfo !== null && metaXmlInfo.length === 2) {
		filepath = metaXmlInfo[1];
	}
	var extname = path.extname(filepath).split('.')[1];
	if (!extname) {
		extname = '';
	}
	var directoryMatches = self.getTypesForDirectoryName(directoryName);
	var parentDirectoryMatches = self.getTypesForDirectoryName(parentDirectoryName);
	var matches = _.unique([].concat(directoryMatches, parentDirectoryMatches));

	// find the container metadata type
	var childMatch = _.find(matches, function(item) {
		return item.childXmlNames;
	});
	if (childMatch) {
		return childMatch;
	}

	var extnameMatch = _.find(matches, function(item) {
		return item.suffix === extname;
	});
	if (extnameMatch) {
		return extnameMatch;
	}

	// no required extension
	var folderMatches = _.find(directoryMatches, function(item) {
		return !item.inFolder && !item.suffix;
	});
	var parentFolderMatches = _.find(parentDirectoryMatches, function(item) {
		return !item.inFolder && !item.suffix;
	});
	if (folderMatches && !parentFolderMatches) {
		return folderMatches;
	}

	var extnameInFolder = _.find(matches, function(item) {
		return item.inFolder && !item.suffix;
	});
	if (extnameInFolder) {
		return extnameInFolder;
	}

	var inFolderMatches = _.find(matches, function(item) {
		return item.inFolder;
	});
	if (inFolderMatches) {
		return inFolderMatches;
	}

	return matches[0];
};
