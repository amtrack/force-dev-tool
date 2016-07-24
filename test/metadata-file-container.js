"use strict";

var assert = require("assert");
var path = require("path");
var MetadataFileContainer = require("../lib/metadata-file-container");
var TestObject = require("./metadata-parts/objects");
var TestLabels = require("./metadata-parts/labels");

var objectWithoutFields = [TestObject.header, TestObject.attribute, TestObject.footer].join("\n");
// var objectWithoutFieldsModified = [TestObject.header, TestObject.attributeModified, TestObject.footer].join("\n");
var objectWithTestField = [TestObject.header, TestObject.fields.textField1, TestObject.footer].join("\n");
var objectWithModifiedTestField = [TestObject.header, TestObject.fields.textField1Modified, TestObject.footer].join("\n");
var objectWithRenamedTestField = [TestObject.header, TestObject.fields.textField2, TestObject.footer].join("\n");
var objectWithTestAndATestField = [
	TestObject.header,
	TestObject.fields.textField1.replace('Test__c', 'ATest__c'),
	TestObject.fields.textField1,
	TestObject.footer
].join("\n");
var labelsObjectWithoutLabels = [TestLabels.header, TestLabels.footer].join("\n");
var labelsObjectWithLabel = [TestLabels.header, TestLabels.labels.label1, TestLabels.footer].join("\n");

