"use strict";

var header = ['<?xml version="1.0" encoding="UTF-8"?>',
	'<CustomLabels xmlns="http://soap.sforce.com/2006/04/metadata">'
].join("\n");

var footer = '</CustomLabels>\n';

var label1 = [
	'    <labels>',
	'        <fullName>TestLabel</fullName>',
	'        <language>en_US</language>',
	'        <protected>false</protected>',
	'        <shortDescription>A test label</shortDescription>',
	'        <value>Lorem ipsum</value>',
	'    </labels>'
].join("\n");

module.exports = {
	header: header,
	footer: footer,
	labels: {
		label1: label1,
		label1Modified: label1.replace('<value>Lorem ipsum</value>', '<value>Lorem ipsum dolor sit amet</value>')
	}
};
