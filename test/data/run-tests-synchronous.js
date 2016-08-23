'use strict';

exports.response = {
	successes: [{
		namespace: null,
		name: 'Test_OpportunityController',
		methodName: 'isSoFine',
		id: '01pD0000000mL3EIAU',
		time: 4661,
		seeAllData: true
	}, {
		namespace: null,
		name: 'Test_QuoteController',
		methodName: 'isSoCool',
		id: '01pD0000000mQrWIAU',
		time: 717,
		seeAllData: false
	}],
	failures: [{
		type: 'Class',
		namespace: 'MyNamespace',
		name: 'Test_QuoteController',
		methodName: 'CreateAndSendQuoteTest',
		message: 'System.NullPointerException: Attempt to de-reference a null object',
		stackTrace: 'Class.Test_QuoteController: line 76, column 1',
		id: '01pD0000000mQrWIAU',
		seeAllData: true,
		time: 4279,
		packageName: 'Test_QuoteController'
	}, {
		type: 'Class',
		namespace: 'MyNamespace',
		name: 'Test_QuoteController',
		methodName: 'getCurrentUserName',
		message: 'System.NullPointerException: Attempt to de-reference a null object',
		stackTrace: 'Class.Test_QuoteController: line 76, column 1',
		id: '01pD0000000mQrWIAU',
		seeAllData: true,
		time: 1518,
		packageName: 'Test_QuoteController'
	}, {
		type: 'Class',
		namespace: 'MyNamespace',
		name: 'Test_QuoteController',
		methodName: 'getQuoteLineItemTest',
		message: 'System.NullPointerException: Attempt to de-reference a null object',
		stackTrace: 'Class.Test_QuoteController: line 76, column 1',
		id: '01pD0000000mQrWIAU',
		seeAllData: true,
		time: 1597,
		packageName: 'Test_QuoteController'
	}],
	totalTime: 12772,
	apexLogId: null,
	numTestsRun: 5,
	codeCoverage: [{
		locationsNotCovered: [],
		soslInfo: [],
		dmlInfo: [],
		numLocations: 2,
		numLocationsNotCovered: 0,
		soqlInfo: [],
		methodInfo: [],
		name: 'QuoteController',
		id: '01pD0000000mVvEIAU',
		type: 'Class',
		namespace: 'MyNamespace'
	}, {
		locationsNotCovered: [Object],
		soslInfo: [],
		dmlInfo: [],
		numLocations: 96,
		numLocationsNotCovered: 13,
		soqlInfo: [],
		methodInfo: [],
		name: 'OpportunityController',
		id: '01qD000000065E4IAI',
		type: 'Class',
		namespace: null
	}],
	numFailures: 3,
	codeCoverageWarnings: [{
		id: '01qD000000065E4IAI',
		name: 'OpportunityController',
		namespace: null,
		message: 'Test coverage of selected Apex Class is 13%, at least 90% test coverage is required'
	}]
};
