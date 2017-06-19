"use strict";

var assert = require("assert");
var MetadataWriter = require('../lib/metadata-writer');
var testLayouts = require('./data/fetch-results/layouts.json');
var testCustomObjects = require('./data/fetch-results/custom-objects.json');
var path = require('path');
var fs = require('fs');

describe('MetadataWriter', function() {
	describe('#toString()', function() {
		it('should return the xml representation of a metadata file', function() {
			var layout = fs.readFileSync(path.resolve(__dirname, "data", "metadata", "layouts", "Campaign-Campaign Layout.layout")).toString();
			var metadataWriter = new MetadataWriter('Layout', testLayouts[0]);
			assert.deepEqual(
				metadataWriter.toString(), layout
			);
		});
		it('should return the xml representation of a metadata file with special characters', function() {
			var customObject = fs.readFileSync(path.resolve(__dirname, "data", "metadata", "objects", "Account.object")).toString();
			var metadataWriter = new MetadataWriter('CustomObject', testCustomObjects[0]);
			assert.deepEqual(
				metadataWriter.toString(), customObject
			);
		});
	});
});