describe('MetadataFileContainer', function() {
	describe('#MetadataFileContainer()', function() {
		it('should parse a filepath', function() {
			var f = new MetadataFileContainer({
				path: path.join('pages', 'Test.page')
			});
			assert.deepEqual(f.path, path.join('pages', 'Test.page'));
		});
	});
	describe('#getComponents()', function() {
		it('should return the components of a metadata file', function() {
			var components = new MetadataFileContainer({
				path: path.join('objects', 'Account.object'),
				contents: new Buffer(objectWithTestField)
			}).getComponents();
			assert.deepEqual(Object.keys(components).length, 1);
			// remove all spaces because of indentation
			assert.deepEqual(
				components['CustomField']['Test__c'].replace(/ /g, ''),
				TestObject.fields.textField1.replace(/ /g, '')
			);
		});
	});
	describe('#diff()', function() {
		it('should return added custom object of a new custom object', function() {
			var mf1 = new MetadataFileContainer();
			var mf2 = new MetadataFileContainer({
				path: path.join('objects', 'Account.object'),
				contents: new Buffer(objectWithTestField)
			});
			var diffResult = mf1.diff(mf2);
			assert.deepEqual(diffResult.added.manifest().length, 1);
			assert.deepEqual(diffResult.deleted.manifest().length, 0);
			assert.deepEqual(diffResult.added.manifest()[0].toString(), 'CustomObject/Account');
		});
		// it('should return modified custom object of a custom object', function() {
		// 	var mf1 = new MetadataFileContainer({
		// 		path: path.join('objects', 'Account.object'),
		// 		contents: new Buffer(objectWithoutFields)
		// 	});
		// 	var mf2 = new MetadataFileContainer({
		// 		path: path.join('objects', 'Account.object'),
		// 		contents: new Buffer(objectWithoutFieldsModified)
		// 	});
		// 	var diffResult = mf1.diff(mf2);
		// 	assert.deepEqual(diffResult.added.manifest().length, 0);
		// 	assert.deepEqual(diffResult.modified.manifest().length, 1);
		// 	assert.deepEqual(diffResult.deleted.manifest().length, 0);
		// 	assert.deepEqual(diffResult.modified.manifest()[0].toString(), 'CustomObject/Account');
		// });
		it('should return removed custom object', function() {
			var mf1 = new MetadataFileContainer({
				path: path.join('objects', 'Account.object'),
				contents: new Buffer(objectWithTestField)
			});
			var mf2 = new MetadataFileContainer();
			var diffResult = mf1.diff(mf2);
			assert.deepEqual(diffResult.added.manifest().length, 0);
			// TODO: Decision required on how to count added/modified/removed components in the case of container components
			assert.deepEqual(diffResult.deleted.manifest().length, 1);
			assert.deepEqual(diffResult.deleted.manifest()[0].toString(), 'CustomObject/Account');
		});
		it('should return added first custom field of a modified custom object', function() {
			var mf1 = new MetadataFileContainer({
				path: path.join('objects', 'Account.object'),
				contents: new Buffer(objectWithoutFields)
			});
			var mf2 = new MetadataFileContainer({
				path: path.join('objects', 'Account.object'),
				contents: new Buffer(objectWithTestField)
			});
			var diffResult = mf1.diff(mf2);
			assert.deepEqual(diffResult.added.manifest().length, 1);
			assert.deepEqual(diffResult.deleted.manifest().length, 0);
			assert.deepEqual(diffResult.added.manifest()[0].toString(), 'CustomField/Account.Test__c');
		});
		it('should return deleted last custom field of custom object', function() {
			var mf1 = new MetadataFileContainer({
				path: path.join('objects', 'Account.object'),
				contents: new Buffer(objectWithTestField)
			});
			var mf2 = new MetadataFileContainer({
				path: path.join('objects', 'Account.object'),
				contents: new Buffer(objectWithoutFields)
			});
			var diffResult = mf1.diff(mf2);
			assert.deepEqual(diffResult.added.manifest().length, 0);
			assert.deepEqual(diffResult.deleted.manifest().length, 1);
			assert.deepEqual(
				diffResult.deleted.manifest()[0].toString(),
				'CustomField/Account.Test__c'
			);
		});
		it('should return added additional custom field of custom object', function() {
			var mf1 = new MetadataFileContainer({
				path: path.join('objects', 'Account.object'),
				contents: new Buffer(objectWithTestField)
			});
			var mf2 = new MetadataFileContainer({
				path: path.join('objects', 'Account.object'),
				contents: new Buffer(objectWithTestAndATestField)
			});
			var diffResult = mf1.diff(mf2);
			assert.deepEqual(diffResult.added.manifest().length, 1);
			assert.deepEqual(diffResult.deleted.manifest().length, 0);
			assert.deepEqual(diffResult.added.manifest()[0].toString(), 'CustomField/Account.ATest__c');
		});
		it('should return destructiveManifest.manifest() additional custom field of custom object', function() {
			var mf1 = new MetadataFileContainer({
				path: path.join('objects', 'Account.object'),
				contents: new Buffer(objectWithTestAndATestField)
			});
			var mf2 = new MetadataFileContainer({
				path: path.join('objects', 'Account.object'),
				contents: new Buffer(objectWithTestField)
			});
			var diffResult = mf1.diff(mf2);
			assert.deepEqual(diffResult.added.manifest().length, 0);
			assert.deepEqual(diffResult.deleted.manifest().length, 1);
			assert.deepEqual(diffResult.deleted.manifest()[0].toString(), 'CustomField/Account.ATest__c');
		});
		it('should return modified custom field of custom object', function() {
			var mf1 = new MetadataFileContainer({
				path: path.join('objects', 'Account.object'),
				contents: new Buffer(objectWithTestField)
			});
			var mf2 = new MetadataFileContainer({
				path: path.join('objects', 'Account.object'),
				contents: new Buffer(objectWithModifiedTestField)
			});
			var diffResult = mf1.diff(mf2);
			assert.deepEqual(diffResult.added.manifest().length, 0);
			assert.deepEqual(diffResult.modified.manifest().length, 1);
			assert.deepEqual(diffResult.deleted.manifest().length, 0);
			assert.deepEqual(diffResult.modified.manifest()[0].toString(), 'CustomField/Account.Test__c');
		});
		it('should return renamed custom field of custom object', function() {
			var mf1 = new MetadataFileContainer({
				path: path.join('objects', 'Account.object'),
				contents: new Buffer(objectWithTestField)
			});
			var mf2 = new MetadataFileContainer({
				path: path.join('objects', 'Account.object'),
				contents: new Buffer(objectWithRenamedTestField)
			});
			var diffResult = mf1.diff(mf2);
			assert.deepEqual(diffResult.added.manifest().length, 1);
			assert.deepEqual(diffResult.deleted.manifest().length, 1);
			assert.deepEqual(diffResult.added.manifest()[0].toString(), 'CustomField/Account.Test2__c');
			assert.deepEqual(diffResult.deleted.manifest()[0].toString(), 'CustomField/Account.Test__c');
		});
		it('should return an added custom label', function() {
			var mf1 = new MetadataFileContainer({
				path: path.join('labels', 'CustomLabels.labels'),
				contents: new Buffer(labelsObjectWithoutLabels)
			});
			var mf2 = new MetadataFileContainer({
				path: path.join('labels', 'CustomLabels.labels'),
				contents: new Buffer(labelsObjectWithLabel)
			});
			var diffResult = mf1.diff(mf2);
			assert.deepEqual(diffResult.added.manifest().length, 1);
			assert.deepEqual(diffResult.deleted.manifest().length, 0);
			assert.deepEqual(diffResult.added.manifest()[0].toString(), 'CustomLabel/TestLabel');
		});
		it('should return a removed custom label', function() {
			var mf1 = new MetadataFileContainer({
				path: path.join('labels', 'CustomLabels.labels'),
				contents: new Buffer(labelsObjectWithLabel)
			});
			var mf2 = new MetadataFileContainer({
				path: path.join('labels', 'CustomLabels.labels'),
				contents: new Buffer(labelsObjectWithoutLabels)
			});
			var diffResult = mf1.diff(mf2);
			assert.deepEqual(diffResult.added.manifest().length, 0);
			assert.deepEqual(diffResult.deleted.manifest().length, 1);
			assert.deepEqual(diffResult.deleted.manifest()[0].toString(), 'CustomLabel/TestLabel');
		});
	});
	describe('#getMetadataType()', function() {
		it('should return a metadata type for a file', function() {
			var f = new MetadataFileContainer({
				path: path.join('objects', 'Account.object')
			});
			var metadataType = f.getMetadataType();
			assert(metadataType);
			assert(metadataType.childXmlNames);
			assert(metadataType.childXmlNames.indexOf('CustomField') >= 0);
		});
	});
});
