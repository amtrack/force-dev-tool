"use strict";

var config;

var Config = module.exports = function(opts) {
	opts = opts ? opts : {};
	if (config === undefined) {
		config = {};
		config.pollTimeout = opts.pollTimeout !== undefined ? opts.pollTimeout : 15 * 60 * 1000; // 15 minutes
		config.defaultMetadataTypes = opts.defaultMetadataTypes !== undefined ? opts.defaultMetadataTypes : ['ApexClass', 'ApexComponent', 'ApexPage', 'ApexTrigger', 'CustomField', 'CustomObject', 'CustomTab', 'WebLink'];
		config.defaultApiVersion = opts.defaultApiVersion !== undefined ? opts.defaultApiVersion : "45.0";
		config.folderBasedMetadataMap = opts.folderBasedMetadataMap !== undefined ? opts.folderBasedMetadataMap : {
			'EmailFolder': 'EmailTemplate',
			'DashboardFolder': 'Dashboard',
			'DocumentFolder': 'Document',
			'ReportFolder': 'Report'
		};
		// https://developer.salesforce.com/docs/atlas.en-us.packagingGuide.meta/packagingGuide/packaging_component_attributes.htm
		// Components with no entry in the "Subscriber and Developer Editable" column
		config.nonEditableManagedMetadataTypes = ['ApexClass', 'SharingReason', 'ApexTrigger', 'CompactLayout', 'CustomLabel', 'CustomPermission', /* CustomSetting */ 'FlexiPage', 'HomePageComponent', 'AuraDefinitionBundle', 'LightningComponentBundle', 'PermissionSet', 'PlatformCachePartition', 'StaticResource', 'Translation', 'ApexComponent', 'ApexPage'];
		// https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/standardvalueset_names.htm
		config.standardPicklistMapping = {
			'AccountContactRelation.Roles': 'AccountContactMultiRoles',
			'AccountContactRole.Role': 'AccountContactRole',
			'Account.Ownership': 'AccountOwnership',
			'Account.Rating': 'AccountRating',
			'Lead.Rating': 'AccountRating',
			'Account.Type': 'AccountType',
			'Asset.Status': 'AssetStatus',
			'CampaignMember.Status': 'CampaignMemberStatus',
			'Campaign.Status': 'CampaignStatus',
			'Campaign.Type': 'CampaignType',
			'CaseContactRole.Role': 'CaseContactRole',
			'Case.Origin': 'CaseOrigin',
			'Case.Priority': 'CasePriority',
			'Case.Reason': 'CaseReason',
			'Case.Status': 'CaseStatus',
			'Case.Type': 'CaseType',
			'OpportunityContactRole.Role': 'ContactRole',
			'ContractContactRole.Role': 'ContractContactRole',
			'Contract.Status': 'ContractStatus',
			'Entitlement.Type': 'EntitlementType',
			'Event.Subject': 'EventSubject',
			'Event.Type': 'EventType',
			'Period.PeriodLabel': 'FiscalYearPeriodName',
			'FiscalYearSettings.PeriodPrefix': 'FiscalYearPeriodPrefix',
			'Period.QuarterLabel': 'FiscalYearQuarterName',
			'FiscalYearSettings.QuarterPrefix': 'FiscalYearQuarterPrefix',
			// 'IdeaTheme.Categories': 'IdeaCategory', // You can’t read or update this standard value set or picklist field.
			'Idea.Categories': 'IdeaMultiCategory',
			'Idea.Status': 'IdeaStatus',
			'IdeaTheme.Status': 'IdeaThemeStatus',
			'Account.Industry': 'Industry',
			'Lead.Industry': 'Industry',
			'Account.AccountSource': 'LeadSource',
			'Lead.AccountSource': 'LeadSource',
			'Opportunity.Source': 'LeadSource',
			'Lead.Status': 'LeadStatus',
			'Opportunity.Competitors': 'OpportunityCompetitor',
			'Opportunity.StageName': 'OpportunityStage',
			'Opportunity.Type': 'OpportunityType',
			'Order.Type': 'OrderType',
			'Account.PartnerRole': 'PartnerRole',
			'Product2.Family': 'Product2Family',
			// 'Question.Origin': 'QuestionOrigin', // You can’t read or update this standard value set or picklist field.
			'QuickText.Category': 'QuickTextCategory',
			'QuickText.Channel': 'QuickTextChannel',
			'Quote.Status': 'QuoteStatus',
			'OpportunityTeamMember.TeamMemberRole': 'SalesTeamRole',
			'UserAccountTeamMember.TeamMemberRole': 'SalesTeamRole',
			'UserTeamMember.TeamMemberRole': 'SalesTeamRole',
			'AccountTeamMember.TeamMemberRole': 'SalesTeamRole',
			'Contact.Salutation': 'Salutation',
			'Lead.Salutation': 'Salutation',
			'ServiceContract.ApprovalStatus': 'ServiceContractApprovalStatus',
			'SocialPost.Classification': 'SocialPostClassification',
			'SocialPost.EngagementLevel': 'SocialPostEngagementLevel',
			'SocialPost.ReviewedStatus': 'SocialPostReviewedStatus',
			'Solution.Status': 'SolutionStatus',
			'Task.Priority': 'TaskPriority',
			'Task.Status': 'TaskStatus',
			'Task.Subject': 'TaskSubject',
			'Task.Type': 'TaskType',
			'WorkOrderLineItem.Status': 'WorkOrderLineItemStatus',
			'WorkOrder.Priority': 'WorkOrderPriority',
			'WorkOrder.Status': 'WorkOrderStatus'
		};
	}
};

Config.prototype.get = function(key) {
	return config[key];
};

Config.prototype.set = function(key, value) {
	config[key] = value;
};
