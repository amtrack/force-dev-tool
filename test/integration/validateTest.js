"use strict";

var assert = require("assert");
var path = require("path");
var child = require("child_process");

// run integration tests against remote organization only when TEST_INTEGRATION environment variable is set to true
(process.env.TEST_INTEGRATION === 'true' ? describe : describe.skip)('force-dev-tool validateTest', function() {
	var fdt = path.resolve(__dirname, '..', '..', 'bin', 'cli');
	it('should simulate deploying a visualforce page', function() {
		this.timeout(1000 * 60 * 10);
		this.slow(1000 * 60 * 5);
		var validateTestCmd = child.spawnSync("node", [fdt, 'validateTest', '-d', path.resolve(__dirname, '..', 'data', 'metadata', 'visualforce')]);
		assert.deepEqual(validateTestCmd.status, 0);
		assert(/Running Validation with test execution of directory/.test(validateTestCmd.stdout.toString()));
		assert(/Visit https/.test(validateTestCmd.stdout.toString()));
	});
	it('should simulate deploying an apex class with a test class', function() {
		this.timeout(1000 * 60 * 10);
		this.slow(1000 * 60 * 5);
		var validateTestCmd = child.spawnSync("node", [fdt, 'validateTest', '-d', path.resolve(__dirname, '..', 'data', 'unpackaged', 'apex')]);
		assert.deepEqual(validateTestCmd.status, 0);
		assert(/Running Validation with test execution of directory/.test(validateTestCmd.stdout.toString()));
		assert(/Visit https/.test(validateTestCmd.stdout.toString()));
	});
	it('should simulate deploying an apex class with a failing test class', function() {
		this.timeout(1000 * 60 * 10);
		this.slow(1000 * 60 * 5);
		var validateTestCmd = child.spawnSync("node", [fdt, 'validateTest', '-d', path.resolve(__dirname, '..', 'data', 'unpackaged', 'apex-failing')]);
		assert.deepEqual(validateTestCmd.status, 1);
		assert(/Running Validation with test execution of directory/.test(validateTestCmd.stdout.toString()));
		assert(/Error:.*failed\./.test(validateTestCmd.stderr.toString()));
	});
});
