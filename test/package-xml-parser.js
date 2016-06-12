"use strict";

var assert = require("assert");
var PackageXmlParser = require('../lib/package-xml-parser');
var testManifests = require('./metadata-parts/manifest');

describe('PackageXmlParser', function() {
	describe('#getApiVersion()', function() {
		it('should return the api version', function() {
			var packageXml = new PackageXmlParser(testManifests.packageXml);
			assert.deepEqual(packageXml.getApiVersion(), '33.0');
		});
		it('should return null if api version is not specified', function() {
			var packageXml = new PackageXmlParser(testManifests.packageXmlWithoutVersion);
			assert.deepEqual(packageXml.getApiVersion(), null);
		});
	});
	describe('#getComponents()', function() {
		it('should return the components of the package.xml', function() {
			var packageXml = new PackageXmlParser(testManifests.packageXml);
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
