"use strict";

var assert = require("assert");
var path = require("path");
var child = require("child_process");
var tmp = require("tmp");
var Unzip = require('../lib/unzip');

describe('force-dev-tool validate', function() {
	var fdt = path.resolve(__dirname, '..', 'bin', 'cli');
	it('should simulate deploying a zip file containing a layout with umlauts in the filename', function() {
		this.timeout(1000 * 60 * 10);
		this.slow(1000 * 60 * 5);
		var validateCmd = child.spawnSync("node", [fdt, 'validate', '-f', path.resolve(__dirname, '..', 'test', 'data', 'unpackaged', 'layout-with-umlauts.zip')]);
		assert.deepEqual(validateCmd.status, 0);
		assert(/Running Validation of zip file/.test(validateCmd.stdout.toString()));
		assert(/Visit https/.test(validateCmd.stdout.toString()));
	});
	it('should simulate deploying a layout with umlauts in the filename', function(done) {
		this.timeout(1000 * 60 * 10);
		this.slow(1000 * 60 * 5);
		var tmpDir = tmp.dirSync();
		var testZipPath = path.join(__dirname, '..', 'test', 'data', 'unpackaged', 'layout-with-umlauts.zip');
		var unzipDir = path.join(tmpDir.name, 'unzipped');
		new Unzip(testZipPath).target(unzipDir, function(err) {
			if (err) {
				return done(err);
			}
			var validateCmd = child.spawnSync("node", [fdt, 'validate', '-d', unzipDir]);
			assert.deepEqual(validateCmd.status, 0);
			assert(/Running Validation of directory/.test(validateCmd.stdout.toString()));
			assert(/Visit https/.test(validateCmd.stdout.toString()));
			done();
		});
	});
});
