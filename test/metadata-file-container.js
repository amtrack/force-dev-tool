"use strict";

var assert = require("assert");
var path = require("path");
var MetadataFileContainer = require("../lib/metadata-file-container");
var TestObject = require("./metadata-parts/objects");
var TestLabels = require("./metadata-parts/labels");
var TestProfile = require("./metadata-parts/profiles");

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
var largeCustomObject = [TestObject.header];
var largeCustomObjectWithModifiedField = [TestObject.header];
for (var i = 0; i < 10000; i++) {
	var field = TestObject.fields.textField1.replace(
		"Test",
		"Test" + i.toString().padStart(4, "0"));
	largeCustomObject.push(field);
	if (i === 815) {
		largeCustomObjectWithModifiedField.push(field.replace('</label>', ' Updated</label>'));
	} else {
		largeCustomObjectWithModifiedField.push(field);
	}
}
largeCustomObject.push(TestObject.footer);
largeCustomObjectWithModifiedField.push(TestObject.footer);
var labelsObjectWithoutLabels = [TestLabels.header, TestLabels.footer].join("\n");
var labelsObjectWithLabel = [TestLabels.header, TestLabels.labels.label1, TestLabels.footer].join("\n");
var profileWithoutClassAccess = [TestProfile.header, TestProfile.footer].join("\n");
var profileWithClassAccess = [TestProfile.header, TestProfile.classAccesses.classAccess1, TestProfile.footer].join("\n");
var profileWithClassAccessModified = [TestProfile.header, TestProfile.classAccesses.classAccess1Modified, TestProfile.footer].join("\n");
var profileWithoutFieldPermission = [TestProfile.header, TestProfile.footer].join("\n");
var profileWithFieldPermission = [TestProfile.header, TestProfile.fieldPermissions.fieldPermission1, TestProfile.footer].join("\n");
var profileWithFieldPermissionModified = [TestProfile.header, TestProfile.fieldPermissions.fieldPermission1Modified, TestProfile.footer].join("\n");

