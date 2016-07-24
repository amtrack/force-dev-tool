"use strict";

var header = ['<?xml version="1.0" encoding="UTF-8"?>',
	'<Profile xmlns="http://soap.sforce.com/2006/04/metadata">'
].join("\n");

var footer = '</Profile>\n';

var classAccess = [
	'    <classAccesses>',
	'        <apexClass>TestClass</apexClass>',
	'        <enabled>true</enabled>',
	'    </classAccesses>'
].join("\n");

var fieldPermission = [
	'    <fieldPermissions>',
	'        <editable>true</editable>',
	'        <field>Account.VAT__c</field>',
	'        <readable>true</readable>',
	'    </fieldPermissions>'
].join("\n");

module.exports = {
	header: header,
	footer: footer,
	classAccesses: {
		classAccess1: classAccess,
		classAccess1Modified: classAccess.replace('<enabled>true</enabled>', '<enabled>false</enabled>'),
		classAccess2: classAccess.replace('<apexClass>TestClass</apexClass>', '<apexClass>TestClass2</apexClass>'),
		classAccess2Modified: classAccess.replace('<apexClass>TestClass</apexClass>', '<apexClass>TestClass2</apexClass>').replace('<enabled>true</enabled>', '<enabled>false</enabled>')
	},
	fieldPermissions: {
		fieldPermission1: fieldPermission,
		fieldPermission1Modified: fieldPermission.replace('<editable>true</editable>', '<editable>false</editable>'),
		fieldPermission2: fieldPermission.replace('<field>Account.Vat__c</field>', '<field>Account.Vat2__c</field>'),
		fieldPermission2Modified: fieldPermission.replace('<field>Account.Vat__c</field>', '<field>Account.Vat2__c</field>').replace('<editable>true</editable>', '<editable>false</editable>')
	}
};
