"use strict";

var header = ['<?xml version="1.0" encoding="UTF-8"?>',
	'<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">'
].join("\n");

var footer = '</CustomObject>\n';

var attribute = '<enableHistory>false</enableHistory>';
var attributeModified = '<enableHistory>true</enableHistory>';

var textField = [
	'    <fields>',
	'        <fullName>Test__c</fullName>',
	'        <externalId>false</externalId>',
	'        <label>Test</label>',
	'        <length>200</length>',
	'        <required>false</required>',
	'        <trackFeedHistory>false</trackFeedHistory>',
	'        <trackHistory>false</trackHistory>',
	'        <trackTrending>false</trackTrending>',
	'        <type>Text</type>',
	'        <unique>false</unique>',
	'    </fields>'
].join("\n");

var searchLayouts1 = [
	'    <searchLayouts>',
	'        <customTabListAdditionalFields>Foo__c</customTabListAdditionalFields>',
	'        <customTabListAdditionalFields>Bar__c</customTabListAdditionalFields>',
	'        <listViewButtons>TestButton</listViewButtons>',
	'    </searchLayouts>'
].join("\n");

var searchLayouts1Modified = [
	'    <searchLayouts>',
	'        <customTabListAdditionalFields>Bar__c</customTabListAdditionalFields>',
	'        <customTabListAdditionalFields>Foo__c</customTabListAdditionalFields>',
	'        <customTabListAdditionalFields>Baz__c</customTabListAdditionalFields>',
	'        <listViewButtons>TestButton</listViewButtons>',
	'    </searchLayouts>'
].join("\n");

var validationRule1 = [
	'<validationRules>',
	'    <fullName>Test_10</fullName>',
	'    <active>true</active>',
	'    <errorConditionFormula>LEN(Test__c) != 10</errorConditionFormula>',
	'    <errorDisplayField>Test__c</errorDisplayField>',
	'    <errorMessage>Test__c should be exactly 10 characters long</errorMessage>',
	'</validationRules>'
].join("\n");

module.exports = {
	header: header,
	footer: footer,
	attribute: attribute,
	attributeModified: attributeModified,
	fields: {
		textField1: textField,
		textField1Modified: textField.replace('<label>Test</label>', '<label>Test Modified</label>'),
		textField2: textField.replace('Test__c', 'Test2__c'),
		textField2Modified: textField.replace('Test__c', 'Test2__c').replace('<label>Test</label>', '<label>Test Modified</label>')
	},
	validationRules: {
		validationRule1: validationRule1
	},
	properties: {
		searchLayouts1: searchLayouts1,
		searchLayouts1Modified: searchLayouts1Modified
	}
};
