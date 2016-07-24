"use strict";

var assert = require("assert");
var path = require("path");
var MetadataFile = require("../lib/metadata-file");

describe('MetadataFile', function() {
	describe('#MetadataFile()', function() {
		it('should parse a filepath', function() {
			var f = new MetadataFile({
				path: path.join('pages', 'Test.page')
			});
			assert.deepEqual(f.path, path.join('pages', 'Test.page'));
			assert.deepEqual(f.extnameWithoutDot(), 'page');
			assert.deepEqual(f.filename(), 'Test');
			assert.deepEqual(f.basename, 'Test.page');
			assert.deepEqual(f.basenameDirname(), 'pages');
			assert.deepEqual(f.parentDirname(), null);

			f = new MetadataFile({
				path: path.join('pages', 'Test.page-meta.xml')
			});
			assert.deepEqual(f.path, path.join('pages/Test.page-meta.xml'));
			assert.deepEqual(f.extnameWithoutDot(), 'xml');
			assert.deepEqual(f.filename(), 'Test.page-meta');
			assert.deepEqual(f.basename, 'Test.page-meta.xml');
			assert.deepEqual(f.basenameDirname(), 'pages');
			assert.deepEqual(f.parentDirname(), null);

			f = new MetadataFile({
				path: path.join('aura', 'TestApp', 'TestApp.cmp')
			});
			assert.deepEqual(f.path, path.join('aura', 'TestApp', 'TestApp.cmp'));
			assert.deepEqual(f.extnameWithoutDot(), 'cmp');
			assert.deepEqual(f.filename(), 'TestApp');
			assert.deepEqual(f.basename, 'TestApp.cmp');
			assert.deepEqual(f.basenameDirname(), 'TestApp');
			assert.deepEqual(f.parentDirname(), 'aura');

			f = new MetadataFile({
				path: path.join('documents', 'unfiled$public', 'foo.png')
			});
			assert.deepEqual(f.path, path.join('documents', 'unfiled$public', 'foo.png'));
			assert.deepEqual(f.extnameWithoutDot(), 'png');
			assert.deepEqual(f.filename(), 'foo');
			assert.deepEqual(f.basename, 'foo.png');
			assert.deepEqual(f.basenameDirname(), path.join('unfiled$public'));
			assert.deepEqual(f.parentDirname(), 'documents');
		});
	});
	describe('#getComponent()', function() {
		it('should return a component for a file', function() {
			var component = new MetadataFile({
				path: path.join('objects', 'Account.object')
			}).getComponent();
			assert.deepEqual(component.type, 'CustomObject');
			assert.deepEqual(component.fileName, path.join('objects', 'Account.object'));
			assert.deepEqual(component.fullName, 'Account');
			assert.deepEqual(component.toString(), 'CustomObject/Account');
		});
		it('should return a component for an AuraDefinitionBundle', function() {
			var component = new MetadataFile({
				path: path.join('aura', 'TestApp')
			}).getComponent();
			assert.deepEqual(component.type, 'AuraDefinitionBundle');
			assert.deepEqual(component.fileName, path.join('aura', 'TestApp'));
			assert.deepEqual(component.fullName, 'TestApp');
			assert.deepEqual(component.toString(), 'AuraDefinitionBundle/TestApp');
		});
		it('should return a component for a file belonging to an AuraDefinitionBundle', function() {
			var component = new MetadataFile({
				path: path.join('aura', 'TestApp', 'TestApp.cmp')
			}).getComponent();
			assert.deepEqual(component.type, 'AuraDefinitionBundle');
			assert.deepEqual(component.fileName, path.join('aura', 'TestApp'));
			assert.deepEqual(component.fullName, 'TestApp');
			assert.deepEqual(component.toString(), 'AuraDefinitionBundle/TestApp');
		});
		it('should return a component for a folder', function() {
			var component = new MetadataFile({
				path: path.join('documents', 'MyFolder')
			}).getComponent();
			assert.deepEqual(component.type, 'Document');
			assert.deepEqual(component.fileName, path.join('documents', 'MyFolder'));
			assert.deepEqual(component.fullName, 'MyFolder');
			assert.deepEqual(component.toString(), 'Document/MyFolder');
		});
		it('should return a component for a file in a folder', function() {
			var component = new MetadataFile({
				path: path.join('documents', 'MyFolder', 'MyFile.pdf')
			}).getComponent();
			assert.deepEqual(component.type, 'Document');
			assert.deepEqual(component.fileName, path.join('documents', 'MyFolder', 'MyFile.pdf'));
			assert.deepEqual(component.fullName, 'MyFolder/MyFile.pdf');
			assert.deepEqual(component.toString(), 'Document/MyFolder/MyFile.pdf');
		});
		it('should return null otherwise', function() {
			var component = new MetadataFile({
				path: path.join('foo', 'bar')
			}).getComponent();
			assert.deepEqual(component, null);
		});
	});
	describe('#diff()', function() {
		it('should return added ApexPage', function() {
			var mf1 = new MetadataFile();
			var mf2 = new MetadataFile({
				path: path.join('pages', 'Test.page')
			});
			var diffResult = mf1.diff(mf2);
			assert.deepEqual(diffResult.added.manifest().length, 1);
			assert.deepEqual(diffResult.modified.manifest().length, 0);
			assert.deepEqual(diffResult.deleted.manifest().length, 0);
			assert.deepEqual(diffResult.added.manifest()[0].toString(), 'ApexPage/Test');
		});
		it('should return modified ApexPage', function() {
			var mf1 = new MetadataFile({
				path: path.join('pages', 'Test.page'),
				contents: new Buffer('<apex:page ><h1>Hello World!</h1></apex:page>')
			});
			var mf2 = new MetadataFile({
				path: path.join('pages', 'Test.page'),
				contents: new Buffer('<apex:page ><h1>Bye World!</h1></apex:page>')
			});
			var diffResult = mf1.diff(mf2);
			assert.deepEqual(diffResult.added.manifest().length, 0);
			assert.deepEqual(diffResult.modified.manifest().length, 1);
			assert.deepEqual(diffResult.deleted.manifest().length, 0);
			assert.deepEqual(diffResult.modified.manifest()[0].toString(), 'ApexPage/Test');
		});
		it('should return deleted ApexPage', function() {
			var mf1 = new MetadataFile();
			var mf2 = new MetadataFile({
				path: path.join('pages', 'Test.page')
			});
			var diffResult = mf1.diff(mf2);
			assert.deepEqual(diffResult.added.manifest().length, 1);
			assert.deepEqual(diffResult.modified.manifest().length, 0);
			assert.deepEqual(diffResult.deleted.manifest().length, 0);
			assert.deepEqual(diffResult.added.manifest()[0].toString(), 'ApexPage/Test');
		});
	});
	describe('#getMetadataType()', function() {
		it('should return a metadata type for a file', function() {
			var f = new MetadataFile({
				path: path.join('classes', 'Test.cls')
			});
			var metadataType = f.getMetadataType();
			assert(metadataType);
			assert.deepEqual(metadataType.xmlName, 'ApexClass');
		});
	});
});
