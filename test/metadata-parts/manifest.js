"use strict";

var MetadataComponent = require('../../lib/metadata-component');

var components = [
	new MetadataComponent('ApexComponent/C1'),
	new MetadataComponent('ApexComponent/Z1'),
	new MetadataComponent('ApexPage/Test'),
	new MetadataComponent('ApexPage/Test2'),
	new MetadataComponent('CustomLabel/MyLabel')
];

var packageXml = ['<?xml version="1.0" encoding="UTF-8"?>',
	'<Package xmlns="http://soap.sforce.com/2006/04/metadata">',
	'    <types>',
	'        <members>C1</members>',
	'        <members>Z1</members>',
	'        <name>ApexComponent</name>',
	'    </types>',
	'    <types>',
	'        <members>Test</members>',
	'        <members>Test2</members>',
	'        <name>ApexPage</name>',
	'    </types>',
	'    <types>',
	'        <members>MyLabel</members>',
	'        <name>CustomLabel</name>',
	'    </types>',
	'    <version>33.0</version>',
	'</Package>',
	''
].join("\n");

var packageXmlWithoutVersion = ['<?xml version="1.0" encoding="UTF-8"?>',
	'<Package xmlns="http://soap.sforce.com/2006/04/metadata">',
	'    <types>',
	'        <members>C1</members>',
	'        <members>Z1</members>',
	'        <name>ApexComponent</name>',
	'    </types>',
	'    <types>',
	'        <members>Test</members>',
	'        <members>Test2</members>',
	'        <name>ApexPage</name>',
	'    </types>',
	'    <types>',
	'        <members>MyLabel</members>',
	'        <name>CustomLabel</name>',
	'    </types>',
	'</Package>',
	''
].join("\n");

module.exports = {
	components: components,
	packageXml: packageXml,
	packageXmlWithoutVersion: packageXmlWithoutVersion
};
