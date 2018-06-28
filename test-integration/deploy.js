"use strict";

var assert = require("assert");
var path = require("path");
var child = require("child_process");
var tmp = require("tmp");
var Unzip = require('../lib/unzip');

describe('force-dev-tool deploy', function() {
	var fdt = path.resolve(__dirname, '..', 'bin', 'cli');
	it('should simulate deploying a zip file containing a layout with umlauts in the filename', function() {
		this.timeout(1000 * 60 * 10);
		this.slow(1000 * 60 * 5);
		var deployCmd = child.spawnSync("node", [fdt, 'deploy', '-c', '-f', path.resolve(__dirname, '..', 'test', 'data', 'unpackaged', 'layout-with-umlauts.zip')]);
		assert.deepEqual(deployCmd.status, 0, deployCmd.stderr);
		assert(/Running Validation of zip file/.test(deployCmd.stdout.toString()));
		assert(/Visit https/.test(deployCmd.stdout.toString()));
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
			var deployCmd = child.spawnSync("node", [fdt, 'deploy', '-c', '-d', unzipDir]);
			assert.deepEqual(deployCmd.status, 0, deployCmd.stderr);
			assert(/Running Validation of directory/.test(deployCmd.stdout.toString()));
			assert(/Visit https/.test(deployCmd.stdout.toString()));
			done();
		});
	});
	it('should simulate deploying a visualforce page', function() {
		this.timeout(1000 * 60 * 10);
		this.slow(1000 * 60 * 5);
		var deployCmd = child.spawnSync("node", [fdt, 'deploy', '-c', '-t', '-d', path.resolve(__dirname, '..', 'test', 'data', 'metadata', 'visualforce')]);
		assert.deepEqual(deployCmd.status, 0, deployCmd.stderr);
		assert(/Running Validation with test execution of directory/.test(deployCmd.stdout.toString()));
		assert(/Visit https/.test(deployCmd.stdout.toString()));
	});
	it('should simulate deploying an apex class with a test class', function() {
		this.timeout(1000 * 60 * 10);
		this.slow(1000 * 60 * 5);
		var deployCmd = child.spawnSync("node", [fdt, 'deploy', '-c', '-t', '-d', path.resolve(__dirname, '..', 'test', 'data', 'unpackaged', 'apex')]);
		assert.deepEqual(deployCmd.status, 0, deployCmd.stderr);
		assert(/Running Validation with test execution of directory/.test(deployCmd.stdout.toString()));
		assert(/Visit https/.test(deployCmd.stdout.toString()));
	});
	it('should simulate deploying an apex class with a failing test class', function() {
		this.timeout(1000 * 60 * 10);
		this.slow(1000 * 60 * 5);
		var deployCmd = child.spawnSync("node", [fdt, 'deploy', '-c', '-t', '-d', path.resolve(__dirname, '..', 'test', 'data', 'unpackaged', 'apex-failing')]);
		assert.deepEqual(deployCmd.status, 1);
		assert(/Running Validation with test execution of directory/.test(deployCmd.stdout.toString()));
		assert(/Error:.*failed\./.test(deployCmd.stderr.toString()));
	});
});
