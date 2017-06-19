"use strict";

var assert = require("assert");
var path = require("path");
var MetadataContainer = require("../lib/metadata-container");
var MetadataFile = require("../lib/metadata-file");
var MetadataFileContainer = require("../lib/metadata-file-container");
var MetadataComponent = require("../lib/metadata-component");
var Manifest = require("../lib/manifest");
var TestObject = require("./metadata-parts/objects");

var objectWithOneTestField = [TestObject.header, TestObject.fields.textField1, TestObject.footer].join("\n");
var objectWithTwoTestFields = [TestObject.header, TestObject.fields.textField1, TestObject.fields.textField2, TestObject.footer].join("\n");

var customObject = new MetadataFileContainer({
	path: path.join("objects", "Account.object"),
	contents: new Buffer(objectWithTwoTestFields)
});

var vinyls = [
	new MetadataFile({
		path: path.join("classes", "Test.cls"),
		contents: new Buffer("")
	}),
	new MetadataFile({
		path: path.join("classes", "Test.cls-meta.xml"),
		contents: new Buffer("")
	}),
	new MetadataFile({
		path: path.join("pages", "Test.page"),
		contents: new Buffer("")
	}),
	new MetadataFile({
		path: path.join("pages", "Test.page-meta.xml"),
		contents: new Buffer("")
	})
];

