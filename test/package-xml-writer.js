"use strict";

var assert = require("assert");
var Manifest = require("../lib/manifest");
var PackageXmlWriter = require('../lib/package-xml-writer');
var testManifests = require('./metadata-parts/manifest');

describe('PackageXmlWriter', function() {
	describe('#toString()', function() {
		it('should return the xml representation of a manifest', function() {
			var m1 = new Manifest({
				manifestJSON: testManifests.components,
				apiVersion: '33.0'
			});
			var packageXmlWriter = new PackageXmlWriter(m1);
			assert.deepEqual(
				packageXmlWriter.toString(), testManifests.packageXml
			);
		});
		it('should return the xml representation of a manifest without api version', function() {
			var m2 = new Manifest({
				manifestJSON: testManifests.components,
				apiVersion: null
			});
			var packageXmlWriter = new PackageXmlWriter(m2);
			assert.deepEqual(
				packageXmlWriter.toString(), testManifests.packageXmlWithoutVersion
			);
		});
	});
});
