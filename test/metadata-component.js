"use strict";

var assert = require("assert");
var path = require("path");
var MetadataComponent = require("../lib/metadata-component");

describe('MetadataComponent', function() {
	describe('#constructor()', function() {
		it('should return an empty object for an invalid expression', function() {
			var metadataComponent = new MetadataComponent('Test');
			assert.deepEqual(metadataComponent, {});
		});
		it('should return a component with and without optional contents', function() {
			var metadataComponent = new MetadataComponent({
				type: 'ApexPage',
				fullName: 'Test',
				fileName: path.join('pages', 'Test.page')
			});
			assert.deepEqual(metadataComponent.contents, undefined);
			var metadataComponentWithContents = new MetadataComponent({
				type: 'ApexPage',
				fullName: 'Test',
				fileName: path.join('pages', 'Test.page'),
				contents: 'hello'
			});
			assert.deepEqual(metadataComponentWithContents.contents.toString(), 'hello');
		});
		it('should return a metadata component for an ApexPage', function() {
			var metadataComponent = new MetadataComponent('ApexPage/Test');
			assert.deepEqual(metadataComponent.type, 'ApexPage');
			assert.deepEqual(metadataComponent.fullName, 'Test');
			assert.deepEqual(metadataComponent.fileName, path.join('pages', 'Test.page'));
			assert.deepEqual(metadataComponent.toString(), 'ApexPage/Test');
			var metadataComponentFromObject = new MetadataComponent({
				expression: 'ApexPage/Test'
			});
			assert.deepEqual(metadataComponentFromObject, metadataComponent);
			var metadataComponentFromFullObject = new MetadataComponent({
				type: 'ApexPage',
				fullName: 'Test',
				fileName: path.join('pages', 'Test.page')
			});
			assert.deepEqual(metadataComponentFromFullObject, metadataComponent);
		});
		it('should return a metadata component for a CustomObject', function() {
			var metadataComponent = new MetadataComponent('CustomObject/Account');
			assert.deepEqual(metadataComponent.type, 'CustomObject');
			assert.deepEqual(metadataComponent.fullName, 'Account');
			assert.deepEqual(metadataComponent.fileName, path.join('objects', 'Account.object'));
			assert.deepEqual(metadataComponent.toString(), 'CustomObject/Account');
		});
		it('should return a metadata component for a CustomField', function() {
			var metadataComponent = new MetadataComponent('CustomField/Account.Test__c');
			assert.deepEqual(metadataComponent.type, 'CustomField');
			assert.deepEqual(metadataComponent.fullName, 'Account.Test__c');
			assert.deepEqual(metadataComponent.fileName, path.join('objects', 'Account.object'));
			assert.deepEqual(metadataComponent.toString(), 'CustomField/Account.Test__c');
		});
		it('should return a metadata component for a ProfileFieldLevelSecurity', function() {
			var metadataComponent = new MetadataComponent('ProfileFieldLevelSecurity/Admin.Account.Test__c');
			assert.deepEqual(metadataComponent.type, 'ProfileFieldLevelSecurity');
			assert.deepEqual(metadataComponent.fullName, 'Admin.Account.Test__c');
			assert.deepEqual(metadataComponent.fileName, path.join('profiles', 'Admin.profile'));
			assert.deepEqual(metadataComponent.toString(), 'ProfileFieldLevelSecurity/Admin.Account.Test__c');
		});
		it('should return a metadata component for a AuraDefinitionBundle', function() {
			var metadataComponent = new MetadataComponent('AuraDefinitionBundle/TestApp');
			assert.deepEqual(metadataComponent.type, 'AuraDefinitionBundle');
			assert.deepEqual(metadataComponent.fullName, 'TestApp');
			assert.deepEqual(metadataComponent.fileName, path.join('aura', 'TestApp'));
			assert.deepEqual(metadataComponent.toString(), 'AuraDefinitionBundle/TestApp');
		});
		it('should return a metadata component for a LightningComponentBundle', function() {
			var metadataComponent = new MetadataComponent('LightningComponentBundle/TestApplwc');
			assert.deepEqual(metadataComponent.type, 'LightningComponentBundle');
			assert.deepEqual(metadataComponent.fullName, 'TestApplwc');
			assert.deepEqual(metadataComponent.fileName, path.join('lwc', 'TestApplwc'));
			assert.deepEqual(metadataComponent.toString(), 'LightningComponentBundle/TestApplwc');
		});
		it('should return a metadata component for an Einstein Analytics Dashboard', function() {
			var metadataComponent = new MetadataComponent('WaveDashboard/About_Wave_for_Sales');
			assert.deepEqual(metadataComponent.type, 'WaveDashboard');
			assert.deepEqual(metadataComponent.fullName, 'About_Wave_for_Sales');
			assert.deepEqual(metadataComponent.fileName, path.join('wave', 'About_Wave_for_Sales.wdash'));
			assert.deepEqual(metadataComponent.toString(), 'WaveDashboard/About_Wave_for_Sales');
		});
		it('should return a metadata component for an Einstein Analytics Template Bundle', function() {
			var metadataComponent = new MetadataComponent('WaveTemplateBundle/Service_Analytics_Flex/dashboards/Service_Backlog');
			assert.deepEqual(metadataComponent.type, 'WaveTemplateBundle');
			assert.deepEqual(metadataComponent.fullName, 'Service_Analytics_Flex');
			assert.deepEqual(metadataComponent.fileName, path.join('waveTemplates', 'Service_Analytics_Flex'));
			assert.deepEqual(metadataComponent.toString(), 'WaveTemplateBundle/Service_Analytics_Flex');
		});
		it('should return a metadata component for a Document', function() {
			var metadataComponent = new MetadataComponent('Document/unfiled$public/Test.pdf');
			assert.deepEqual(metadataComponent.type, 'Document');
			assert.deepEqual(metadataComponent.fullName, 'unfiled$public/Test.pdf');
			assert.deepEqual(metadataComponent.fileName, path.join('documents', 'unfiled$public', 'Test.pdf'));
			assert.deepEqual(metadataComponent.toString(), 'Document/unfiled$public/Test.pdf');
		});
		it('should return a metadata component for a DocumentFolder', function() {
			var metadataComponent = new MetadataComponent('DocumentFolder/unfiled$public');
			assert.deepEqual(metadataComponent.type, 'DocumentFolder');
			assert.deepEqual(metadataComponent.fullName, 'unfiled$public');
			assert.deepEqual(metadataComponent.fileName, path.join('documents', 'unfiled$public'));
			assert.deepEqual(metadataComponent.toString(), 'DocumentFolder/unfiled$public');
		});
		it('should return a metadata component for a ReportFolder', function() {
			var metadataComponent = new MetadataComponent('ReportFolder/unfiled$public');
			assert.deepEqual(metadataComponent.type, 'ReportFolder');
			assert.deepEqual(metadataComponent.fullName, 'unfiled$public');
			assert.deepEqual(metadataComponent.fileName, path.join('reports', 'unfiled$public'));
			assert.deepEqual(metadataComponent.toString(), 'ReportFolder/unfiled$public');
		});
		it('should return a metadata component for a ReportFolder given as Report', function() {
			var metadataComponent = new MetadataComponent('Report/unfiled$public');
			assert.deepEqual(metadataComponent.type, 'ReportFolder');
			assert.deepEqual(metadataComponent.fullName, 'unfiled$public');
			assert.deepEqual(metadataComponent.fileName, path.join('reports', 'unfiled$public'));
			assert.deepEqual(metadataComponent.toString(), 'ReportFolder/unfiled$public');
		});
		it('should return a metadata component for the CustomLabels container component', function() {
			var metadataComponent = new MetadataComponent('CustomLabels/CustomLabels');
			assert.deepEqual(metadataComponent.type, 'CustomLabels');
			assert.deepEqual(metadataComponent.fullName, 'CustomLabels');
			assert.deepEqual(metadataComponent.fileName, path.join('labels', 'CustomLabels.labels'));
			assert.deepEqual(metadataComponent.toString(), 'CustomLabels/CustomLabels');
		});
		it('should return a metadata component for a CustomLabel', function() {
			var metadataComponent = new MetadataComponent('CustomLabel/MyLabel');
			assert.deepEqual(metadataComponent.type, 'CustomLabel');
			assert.deepEqual(metadataComponent.fullName, 'MyLabel');
			assert.deepEqual(metadataComponent.fileName, path.join('labels', 'CustomLabels.labels'));
			assert.deepEqual(metadataComponent.toString(), 'CustomLabel/MyLabel');
		});
	});
	describe('#getMetadataType()', function() {
		var metadataComponent = new MetadataComponent('CustomObject/Account');
		var metadataType = metadataComponent.getMetadataType();
		assert(metadataType);
		assert(metadataType.childXmlNames);
		assert(metadataType.childXmlNames.indexOf('CustomField') >= 0);
	});
});
