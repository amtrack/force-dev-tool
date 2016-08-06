"use strict";

var assert = require("assert");
var Manifest = require('../lib/manifest');
var MetadataComponent = require('../lib/metadata-component');

var testManifests = require('./metadata-parts/manifest');

describe('Manifest', function() {
	describe('#manifest()', function() {
		it('should return an empty manifest as JSON', function() {
			var manifest = new Manifest();
			assert.deepEqual(manifest.manifest(), []);
		});
		it('should return the manifest as JSON', function() {
			var manifest = new Manifest({
				manifestJSON: testManifests.components
			});
			assert.deepEqual(manifest.manifest(), testManifests.components);
		});
	});
	describe('#add()', function() {
		it('should add a component to the manifest if not already included', function() {
			var manifest = new Manifest({
				manifestJSON: testManifests.components
			});
			var numberOfComponents = manifest.manifest().length;
			manifest.add(new MetadataComponent('ApexPage/Test3'));
			assert.deepEqual(manifest.manifest().length, numberOfComponents + 1);
		});
	});
	describe('#getJSON()', function() {
		it('should return a JSON representation to be used for jsforce', function() {
			var manifest = new Manifest({
				manifestJSON: testManifests.components
			});
			manifest.apiVersion = "33.0";
			assert.deepEqual(manifest.getJSON(), {
				types: [{
					members: ["C1", "Z1"],
					name: ["ApexComponent"]
				}, {
					members: ["Test", "Test2"],
					name: ["ApexPage"]
				}, {
					members: ["MyLabel"],
					name: ["CustomLabel"]
				}, {
					members: ["CustomLabels"],
					name: ["CustomLabels"]
				}],
				version: ["33.0"]
			});
		});
	});
	describe('#toPackageXml()', function() {
		it('should match the sample XML', function() {
			var manifest = new Manifest({
				manifestJSON: testManifests.components
			});
			manifest.apiVersion = "33.0";
			assert.equal(manifest.toPackageXml(), testManifests.packageXml);
		});
	});
	describe('#fromPackageXml(), #toPackageXml()', function() {
		it('should parse the sample XML', function() {
			var manifest = Manifest.fromPackageXml(testManifests.packageXml);
			assert.equal(manifest.toPackageXml(), testManifests.packageXml);
		});
	});
	describe('#fromFetchResult()', function() {
		it('should parse a fetch result', function() {
			var describeMetadataResult = require('../lib/describe-metadata-result.json');
			var fileProperties = require('./data/fetch-results/file-properties');
			var manifest = Manifest.fromFetchResult({
				describeMetadataResult: describeMetadataResult,
				fileProperties: [
					fileProperties.CustomLabels.CustomLabels,
					fileProperties.CustomLabel.MyLabel,
					fileProperties.ApexComponent.C1,
					fileProperties.ApexComponent.Z1,
					fileProperties.ApexPage.Test,
					fileProperties.ApexPage.Test2
				]
			});
			assert.equal(manifest.manifestJSON.length, 6);
		});
	});
	describe('#getMetadataTypes()', function() {
		it('should return a list of metadataTypes', function() {
			var manifest = new Manifest({
				manifestJSON: testManifests.components
			});
			assert.deepEqual(manifest.getMetadataTypes(), ['ApexComponent', 'ApexPage', 'CustomLabel', 'CustomLabels']);
		});
	});
	describe('#getFileNames()', function() {
		it('should return a list of fileNames', function() {
			var manifest = new Manifest({
				manifestJSON: testManifests.components
			});
			assert.deepEqual(manifest.getFileNames(), ['components/C1.component', 'components/Z1.component', 'labels/CustomLabels.labels', 'pages/Test.page', 'pages/Test2.page']);
		});
	});
	describe('#getComponentNames()', function() {
		it('should return a list of componentNames', function() {
			var manifest = new Manifest({
				manifestJSON: testManifests.components
			});
			assert.deepEqual(manifest.getComponentNames(), ['ApexComponent/C1', 'ApexComponent/Z1', 'ApexPage/Test', 'ApexPage/Test2', 'CustomLabel/MyLabel', 'CustomLabels/CustomLabels']);
		});
	});
	describe('#getMatches()', function() {
		it('should filter a list of metadata components specified by type + fullName patterns', function() {
			assert.deepEqual(new Manifest({
				manifestJSON: testManifests.components
			}).getMatches(['**/*']).getFileNames(), ['components/C1.component', 'components/Z1.component', 'labels/CustomLabels.labels', 'pages/Test.page', 'pages/Test2.page']);
			assert.deepEqual(new Manifest({
				manifestJSON: testManifests.components
			}).getMatches(['**/*Test*']).getFileNames(), ['pages/Test.page', 'pages/Test2.page']);
			assert.deepEqual(new Manifest({
				manifestJSON: testManifests.components
			}).getMatches(['ApexComponent/*']).getFileNames(), ['components/C1.component', 'components/Z1.component']);
		});
	});
	describe('#getNotIgnoredMatches()', function() {
		it('should filter a list of metadata components specified by type + fullName patterns', function() {
			assert.deepEqual(new Manifest({
				manifestJSON: testManifests.components
			}).getNotIgnoredMatches([]).getFileNames(), ['components/C1.component', 'components/Z1.component', 'labels/CustomLabels.labels', 'pages/Test.page', 'pages/Test2.page']);
			assert.deepEqual(new Manifest({
				manifestJSON: testManifests.components
			}).getNotIgnoredMatches(['CustomLabel/*', 'CustomLabels/*']).getFileNames(), ['components/C1.component', 'components/Z1.component', 'pages/Test.page', 'pages/Test2.page']);
			assert.deepEqual(new Manifest({
				manifestJSON: testManifests.components
			}).getNotIgnoredMatches(['**/*Test*']).getFileNames(), ['components/C1.component', 'components/Z1.component', 'labels/CustomLabels.labels']);
			assert.deepEqual(new Manifest({
				manifestJSON: testManifests.components
			}).getNotIgnoredMatches(['CustomLabel/*', 'CustomLabels/*', 'ApexPage/*']).getFileNames(), ['components/C1.component', 'components/Z1.component']);
		});
	});
	describe('#filterTypes()', function() {
		it('should filter a list of metadata components by a list of metadataTypes', function() {
			assert.deepEqual(new Manifest({
				manifestJSON: testManifests.components
			}).filterTypes([]).getFileNames(), []);
			assert.deepEqual(new Manifest({
				manifestJSON: testManifests.components
			}).filterTypes(['ApexComponent']).getFileNames(), ['components/C1.component', 'components/Z1.component']);
			assert.deepEqual(new Manifest({
				manifestJSON: testManifests.components
			}).filterTypes(['ApexComponent', 'ApexPage']).getFileNames(), ['components/C1.component', 'components/Z1.component', 'pages/Test.page', 'pages/Test2.page']);
		});
	});
	describe('#filterStandard()', function() {
		it('should filter a list of metadata components remaining custom metadata only', function() {
			assert.deepEqual(new Manifest({
				manifestJSON: testManifests.components
			}).filterStandard().getFileNames(), ['components/C1.component', 'components/Z1.component', 'labels/CustomLabels.labels', 'pages/Test.page', 'pages/Test2.page']);
			// now add standard components
			var manifest = new Manifest({
				manifestJSON: testManifests.components
			});
			manifest.add(new MetadataComponent('CustomObject/Account'));
			manifest.add(new MetadataComponent('AppMenu/Salesforce1'));
			manifest.add(new MetadataComponent('Document/MyFolder'));
			manifest.add(new MetadataComponent('MatchingRule/Account.Standard_Account_Match_Rule_v1_0'));
			manifest.add(new MetadataComponent('CustomApplication/standard__Sales'));
			assert.deepEqual(manifest.filterStandard().getFileNames(), ['components/C1.component', 'components/Z1.component', 'labels/CustomLabels.labels', 'pages/Test.page', 'pages/Test2.page']);
		});
	});
});