describe('MetadataFileContainer', function() {
	describe('#MetadataFileContainer()', function() {
		it('should parse a filepath', function() {
			var f = new MetadataFileContainer({
				path: path.join('pages', 'Test.page')
			});
			assert.deepEqual(f.path, path.join('pages', 'Test.page'));
		});
	});
	describe('#parse()', function() {
		it('should return the components of a metadata file', function() {
			var mfc = new MetadataFileContainer({
				path: path.join('objects', 'Account.object'),
				contents: Buffer.from(objectWithTestField)
			});
			assert.deepEqual(mfc.components.length, 1);
			assert.deepEqual(
				mfc.components[0].contents,
				TestObject.fields.textField1
			);
		});
		it('should return the components of a large metadata file', function() {
			var mfc = new MetadataFileContainer({
				path: path.join('objects', 'LargeCustomObjectTest__c.object'),
				contents: Buffer.from(largeCustomObject.join("\n"))
			});
			assert.deepEqual(mfc.components.length, 10000);

			assert.deepEqual(
				mfc.components[6666].contents,
				TestObject.fields.textField1.replace(
					"Test",
					"Test6666")
			);
		});
		it('should return the ProfileApexClassAccess of a metadata file', function() {
			var mfc = new MetadataFileContainer({
				path: path.join('profiles', 'Admin.profile'),
				contents: Buffer.from(profileWithClassAccess)
			});
			assert.deepEqual(mfc.components.length, 1);
			assert.deepEqual(
				mfc.components[0].contents,
				TestProfile.classAccesses.classAccess1
			);
		});
		it('should return the ProfileFieldLevelSecurity of a metadata file', function() {
			var mfc = new MetadataFileContainer({
				path: path.join('profiles', 'Admin.profile'),
				contents: Buffer.from(profileWithFieldPermission)
			});
			assert.deepEqual(mfc.components.length, 1);
			assert.deepEqual(
				mfc.components[0].contents,
				TestProfile.fieldPermissions.fieldPermission1
			);
		});
	});
	describe('#diff()', function() {
		it('should return added custom object of a new custom object', function() {
			var mf1 = new MetadataFileContainer();
			var mf2 = new MetadataFileContainer({
				path: path.join('objects', 'Account.object'),
				contents: Buffer.from(objectWithTestField)
			});
			var diffResult = mf1.diff(mf2);
			assert.deepEqual(diffResult.added.manifest().length, 1);
			assert.deepEqual(diffResult.deleted.manifest().length, 0);
			assert.deepEqual(diffResult.added.manifest()[0].toString(), 'CustomObject/Account');
		});
		it('should return an added ProfileApexClassAccess of a profile', function() {
			var mf1 = new MetadataFileContainer({
				path: path.join('profiles', 'Admin.profile'),
				contents: Buffer.from(profileWithoutClassAccess)
			});
			var mf2 = new MetadataFileContainer({
				path: path.join('profiles', 'Admin.profile'),
				contents: Buffer.from(profileWithClassAccess)
			});
			var diffResult = mf1.diff(mf2);
			assert.deepEqual(diffResult.added.manifest().length, 1);
			assert.deepEqual(diffResult.modified.manifest().length, 0);
			assert.deepEqual(diffResult.deleted.manifest().length, 0);
			assert.deepEqual(diffResult.added.manifest()[0].toString(), 'ProfileApexClassAccess/Admin.TestClass');
		});
		it('should return an added ProfileFieldLevelSecurity of a profile', function() {
			var mf1 = new MetadataFileContainer({
				path: path.join('profiles', 'Admin.profile'),
				contents: Buffer.from(profileWithoutFieldPermission)
			});
			var mf2 = new MetadataFileContainer({
				path: path.join('profiles', 'Admin.profile'),
				contents: Buffer.from(profileWithFieldPermission)
			});
			var diffResult = mf1.diff(mf2);
			assert.deepEqual(diffResult.added.manifest().length, 1);
			assert.deepEqual(diffResult.modified.manifest().length, 0);
			assert.deepEqual(diffResult.deleted.manifest().length, 0);
			assert.deepEqual(diffResult.added.manifest()[0].toString(), 'ProfileFieldLevelSecurity/Admin.Account.VAT__c');
		});
		it('should return a modified ProfileApexClassAccess of a profile', function() {
			var mf1 = new MetadataFileContainer({
				path: path.join('profiles', 'Admin.profile'),
				contents: Buffer.from(profileWithClassAccess)
			});
			var mf2 = new MetadataFileContainer({
				path: path.join('profiles', 'Admin.profile'),
				contents: Buffer.from(profileWithClassAccessModified)
			});
			var diffResult = mf1.diff(mf2);
			assert.deepEqual(diffResult.added.manifest().length, 0);
			assert.deepEqual(diffResult.modified.manifest().length, 1);
			assert.deepEqual(diffResult.deleted.manifest().length, 0);
			assert.deepEqual(diffResult.modified.manifest()[0].toString(), 'ProfileApexClassAccess/Admin.TestClass');
		});
		it('should return a modified ProfileFieldLevelSecurity of a profile', function() {
			var mf1 = new MetadataFileContainer({
				path: path.join('profiles', 'Admin.profile'),
				contents: Buffer.from(profileWithFieldPermission)
			});
			var mf2 = new MetadataFileContainer({
				path: path.join('profiles', 'Admin.profile'),
				contents: Buffer.from(profileWithFieldPermissionModified)
			});
			var diffResult = mf1.diff(mf2);
			assert.deepEqual(diffResult.added.manifest().length, 0);
			assert.deepEqual(diffResult.modified.manifest().length, 1);
			assert.deepEqual(diffResult.deleted.manifest().length, 0);
			assert.deepEqual(diffResult.modified.manifest()[0].toString(), 'ProfileFieldLevelSecurity/Admin.Account.VAT__c');
		});
		it('should return removed custom object', function() {
			var mf1 = new MetadataFileContainer({
				path: path.join('objects', 'Account.object'),
				contents: Buffer.from(objectWithTestField)
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
				contents: Buffer.from(objectWithoutFields)
			});
			var mf2 = new MetadataFileContainer({
				path: path.join('objects', 'Account.object'),
				contents: Buffer.from(objectWithTestField)
			});
			var diffResult = mf1.diff(mf2);
			assert.deepEqual(diffResult.added.manifest().length, 1);
			assert.deepEqual(diffResult.deleted.manifest().length, 0);
			assert.deepEqual(diffResult.added.manifest()[0].toString(), 'CustomField/Account.Test__c');
		});
		it('should return deleted last custom field of custom object', function() {
			var mf1 = new MetadataFileContainer({
				path: path.join('objects', 'Account.object'),
				contents: Buffer.from(objectWithTestField)
			});
			var mf2 = new MetadataFileContainer({
				path: path.join('objects', 'Account.object'),
				contents: Buffer.from(objectWithoutFields)
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
				contents: Buffer.from(objectWithTestField)
			});
			var mf2 = new MetadataFileContainer({
				path: path.join('objects', 'Account.object'),
				contents: Buffer.from(objectWithTestAndATestField)
			});
			var diffResult = mf1.diff(mf2);
			assert.deepEqual(diffResult.added.manifest().length, 1);
			assert.deepEqual(diffResult.deleted.manifest().length, 0);
			assert.deepEqual(diffResult.added.manifest()[0].toString(), 'CustomField/Account.ATest__c');
		});
		it('should return destructiveManifest.manifest() additional custom field of custom object', function() {
			var mf1 = new MetadataFileContainer({
				path: path.join('objects', 'Account.object'),
				contents: Buffer.from(objectWithTestAndATestField)
			});
			var mf2 = new MetadataFileContainer({
				path: path.join('objects', 'Account.object'),
				contents: Buffer.from(objectWithTestField)
			});
			var diffResult = mf1.diff(mf2);
			assert.deepEqual(diffResult.added.manifest().length, 0);
			assert.deepEqual(diffResult.deleted.manifest().length, 1);
			assert.deepEqual(diffResult.deleted.manifest()[0].toString(), 'CustomField/Account.ATest__c');
		});
		it('should return modified custom field of custom object', function() {
			var mf1 = new MetadataFileContainer({
				path: path.join('objects', 'Account.object'),
				contents: Buffer.from(objectWithTestField)
			});
			var mf2 = new MetadataFileContainer({
				path: path.join('objects', 'Account.object'),
				contents: Buffer.from(objectWithModifiedTestField)
			});
			var diffResult = mf1.diff(mf2);
			assert.deepEqual(diffResult.added.manifest().length, 0);
			assert.deepEqual(diffResult.modified.manifest().length, 1);
			assert.deepEqual(diffResult.deleted.manifest().length, 0);
			assert.deepEqual(diffResult.modified.manifest()[0].toString(), 'CustomField/Account.Test__c');
		});
		it('should return modified custom field of a large custom object', function() {
			this.timeout(10000);
			var largeCustomObject = [TestObject.header];
			var largeCustomObjectWithModifiedField = [TestObject.header];
			for (var i = 0; i < 10000; i++) {
				var field = TestObject.fields.textField1.replace(
					"Test",
					"Test" + i.toString().padStart(4, "0"));
				largeCustomObject.push(field);
				if (i === 3500) {
					largeCustomObjectWithModifiedField.push(field.replace('</label>', ' Updated</label>'));
				} else {
					largeCustomObjectWithModifiedField.push(field);
				}
			}
			largeCustomObject.push(TestObject.footer);
			largeCustomObjectWithModifiedField.push(TestObject.footer);
			var mf1 = new MetadataFileContainer({
				path: path.join('objects', 'LargeCustomObjectTest__c.object'),
				contents: Buffer.from(largeCustomObject.join("\n"))
			});
			var mf2 = new MetadataFileContainer({
				path: path.join('objects', 'LargeCustomObjectTest__c.object'),
				contents: Buffer.from(largeCustomObjectWithModifiedField.join("\n"))
			});
			var diffResult = mf1.diff(mf2);
			assert.deepEqual(diffResult.added.manifest().length, 0);
			assert.deepEqual(diffResult.modified.manifest().length, 1);
			assert.deepEqual(diffResult.deleted.manifest().length, 0);
			assert.deepEqual(diffResult.modified.manifest()[0].toString(), 'CustomField/LargeCustomObjectTest__c.Test3500__c');
		});
		it('should return renamed custom field of custom object', function() {
			var mf1 = new MetadataFileContainer({
				path: path.join('objects', 'Account.object'),
				contents: Buffer.from(objectWithTestField)
			});
			var mf2 = new MetadataFileContainer({
				path: path.join('objects', 'Account.object'),
				contents: Buffer.from(objectWithRenamedTestField)
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
				contents: Buffer.from(labelsObjectWithoutLabels)
			});
			var mf2 = new MetadataFileContainer({
				path: path.join('labels', 'CustomLabels.labels'),
				contents: Buffer.from(labelsObjectWithLabel)
			});
			var diffResult = mf1.diff(mf2);
			assert.deepEqual(diffResult.added.manifest().length, 1);
			assert.deepEqual(diffResult.deleted.manifest().length, 0);
			assert.deepEqual(diffResult.added.manifest()[0].toString(), 'CustomLabel/TestLabel');
		});
		it('should return a removed custom label', function() {
			var mf1 = new MetadataFileContainer({
				path: path.join('labels', 'CustomLabels.labels'),
				contents: Buffer.from(labelsObjectWithLabel)
			});
			var mf2 = new MetadataFileContainer({
				path: path.join('labels', 'CustomLabels.labels'),
				contents: Buffer.from(labelsObjectWithoutLabels)
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
	describe('#toString()', function() {
		it('should respect the sort order of types and components', function() {
			var objectWithUnsortedFieldsAndValidationRule = [TestObject.header, TestObject.fields.textField1, TestObject.validationRules.validationRule1, TestObject.fields.textField2, TestObject.footer].join("\n");
			var objectWithSortedFieldsAndValidationRule = [TestObject.header, TestObject.fields.textField1, TestObject.fields.textField2, TestObject.validationRules.validationRule1, TestObject.footer].join("\n");
			var mfUnsorted = new MetadataFileContainer({
				path: path.join('objects', 'Account.object'),
				contents: Buffer.from(objectWithUnsortedFieldsAndValidationRule)
			});
			var mfSorted = new MetadataFileContainer({
				path: path.join('objects', 'Account.object'),
				contents: Buffer.from(objectWithSortedFieldsAndValidationRule)
			});
			mfUnsorted.writeContents();
			mfSorted.writeContents();
			assert.deepEqual(mfUnsorted.toString(), mfSorted.toString());
		});
	});
	describe('#contentsWithoutChilds', function() {
		it('should strip off children from a CustomObject', function() {
			var objectWithAttributeAndField = [TestObject.header, TestObject.attribute, TestObject.fields.textField1, TestObject.footer].join("\n");
			var mf = new MetadataFileContainer({
				path: path.join('objects', 'Account.object'),
				contents: Buffer.from(objectWithAttributeAndField)
			});
			var content = mf.contentsWithoutChilds();
			assert.deepEqual(content, objectWithoutFields);
		});
	});
	describe('#diffMaps', function() {
		it('should detect no change', function() {
			var a = {
				CustomField: {
					"Account.Foo__c": {
						contents: "Foo"
					}
				}
			};
			var b = {
				CustomField: {
					"Account.Foo__c": {
						contents: "Foo"
					}
				}
			};
			var diffResult = MetadataFileContainer.diffMaps(a, b);
			assert.deepEqual(diffResult.added.manifest().length, 0);
			assert.deepEqual(diffResult.modified.manifest().length, 0);
			assert.deepEqual(diffResult.deleted.manifest().length, 0);
		});
		it('should detect a modified component', function() {
			var a = {
				CustomField: {
					"Account.Foo__c": {
						contents: "Foo"
					}
				}
			};
			var b = {
				CustomField: {
					"Account.Foo__c": {
						contents: "Foo2"
					}
				}
			};
			var diffResult = MetadataFileContainer.diffMaps(a, b);
			assert.deepEqual(diffResult.added.manifest().length, 0);
			assert.deepEqual(diffResult.modified.manifest().length, 1);
			assert.deepEqual(diffResult.deleted.manifest().length, 0);
		});
		it('should detect a deleted component', function() {
			var a = {
				CustomField: {
					"Account.Foo__c": {
						contents: "Foo"
					}
				}
			};
			var b = {};
			var diffResult = MetadataFileContainer.diffMaps(a, b);
			assert.deepEqual(diffResult.added.manifest().length, 0);
			assert.deepEqual(diffResult.modified.manifest().length, 0);
			assert.deepEqual(diffResult.deleted.manifest().length, 1);
		});
	});
});
