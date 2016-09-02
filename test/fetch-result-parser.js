"use strict";

var assert = require("assert");

var FetchResultParser = require('../lib/fetch-result-parser');
var MetadataComponent = require('../lib/metadata-component');

var describeMetadataResult = require('../lib/describe-metadata-result.json');
var apiVersions = require('./data/fetch-results/api-versions.json');
var fileProperties = require('./data/fetch-results/file-properties');
var soqlResponses = require('./data/fetch-results/soql-responses');

describe('FetchResultParser', function() {
	describe('#getComponents()', function() {
		it('should return components', function() {
			var fetchResult = new FetchResultParser({
				fileProperties: []
			});
			assert.deepEqual(fetchResult.getComponents().length, 0);
		});
	});
	describe('#getApiVersion()', function() {
		it('should return the latest API version', function() {
			var fetchResult = new FetchResultParser({
				apiVersions: apiVersions
			});
			assert.deepEqual(fetchResult.getApiVersion(), "37.0");
		});
	});
	describe('#filterManaged()', function() {
		it('should filter components from installed managed packages', function() {
			var fetchResult = new FetchResultParser({
				describeMetadataResult: describeMetadataResult,
				fileProperties: [
					fileProperties.ApexClass.al__SoqlBuilder
				]
			});
			fetchResult.filterManaged();
			assert.deepEqual(fetchResult.fileProperties.length, 0);
		});
		it('should filter InstalledPackages', function() {
			var fetchResult = new FetchResultParser({
				describeMetadataResult: describeMetadataResult,
				fileProperties: [
					fileProperties.InstalledPackage.al
				]
			});
			fetchResult.filterManaged();
			assert.deepEqual(fetchResult.fileProperties.length, 0);
		});
	});
	describe('#transform()', function() {
		it('should transform a DocumentFolder to a Document', function() {
			var fetchResult = new FetchResultParser({
				describeMetadataResult: describeMetadataResult,
				fileProperties: [
					fileProperties.DocumentFolder.various
				]
			});
			fetchResult.transform();
			assert.deepEqual(fetchResult.fileProperties.length, 1);
			assert.deepEqual(new MetadataComponent(fetchResult.fileProperties[0]).toString(), 'Document/various');
		});
		it('should transform a non-versioned Flow to a versioned Flow', function() {
			var fetchResult = new FetchResultParser({
				describeMetadataResult: describeMetadataResult,
				fileProperties: [
					fileProperties.Flow.UnversionedFlow
				],
				flowDefinitions: soqlResponses.flowDefinitions
			});
			fetchResult.transform();
			assert.deepEqual(fetchResult.fileProperties.length, 1);
			assert.deepEqual(new MetadataComponent(fetchResult.fileProperties[0]).toString(), 'Flow/UnversionedFlow-1');
		});
		it('should transform an Account RecordType to a PersonAccount RecordType using SOQL', function() {
			var fetchResult = new FetchResultParser({
				describeMetadataResult: describeMetadataResult,
				fileProperties: [
					fileProperties.RecordType.PersonAccount.Trader
				],
				personAccountRecordTypes: soqlResponses.personAccountRecordTypes
			});
			fetchResult.transform();
			assert.deepEqual(fetchResult.fileProperties.length, 1);
			assert.deepEqual(new MetadataComponent(fetchResult.fileProperties[0]).toString(), 'RecordType/PersonAccount.Trader');
		});
		it('should filter the PersonAccount CustomObject but children should remain', function() {
			var fetchResult = new FetchResultParser({
				describeMetadataResult: describeMetadataResult,
				fileProperties: [
					fileProperties.CustomObject.PersonAccount,
					fileProperties.RecordType.PersonAccount.Trader
				],
				personAccountRecordTypes: soqlResponses.personAccountRecordTypes
			});
			fetchResult.transform();
			fetchResult.filterInvalid();
			assert.deepEqual(fetchResult.fileProperties.length, 1);
			assert.deepEqual(new MetadataComponent(fetchResult.fileProperties[0]).toString(), 'RecordType/PersonAccount.Trader');
		});
	});
	describe('#filterInvalid()', function() {
		it('should filter standard fileProperties', function() {
			var fetchResult = new FetchResultParser({
				describeMetadataResult: describeMetadataResult,
				fileProperties: [
					fileProperties.DocumentFolder.unfiled_public,
					fileProperties.EmailFolder.unfiled_public
				]
			});
			fetchResult.filterInvalid();
			assert.deepEqual(fetchResult.fileProperties.length, 0);
			// we don't consider this as a warning
			assert.deepEqual(fetchResult.getWarnings().length, 0);
		});
		it('should filter non-global QuickActions', function() {
			var fetchResult = new FetchResultParser({
				describeMetadataResult: describeMetadataResult,
				fileProperties: [
					fileProperties.QuickAction.Invalid
				]
			});
			fetchResult.filterInvalid();
			assert.deepEqual(fetchResult.fileProperties.length, 0);
			assert.deepEqual(fetchResult.getWarnings().length, 1);
		});
		it('should filter non-versioned Flows', function() {
			var fetchResult = new FetchResultParser({
				describeMetadataResult: describeMetadataResult,
				fileProperties: [
					fileProperties.Flow.UnversionedFlow
				]
			});
			fetchResult.filterInvalid();
			assert.deepEqual(fetchResult.fileProperties.length, 0);
			assert.deepEqual(fetchResult.getWarnings().length, 1);
		});
	});
});
