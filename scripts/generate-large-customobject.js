#!/usr/bin/env node

var metadataParts = require("../test/metadata-parts/objects");
var numberOfComponents = parseInt(process.env.COUNT || "10000");

console.log(metadataParts.header);
for (var i = 0; i < numberOfComponents; i++) {
	console.log(
		metadataParts.fields.textField1.replace(
			"Test",
			"Test" + i.toString().padStart(4, "0")
		)
	);
}
console.log("    <label>LargeCustomObjectTest__c</label>")
console.log(metadataParts.footer);
