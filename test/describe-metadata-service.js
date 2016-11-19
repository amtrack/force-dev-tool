"use strict";

var assert = require("assert");
var describeMetadataService = new(require("../lib/describe-metadata-service"))();
var path = require("path");

describe('Metadata', function() {
	var numberOfMetadataObjects = describeMetadataService.describeMetadataResult.metadataObjects.length;
	var numberOfMetadataObjectsExtended = describeMetadataService.metadataObjectsExtended.length;
	describe('#getTypes()', function() {
		it('should return a list of extended metadata types', function() {
			assert.equal(describeMetadataService.getTypes().length, numberOfMetadataObjectsExtended);
		});
	});
	describe('#getTypeNames()', function() {
		it('should return a list of extended metadata type names', function() {
			assert.equal(describeMetadataService.getTypeNames().length, numberOfMetadataObjectsExtended);
		});
	});
	describe('#getDirectoryNames()', function() {
		it('should return a list of extended metadata type directory names', function() {
			// KeywordList and ModerationRule unfortunately use the same directoryName 'moderation'
			assert.equal(describeMetadataService.getDirectoryNames().length, numberOfMetadataObjects - 1);
		});
	});
	describe('#getType()', function() {
		it('should return metadata type for a given type name', function() {
			assert.deepEqual(describeMetadataService.getType('ApexPage').xmlName, 'ApexPage');
		});
	});
	describe('#getTypeForFilepath()', function() {
		it('should return metadata type for a given file path', function() {
			assert.deepEqual(describeMetadataService.getTypeForFilepath(path.join('pages', 'Test.page')).xmlName, 'ApexPage');
			assert.deepEqual(describeMetadataService.getTypeForFilepath(path.join('objects', 'Account.object')).xmlName, 'CustomObject');
			assert.deepEqual(describeMetadataService.getTypeForFilepath(path.join('aura', 'TestApp')).xmlName, 'AuraDefinitionBundle');
			assert.deepEqual(describeMetadataService.getTypeForFilepath(path.join('aura', 'TestApp', 'TestApp.app')).xmlName, 'AuraDefinitionBundle');
			assert.deepEqual(describeMetadataService.getTypeForFilepath(path.join('aura', 'TestApp', 'TestApp.cmp')).xmlName, 'AuraDefinitionBundle');
			assert.deepEqual(describeMetadataService.getTypeForFilepath(path.join('aura', 'TestApp', 'TestApp.js')).xmlName, 'AuraDefinitionBundle');
			assert.deepEqual(describeMetadataService.getTypeForFilepath(path.join('aura', 'TestApp', 'TestApp.css')).xmlName, 'AuraDefinitionBundle');
		});
		it('should return undefined for an invalid file path', function() {
			assert.deepEqual(describeMetadataService.getTypeForFilepath(path.join('foo', 'bar')), undefined);
		});
	});
});
