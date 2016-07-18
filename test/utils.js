"use strict";

var assert = require("assert");
var metadataUtils = require("../lib/utils");
var path = require('path');

describe('MetadataUtils', function() {
	describe('#getFileNameWithoutExtension()', function() {
		it('should return the filename without extension', function() {
			assert.deepEqual(metadataUtils.getFileNameWithoutExtension(path.join('pages', 'Test.page')), 'Test');
			assert.deepEqual(metadataUtils.getFileNameWithoutExtension(path.join('pages', 'Test')), 'Test');
		});
	});

	describe('#getFileExtension()', function() {
		it('should return the file extension without dot', function() {
			assert.deepEqual(metadataUtils.getFileExtension(path.join('pages', 'Test.page')), 'page');
			assert.deepEqual(metadataUtils.getFileExtension(path.join('pages', 'Test.page-meta.xml')), 'xml');
			assert.deepEqual(metadataUtils.getFileExtension('foo'), '');
			assert.deepEqual(metadataUtils.getFileExtension('.editorconfig'), 'editorconfig');
		});
	});

	describe('#getMetadataFilenameForMetaFilename()', function() {
		it('should return the filename for a meta filename', function() {
			assert.deepEqual(metadataUtils.getMetadataFilenameForMetaFilename(path.join('pages', 'Test.page-meta.xml')), path.join('pages', 'Test.page'));
		});
	});

	describe('#isValidFilename()', function() {
		it('should check if a filename is a valid metadata filename', function() {
			assert(metadataUtils.isValidFilename(path.join('pages', 'Test.page')));
			assert(metadataUtils.isValidFilename(path.join('aura', 'TestApp', 'TestApp.cmp')));
			assert(metadataUtils.isValidFilename(path.join('documents', 'unfiled$public', 'foo.png')));
			assert(metadataUtils.isValidFilename(path.join('email', 'unfiled$public', 'Test.email')));

			assert(!metadataUtils.isValidFilename(path.join('pages', 'Test.page-meta.xml')));
			assert(!metadataUtils.isValidFilename(path.join('foo', 'bar.txt')));
			assert(!metadataUtils.isValidFilename(path.join('..', 'bar.txt')));
			assert(!metadataUtils.isValidFilename('README.txt'));
			assert(!metadataUtils.isValidFilename('.editorconfig'));
		});
	});

	describe('#isValidMetaFilename()', function() {
		it('should check if a filename is a valid metadata meta filename', function() {
			assert(!metadataUtils.isValidMetaFilename(path.join('pages', 'Test.page')));
			assert(metadataUtils.isValidMetaFilename(path.join('pages', 'Test.page-meta.xml')));
			assert(!metadataUtils.isValidMetaFilename(path.join('foo', 'Foo')));
		});
	});

	describe('#compareMetadataTypeNames()', function() {
		it('should sort an array of metadata type names according to Salesforce', function() {
			var unsorted = ['Settings', 'ApexPage', 'ApexClass', 'Workflow'];
			var expected = ['ApexClass', 'ApexPage', 'Workflow', 'Settings'];
			assert.deepEqual(unsorted.sort(metadataUtils.compareMetadataTypeNames), expected);
		});
	});

	describe('#compareMetadataFileNames()', function() {
		it('should sort an array of metadata file names according to Salesforce', function() {
			var unsorted = ['D', 'C', 'B', 'A'];
			var expected = ['A', 'B', 'C', 'D'];
			assert.deepEqual(unsorted.sort(metadataUtils.compareMetadataFileNames), expected);
		});
	});

	describe('#compareMetadataFullNames()', function() {
		it('should sort an array of metadata full names according to Salesforce', function() {
			var unsorted = ['D', 'C', 'B', 'A'];
			var expected = ['A', 'B', 'C', 'D'];
			assert.deepEqual(unsorted.sort(metadataUtils.compareMetadataFullNames), expected);
		});
	});
});
