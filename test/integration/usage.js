"use strict";

var assert = require("assert");
var path = require("path");
var child = require("child_process");
var tmp = require("tmp");
var packageJson = require("../../package.json");

describe('force-dev-tool', function() {
	var fdt = path.resolve(__dirname, '..', '..', 'bin', 'cli');
	var tmpobj = tmp.dirSync();
	it('should print a help text', function() {
		this.slow(1000);
		var helpCmd = child.spawnSync("node", [fdt, 'help'], {
			cwd: tmpobj.name
		});
		assert.deepEqual(helpCmd.status, 0);
		assert(/force-dev-tool/.test(helpCmd.stdout.toString()));
	});
	it('should print a help text for a specific command', function() {
		this.slow(1000);
		var helpFetchCmd = child.spawnSync("node", [fdt, 'help', 'fetch'], {
			cwd: tmpobj.name
		});
		assert.deepEqual(helpFetchCmd.status, 0);
		assert(/force-dev-tool fetch/.test(helpFetchCmd.stdout.toString()));
	});
	it('should print the version', function() {
		this.slow(1000);
		var versionCmd = child.spawnSync("node", [fdt, '--version'], {
			cwd: tmpobj.name
		});
		assert.deepEqual(versionCmd.status, 0);
		assert.deepEqual(versionCmd.stdout.toString().trim(), packageJson.version);
	});
});
