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
			// KeywordList and ModerationRule use the same directoryName 'moderation'
			// WaveApplication, WaveDashboard, WaveDataflow, WaveDataset, WaveLens, WaveRecipe, WaveXmd use the same directoryName 'wave'
			var reusedDirectoryCount = ['KeywordList', 'ModerationRule',
				'WaveApplication', 'WaveDashboard', 'WaveDataflow', 'WaveDataset', 'WaveLens', 'WaveRecipe', 'WaveXmd'
			].length - ['moderation', 'wave'].length;
			assert.equal(describeMetadataService.getDirectoryNames().length, numberOfMetadataObjects - reusedDirectoryCount);
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
			assert.deepEqual(describeMetadataService.getTypeForFilepath(path.join('pages', 'Test.page-meta.xml')).xmlName, 'ApexPage');
			assert.deepEqual(describeMetadataService.getTypeForFilepath(path.join('objects', 'Account.object')).xmlName, 'CustomObject');
			assert.deepEqual(describeMetadataService.getTypeForFilepath(path.join('aura', 'TestApp')).xmlName, 'AuraDefinitionBundle');
			assert.deepEqual(describeMetadataService.getTypeForFilepath(path.join('aura', 'TestApp', 'TestApp.app')).xmlName, 'AuraDefinitionBundle');
			assert.deepEqual(describeMetadataService.getTypeForFilepath(path.join('aura', 'TestApp', 'TestApp.cmp')).xmlName, 'AuraDefinitionBundle');
			assert.deepEqual(describeMetadataService.getTypeForFilepath(path.join('aura', 'TestApp', 'TestApp.js')).xmlName, 'AuraDefinitionBundle');
			assert.deepEqual(describeMetadataService.getTypeForFilepath(path.join('aura', 'TestApp', 'TestApp.css')).xmlName, 'AuraDefinitionBundle');
			assert.deepEqual(describeMetadataService.getTypeForFilepath(path.join('wave', 'Test.wapp')).xmlName, 'WaveApplication');
			assert.deepEqual(describeMetadataService.getTypeForFilepath(path.join('wave', 'Test.wdash')).xmlName, 'WaveDashboard');
			assert.deepEqual(describeMetadataService.getTypeForFilepath(path.join('wave', 'Test.wdash-meta.xml')).xmlName, 'WaveDashboard');
			assert.deepEqual(describeMetadataService.getTypeForFilepath(path.join('wave', 'Test.wdf')).xmlName, 'WaveDataflow');
			assert.deepEqual(describeMetadataService.getTypeForFilepath(path.join('wave', 'Test.wdf-meta.xml')).xmlName, 'WaveDataflow');
			assert.deepEqual(describeMetadataService.getTypeForFilepath(path.join('wave', 'Test.wds')).xmlName, 'WaveDataset');
			assert.deepEqual(describeMetadataService.getTypeForFilepath(path.join('wave', 'Test.wlens')).xmlName, 'WaveLens');
			assert.deepEqual(describeMetadataService.getTypeForFilepath(path.join('wave', 'Test.wlens-meta.xml')).xmlName, 'WaveLens');
			assert.deepEqual(describeMetadataService.getTypeForFilepath(path.join('wave', 'Test.wdpr')).xmlName, 'WaveRecipe');
			assert.deepEqual(describeMetadataService.getTypeForFilepath(path.join('wave', 'Test.wdpr-meta.xml')).xmlName, 'WaveRecipe');
			assert.deepEqual(describeMetadataService.getTypeForFilepath(path.join('wave', 'Test.xmd')).xmlName, 'WaveXmd');
			assert.deepEqual(describeMetadataService.getTypeForFilepath(path.join('wave', 'Test.xmd-meta.xml')).xmlName, 'WaveXmd');
			assert.deepEqual(describeMetadataService.getTypeForFilepath(path.join('waveTemplates', 'TestAnalyticsBundle')).xmlName, 'WaveTemplateBundle');
			assert.deepEqual(describeMetadataService.getTypeForFilepath(path.join('waveTemplates', 'TestAnalyticsBundle', 'dashboards', 'Service_Omni.json')).xmlName, 'WaveTemplateBundle');
			assert.deepEqual(describeMetadataService.getTypeForFilepath(path.join('waveTemplates', 'TestAnalyticsBundle', 'dataflows', 'ServiceAnalyticsDataflow.json')).xmlName, 'WaveTemplateBundle');
			assert.deepEqual(describeMetadataService.getTypeForFilepath(path.join('waveTemplates', 'TestAnalyticsBundle', 'dataset_files', 'ServiceActivity_XMD_20_template.json')).xmlName, 'WaveTemplateBundle');
			assert.deepEqual(describeMetadataService.getTypeForFilepath(path.join('waveTemplates', 'TestAnalyticsBundle', 'DatasetUserXmd_XMD.json')).xmlName, 'WaveTemplateBundle');
			assert.deepEqual(describeMetadataService.getTypeForFilepath(path.join('waveTemplates', 'TestAnalyticsBundle', 'folder.json')).xmlName, 'WaveTemplateBundle');
			assert.deepEqual(describeMetadataService.getTypeForFilepath(path.join('waveTemplates', 'TestAnalyticsBundle', 'macros.json')).xmlName, 'WaveTemplateBundle');
			assert.deepEqual(describeMetadataService.getTypeForFilepath(path.join('waveTemplates', 'TestAnalyticsBundle', 'releasenotes.html')).xmlName, 'WaveTemplateBundle');
			assert.deepEqual(describeMetadataService.getTypeForFilepath(path.join('waveTemplates', 'TestAnalyticsBundle', 'rules.json')).xmlName, 'WaveTemplateBundle');
			assert.deepEqual(describeMetadataService.getTypeForFilepath(path.join('waveTemplates', 'TestAnalyticsBundle', 'template-info.json')).xmlName, 'WaveTemplateBundle');
			assert.deepEqual(describeMetadataService.getTypeForFilepath(path.join('waveTemplates', 'TestAnalyticsBundle', 'template-to-app-rules.json')).xmlName, 'WaveTemplateBundle');
			assert.deepEqual(describeMetadataService.getTypeForFilepath(path.join('waveTemplates', 'TestAnalyticsBundle', 'ui.json')).xmlName, 'WaveTemplateBundle');
			assert.deepEqual(describeMetadataService.getTypeForFilepath(path.join('waveTemplates', 'TestAnalyticsBundle', 'variables.json')).xmlName, 'WaveTemplateBundle');
			assert.deepEqual(describeMetadataService.getTypeForFilepath(path.join('reports', 'unfiled$public')).xmlName, 'ReportFolder');
			assert.deepEqual(describeMetadataService.getTypeForFilepath(path.join('reports', 'unfiled$public', 'Foo.report')).xmlName, 'Report');
			assert.deepEqual(describeMetadataService.getTypeForFilepath(path.join('documents', 'unfiled$public')).xmlName, 'DocumentFolder');
			assert.deepEqual(describeMetadataService.getTypeForFilepath(path.join('documents', 'unfiled$public', 'Foo')).xmlName, 'Document');
			assert.deepEqual(describeMetadataService.getTypeForFilepath(path.join("documents", "unfiled$public", "Foo.bin")).xmlName, "Document");
			assert.deepEqual(describeMetadataService.getTypeForFilepath(path.join("documents", "documents")).xmlName, "DocumentFolder");
			assert.deepEqual(describeMetadataService.getTypeForFilepath(path.join("documents", "documents", "Foo")).xmlName, "Document");
			assert.deepEqual(describeMetadataService.getTypeForFilepath(path.join("documents", "documents", "Foo.bin")).xmlName, "Document");
		});
		it('should return undefined for an invalid file path', function() {
			assert.deepEqual(describeMetadataService.getTypeForFilepath(path.join('foo', 'bar')), undefined);
		});
	});
});
