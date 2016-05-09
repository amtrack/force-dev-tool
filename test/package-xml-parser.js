"use strict";

var assert = require("assert");
var PackageXmlParser = require('../lib/package-xml-parser');
var testManifests = require('./metadata-parts/manifest');

describe('PackageXmlParser', function() {
	var packageXml = new PackageXmlParser(testManifests.packageXml);
	describe('#getApiVersion()', function() {
		it('should return the api version', function() {
			assert.deepEqual(packageXml.getApiVersion(), '33.0');
		});
	});
	describe('#getComponents()', function() {
		it('should return the components of the package.xml', function() {
			assert.deepEqual(
				packageXml.getComponents().map(function(component) {
					return component.toString()
				}), testManifests.components.map(function(component) {
					return component.toString()
				})
			);
		});
	});
});
