"use strict";

var assert = require("assert");
var path = require('path');
var Manifest = require('../lib/manifest');
var MetadataComponent = require('../lib/metadata-component');

var testManifests = require('./metadata-parts/manifest');

describe('Manifest', function() {
	describe('#constructor()', function() {
		it('should initialize a Manifest and remove duplicate components', function() {
			var manifest = new Manifest({
				manifestJSON: [new MetadataComponent('ApexClass/TestClass'), new MetadataComponent('ApexClass/TestClass')]
			});
			assert.deepEqual(manifest.manifest().length, 1);
		});
	});
	describe('#rollup()', function() {
		it('should transform a list of metadata components to resolve to its parent', function() {
			var manifest = new Manifest();
			manifest.add(new MetadataComponent({
				type: 'ProfileApexClassAccess',
				fullName: 'Admin.TestClass',
				fileName: 'profiles/Admin.profile'
			}));
			assert.deepEqual(manifest.rollup().getComponentNames(), ['Profile/Admin']);
		});
	});
	describe('#filterUnnamed()', function() {
		it('should filter a list of metadata components to ignore unnamed child components', function() {
			var manifest = new Manifest();
			manifest.add(new MetadataComponent({
				type: 'ProfileApexClassAccess',
				fullName: 'Admin.TestClass',
				fileName: 'profiles/Admin.profile'
			}));
			assert.deepEqual(manifest.filterUnnamed().getComponentNames(), []);
		});
	});
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
	describe('#remove()', function() {
		it('should remove components from the manifest matching the given patterns', function() {
			var manifest = new Manifest({
				manifestJSON: testManifests.components
			});
			var numberOfComponents = manifest.manifest().length;
			manifest.remove(['ApexPage/*']);
			assert.deepEqual(manifest.manifest().length, numberOfComponents - 2);
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
			assert.equal(manifest.manifestJSON.length, 5);
		});
	});
	describe('#getMetadataTypes()', function() {
		it('should return a list of metadataTypes', function() {
			var manifest = new Manifest({
				manifestJSON: testManifests.components
			});
			assert.deepEqual(manifest.getMetadataTypes(), ['ApexComponent', 'ApexPage', 'CustomLabel']);
		});
	});
	describe('#getFileNames()', function() {
		it('should return a list of fileNames', function() {
			var manifest = new Manifest({
				manifestJSON: testManifests.components
			});
			assert.deepEqual(manifest.getFileNames(), [path.join('components', 'C1.component'), path.join('components', 'Z1.component'), path.join('labels', 'CustomLabels.labels'), path.join('pages', 'Test.page'), path.join('pages', 'Test2.page')]);
		});
	});
	describe('#getComponentNames()', function() {
		it('should return a list of componentNames', function() {
			var manifest = new Manifest({
				manifestJSON: testManifests.components
			});
			assert.deepEqual(manifest.getComponentNames(), ['ApexComponent/C1', 'ApexComponent/Z1', 'ApexPage/Test', 'ApexPage/Test2', 'CustomLabel/MyLabel']);
		});
	});
	describe('#getMatches()', function() {
		it('should filter a list of metadata components specified by type + fullName patterns', function() {
			assert.deepEqual(new Manifest({
				manifestJSON: testManifests.components
			}).getMatches(['**/*']).getComponentNames(), ['ApexComponent/C1', 'ApexComponent/Z1', 'ApexPage/Test', 'ApexPage/Test2', 'CustomLabel/MyLabel']);
			assert.deepEqual(new Manifest({
				manifestJSON: testManifests.components
			}).getMatches(['**/*Test*']).getComponentNames(), ['ApexPage/Test', 'ApexPage/Test2']);
			assert.deepEqual(new Manifest({
				manifestJSON: testManifests.components
			}).getMatches(['ApexComponent/*']).getComponentNames(), ['ApexComponent/C1', 'ApexComponent/Z1']);
		});
	});
	describe('#getNotIgnoredMatches()', function() {
		it('should filter a list of metadata components specified by type + fullName patterns', function() {
			assert.deepEqual(new Manifest({
				manifestJSON: testManifests.components
			}).getNotIgnoredMatches([]).getComponentNames(), ['ApexComponent/C1', 'ApexComponent/Z1', 'ApexPage/Test', 'ApexPage/Test2', 'CustomLabel/MyLabel']);
			assert.deepEqual(new Manifest({
				manifestJSON: testManifests.components
			}).getNotIgnoredMatches(['CustomLabel/*']).getComponentNames(), ['ApexComponent/C1', 'ApexComponent/Z1', 'ApexPage/Test', 'ApexPage/Test2']);
			assert.deepEqual(new Manifest({
				manifestJSON: testManifests.components
			}).getNotIgnoredMatches(['**/*Test*']).getComponentNames(), ['ApexComponent/C1', 'ApexComponent/Z1', 'CustomLabel/MyLabel']);
			assert.deepEqual(new Manifest({
				manifestJSON: testManifests.components
			}).getNotIgnoredMatches(['CustomLabel/*', 'ApexPage/*']).getComponentNames(), ['ApexComponent/C1', 'ApexComponent/Z1']);
			assert.deepEqual(new Manifest({
				manifestJSON: testManifests.components
			}).getNotIgnoredMatches(['**/*', '!*/Test*']).getComponentNames(), ['ApexPage/Test', 'ApexPage/Test2']);
			assert.deepEqual(new Manifest({
				manifestJSON: testManifests.components
			}).getNotIgnoredMatches(['**/*', '!*/Test*', '*/*2']).getComponentNames(), ['ApexPage/Test']);
		});
	});
	describe('#filterTypes()', function() {
		it('should filter a list of metadata components by a list of metadataTypes', function() {
			assert.deepEqual(new Manifest({
				manifestJSON: testManifests.components
			}).filterTypes([]).getComponentNames(), []);
			assert.deepEqual(new Manifest({
				manifestJSON: testManifests.components
			}).filterTypes(['ApexComponent']).getComponentNames(), ['ApexComponent/C1', 'ApexComponent/Z1']);
			assert.deepEqual(new Manifest({
				manifestJSON: testManifests.components
			}).filterTypes(['ApexComponent', 'ApexPage']).getComponentNames(), ['ApexComponent/C1', 'ApexComponent/Z1', 'ApexPage/Test', 'ApexPage/Test2']);
		});
	});
	describe('#filterStandard()', function() {
		it('should filter a list of metadata components remaining custom metadata only', function() {
			assert.deepEqual(new Manifest({
				manifestJSON: testManifests.components
			}).filterStandard().getComponentNames(), ['ApexComponent/C1', 'ApexComponent/Z1', 'ApexPage/Test', 'ApexPage/Test2', 'CustomLabel/MyLabel']);
			// now add standard components
			var manifest = new Manifest({
				manifestJSON: testManifests.components
			});
			manifest.add(new MetadataComponent('CustomObject/Account'));
			manifest.add(new MetadataComponent('AppMenu/Salesforce1'));
			manifest.add(new MetadataComponent('Document/MyFolder'));
			manifest.add(new MetadataComponent('MatchingRule/Account.Standard_Account_Match_Rule_v1_0'));
			manifest.add(new MetadataComponent('CustomApplication/standard__Sales'));
			assert.deepEqual(manifest.filterStandard().getComponentNames(), ['ApexComponent/C1', 'ApexComponent/Z1', 'ApexPage/Test', 'ApexPage/Test2', 'CustomLabel/MyLabel']);
		});
	});
});
