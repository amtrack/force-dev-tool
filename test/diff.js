"use strict";

// var assert = require("assert");
// var Diff = require("../lib/diff");

// var gitDiffAddedApexPage = "diff --git a/src/pages/Test.page b/src/pages/Test.page\n" +
// "index 123..456 789\n" +
// "--- a/src/pages/Test.page\n" +
// "+++ b/src/pages/Test.page\n" +
// "@@ -1,2 +1,2 @@\n" +
// "- line1\n" +
// "+ line2";

// var gitDiffModifiedApexPage = "diff --git a/src/pages/Test.page b/src/pages/Test.page\n" +
// "index 123..456 789\n" +
// "--- a/src/pages/Test.page\n" +
// "+++ b/src/pages/Test.page\n" +
// "@@ -1,2 +1,2 @@\n" +
// "- line1\n" +
// "+ line2";

// var gitDiffDeletedApexPage = "diff --git a/src/pages/Test.page b/src/pages/Test.page\n" +
// "deleted file mode 100644\n" +
// "index db81be4..0000000\n" +
// "--- b/src/pages/Test.page\n" +
// "+++ /dev/null\n" +
// "@@ -1,2 +0,0 @@\n" +
// "-line1\n" +
// "-line2";

// var packageXml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
// '<Package xmlns="http://soap.sforce.com/2006/04/metadata">\n' +
// '    <types>\n' +
// '        <members>Account.Test__c</members>\n' +
// '        <name>CustomField</name>\n' +
// '    </types>\n' +
// '    <version>33.0</version>\n' +
// '</Package>';

// var gitDiffAddedCustomField = "diff --git a/src/package.xml b/src/package.xml\n" +
// "index 123..456 789\n" +
// "--- a/src/package.xml\n" +
// "+++ b/src/package.xml\n" +
// "@@ -1,2 +1,2 @@\n" +
// "+     <types>\n" +
// "+        <members>Account.Test__c</members>\n" +
// "+        <name>CustomField</name>\n" +
// "+     </types>\n" +
// "diff --git a/src/objects/Account.object b/src/objects/Account.object\n" +
// "index 123..456 789\n" +
// "--- a/src/objects/Account.object\n" +
// "+++ b/src/objects/Account.object\n" +
// "@@ -1,2 +1,2 @@\n" +
// "- line1\n" +
// "+ line2";

describe('Diff', function() {
	describe('#getDiff()', function() {
		// it('should detect changes to a file based component', function(){
		// assert.deepEqual(new Diff(gitDiffAddedApexPage).getDiff(), {addedOrModified: ['ApexPage/Test'], removed: []});
		// assert.deepEqual(new Diff(gitDiffModifiedApexPage).getDiff(), {addedOrModified: ['ApexPage/Test'], removed: []});
		// assert.deepEqual(new Diff(gitDiffDeletedApexPage).getDiff(), {addedOrModified: [], removed: ['ApexPage/Test']});
		// });
		// it('should detect changes to a component in a container type', function(){
		// assert.deepEqual(new Diff(gitDiffAddedCustomField).getDiff(), {addedOrModified: [{type: 'CustomField', fileName: 'objects/Account.object', fullName: 'Account.Test__c'}], removed: []});
		// assert.deepEqual(new Diff(gitDiffModifiedCustomField).getDiff(), {addedOrModified: [{type: 'CustomField', fileName: 'objects/Account.object', fullName: 'Account.Test__c'}], removed: []});
		// assert.deepEqual(new Diff(gitDiffDeletedCustomField).getDiff(), {addedOrModified: [], removed: [{type: 'CustomField', fileName: 'objects/Account.object', fullName: 'Account.Test__c'}]});
		// });
	});
});