describe('MetadataContainer', function() {

	describe('#constructor', function() {
		it('should initialize an empty container', function() {
			var metadataContainer = new MetadataContainer();
			assert.deepEqual(metadataContainer.vinyls.length, 0);
			assert.deepEqual(metadataContainer.manifest.manifest().length, 0);
		});
		it('should initialize a container with some apex and visualforce files', function() {
			var metadataContainer = new MetadataContainer({
				vinyls: vinyls
			});
			assert.deepEqual(metadataContainer.vinyls.length, 4);
			assert.deepEqual(metadataContainer.manifest.manifest().length, 2);
		});
		it('should initialize a container with a custom object', function() {
			var metadataContainer = new MetadataContainer({
				vinyls: [customObject]
			});
			assert.deepEqual(metadataContainer.vinyls.length, 1);
			assert.deepEqual(metadataContainer.manifest.manifest().length, 2);
		});
	});

	describe('#add()', function() {
		var metadataContainer = new MetadataContainer();
		it('should add a MetadataFile to a container', function() {
			metadataContainer.add(vinyls[0]);
			assert.deepEqual(metadataContainer.vinyls.length, 1);
			assert.deepEqual(metadataContainer.manifest.manifest().length, 1);
			// and again
			metadataContainer.add(vinyls[0]);
			assert.deepEqual(metadataContainer.vinyls.length, 1);
			assert.deepEqual(metadataContainer.manifest.manifest().length, 1);
			// and again specifying the component explicitly
			metadataContainer.add(vinyls[0], [new MetadataComponent('ApexClass/Test')]);
			assert.deepEqual(metadataContainer.vinyls.length, 1);
			assert.deepEqual(metadataContainer.manifest.manifest().length, 1);
			// should be the same as using the constructor
			assert.deepEqual(metadataContainer, new MetadataContainer({
				vinyls: [vinyls[0]]
			}));
		});

	});
	describe('#filter(manifest)', function() {
		var manifest = new Manifest();
		manifest.add(new MetadataComponent("ApexPage/Test"));
		var metadataContainer = new MetadataContainer({
			vinyls: vinyls
		});
		it('should return a manifest for vinyls', function() {
			assert.deepEqual(new MetadataContainer().filter().vinyls, []);
			var filteredMetadataContainer = metadataContainer.filter(manifest);
			assert.deepEqual(filteredMetadataContainer.vinyls.length, 2);
			assert.deepEqual(filteredMetadataContainer.vinyls[0].path, path.join('pages', 'Test.page'));
			assert.deepEqual(filteredMetadataContainer.vinyls[1].path, path.join('pages', 'Test.page-meta.xml'));
		});
		it('should return a filtered metadata container', function() {
			var metadataContainer = new MetadataContainer({
				vinyls: []
			});
			metadataContainer.add(customObject);
			var manifestCustomFieldOnly = new Manifest();
			manifestCustomFieldOnly.add(new MetadataComponent("CustomField/Account.Test__c"));
			assert.deepEqual(manifestCustomFieldOnly.getComponentNames(), ["CustomField/Account.Test__c"]);
			assert.deepEqual(manifestCustomFieldOnly.getFileNames(), [path.join("objects", "Account.object")]);
			var filteredMetadataContainer = metadataContainer.filter(manifestCustomFieldOnly);
			assert.deepEqual(filteredMetadataContainer.vinyls.length, 1);
			assert.deepEqual(filteredMetadataContainer.vinyls[0].path, path.join('objects', 'Account.object'));
			assert.deepEqual(filteredMetadataContainer.vinyls[0].contents.toString(), objectWithOneTestField);
			assert.deepEqual(filteredMetadataContainer.manifest.manifest().length, 1);
			var manifestIncludingCustomObject = metadataContainer.manifest;
			manifestIncludingCustomObject.add(new MetadataComponent("CustomObject/Account"));
			var filteredMetadataContainerIncludingCustomObjectItself = metadataContainer.filter(manifestIncludingCustomObject);
			assert.deepEqual(filteredMetadataContainerIncludingCustomObjectItself.vinyls.length, 1);
			assert.deepEqual(filteredMetadataContainerIncludingCustomObjectItself.vinyls[0].path, path.join('objects', 'Account.object'));
			assert.deepEqual(filteredMetadataContainerIncludingCustomObjectItself.vinyls[0].contents.toString(), objectWithTwoTestFields);
			// manifest only contains the CustomObject
			assert.deepEqual(filteredMetadataContainerIncludingCustomObjectItself.manifest.manifest().length, 1);
		});
	});
	describe('#diff(other)', function() {
		var metadataContainer = new MetadataContainer({
			vinyls: [vinyls[0], vinyls[1]]
		});
		it('should return a container added vinyls', function() {
			var resultingContainer = metadataContainer.diff(new MetadataContainer({
				vinyls: vinyls
			}));
			assert.deepEqual(resultingContainer.vinyls.length, 4);
			assert.deepEqual(resultingContainer.manifest.manifest().length, 2);
			assert.deepEqual(resultingContainer.destructiveManifest.manifest().length, 0);
		});
		it('should return a container removed vinyls', function() {
			var resultingContainer = metadataContainer.diff(new MetadataContainer());
			assert.deepEqual(resultingContainer.vinyls.length, 0);
			assert.deepEqual(resultingContainer.manifest.manifest().length, 0);
			assert.deepEqual(resultingContainer.destructiveManifest.manifest().length, 1);
		});
	});
	describe('#attachManifestFiles()', function() {
		it('should return a container including a package.xml', function() {
			var metadataContainer = new MetadataContainer({
				vinyls: [vinyls[0], vinyls[1]]
			});
			assert.deepEqual(metadataContainer.vinyls.length, 2);
			metadataContainer.attachManifestFiles();
			assert.deepEqual(metadataContainer.vinyls.length, 3);
		});
		it('should return a container including a package.xml and a destructiveChanges.xml', function() {
			var metadataContainer = new MetadataContainer({
				vinyls: [vinyls[0], vinyls[1]]
			});
			assert.deepEqual(metadataContainer.vinyls.length, 2);
			metadataContainer.destructiveManifest.add(new MetadataComponent("ApexPage/PageToBeDeleted"));
			metadataContainer.attachManifestFiles();
			assert.deepEqual(metadataContainer.vinyls.length, 4);
		});
	});
	describe('#determineMissingFiles()', function() {
		it('should determine files missing in the vinyls array', function() {
			var metadataContainer = new MetadataContainer();
			metadataContainer.manifest.add(new MetadataComponent("ApexClass/Test"));
			assert.deepEqual(
				metadataContainer.determineMissingFiles(), [path.join("classes", "Test.cls"), path.join("classes", "Test.cls-meta.xml")]
			);
		});
	});
	describe('#stream()', function() {
		it('should stream', function(done) {
			var metadataContainer = new MetadataContainer({
				vinyls: vinyls
			});
			var s = metadataContainer.stream();
			s.on('end', function() {
				assert(true);
				done();
			});
		});
	});
});
