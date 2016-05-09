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
		it('should return a metadata component for a CustomField', function() {
			var metadataComponent = new MetadataComponent('CustomField/Account.Test__c');
			assert.deepEqual(metadataComponent.type, 'CustomField');
			assert.deepEqual(metadataComponent.fullName, 'Account.Test__c');
			assert.deepEqual(metadataComponent.fileName, path.join('objects', 'Account.object'));
			assert.deepEqual(metadataComponent.toString(), 'CustomField/Account.Test__c');
		});
		it('should return a metadata component for a AuraDefinitionBundle', function() {
			var metadataComponent = new MetadataComponent('AuraDefinitionBundle/TestApp');
			assert.deepEqual(metadataComponent.type, 'AuraDefinitionBundle');
			assert.deepEqual(metadataComponent.fullName, 'TestApp');
			assert.deepEqual(metadataComponent.fileName, path.join('aura', 'TestApp'));
			assert.deepEqual(metadataComponent.toString(), 'AuraDefinitionBundle/TestApp');
		});
		it('should return a metadata component for a Document', function() {
			var metadataComponent = new MetadataComponent('Document/unfiled$public/Test.pdf');
			assert.deepEqual(metadataComponent.type, 'Document');
			assert.deepEqual(metadataComponent.fullName, 'unfiled$public/Test.pdf');
			assert.deepEqual(metadataComponent.fileName, path.join('documents', 'unfiled$public', 'Test.pdf'));
			assert.deepEqual(metadataComponent.toString(), 'Document/unfiled$public/Test.pdf');
		});
	});
});
