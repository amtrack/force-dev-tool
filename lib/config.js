"use strict";

var config;

var Config = module.exports = function(opts) {
	opts = opts ? opts : {};
	if (config === undefined) {
		config = {};
		config.pollTimeout = opts.pollTimeout !== undefined ? opts.pollTimeout : 15 * 60 * 1000; // 15 minutes
		config.defaultMetadataTypes = opts.defaultMetadataTypes !== undefined ? opts.defaultMetadataTypes : ['ApexClass', 'ApexComponent', 'ApexPage', 'ApexTrigger', 'CustomField', 'CustomObject', 'CustomTab', 'WebLink'];
		config.defaultApiVersion = opts.defaultApiVersion !== undefined ? opts.defaultApiVersion : "38.0";
		config.folderBasedMetadataMap = opts.folderBasedMetadataMap !== undefined ? opts.folderBasedMetadataMap : {
			'EmailFolder': 'EmailTemplate',
			'DashboardFolder': 'Dashboard',
			'DocumentFolder': 'Document',
			'ReportFolder': 'Report'
		};
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
			// 'Period.PeriodLabel': 'FiscalYearPeriodName', // Can't retrieve non-customizable CustomObject named: Period
			// 'FiscalYearSettings.PeriodPrefix': 'FiscalYearPeriodPrefix', // Can't retrieve non-customizable CustomObject named: FiscalYearSettings
			// 'Period.QuarterLabel': 'FiscalYearQuarterName', // Can't retrieve non-customizable CustomObject named: Period
			// 'FiscalYearSettings.QuarterPrefix': 'FiscalYearQuarterPrefix', // Can't retrieve non-customizable CustomObject named: FiscalYearSettings
			// 'IdeaTheme.Categories': 'IdeaCategory',
			'Idea.Categories': 'IdeaMultiCategory',
			'Idea.Status': 'IdeaStatus',
			'IdeaTheme.Status': 'IdeaThemeStatus',
			'Account.Industry': 'Industry',
			'Lead.Industry': 'Industry',
			'Invoice.Status': 'InvoiceStatus',
			'Account.AccountSource': 'LeadSource',
			'Lead.AccountSource': 'LeadSource',
			'Lead.Status': 'LeadStatus',
			'Opportunity.Competitors': 'OpportunityCompetitor',
			'Opportunity.StageName': 'OpportunityStage',
			'Opportunity.Type': 'OpportunityType',
			// 'Order.Status': 'OrderStatus',
			'Order.Type': 'OrderType',
			'Account.PartnerRole': 'PartnerRole',
			'Product2.Family': 'Product2Family',
			// 'Question.Origin': 'QuestionOrigin',
			'QuickText.Category': 'QuickTextCategory',
			'QuickText.Channel': 'QuickTextChannel',
			'Quote.Status': 'QuoteStatus',
			'OpportunityTeamMember.TeamMemberRole': 'SalesTeamRole',
			'UserAccountTeamMember.TeamMemberRole': 'SalesTeamRole',
			'UserTeamMember.TeamMemberRole': 'SalesTeamRole',
			'AccountTeamMember.TeamMemberRole': 'SalesTeamRole',
			'Contract.BillingName': 'Salutation',
			'Invoice.BillingName': 'Salutation',
			'Contact.BillingName': 'Salutation',
			'Lead.BillingName': 'Salutation',
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
