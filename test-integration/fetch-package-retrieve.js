"use strict";

var assert = require("assert");
var path = require("path");
var child = require("child_process");
var tmp = require("tmp");

describe('force-dev-tool fetch package retrieve', function() {
	var fdt = path.resolve(__dirname, '..', 'bin', 'cli');
	var tmpobj = tmp.dirSync();
	it('should fetch package and retrieve some metadata types to ' + tmpobj.name, function() {
		this.timeout(1000 * 60 * 10);
		this.slow(1000 * 60 * 5);
		var fetchCmd = child.spawnSync("node", [fdt, 'fetch'], {
			cwd: tmpobj.name
		});
		assert.deepEqual(fetchCmd.status, 0);
		assert(/Fetching from remote env/.test(fetchCmd.stdout.toString()));
		assert(/Fetching remotes finished/.test(fetchCmd.stdout.toString()));

		var packageCmd = child.spawnSync("node", [fdt, 'package'], {
			cwd: tmpobj.name
		});
		assert.deepEqual(packageCmd.status, 0);
		assert(/Created src.*package\.xml/.test(packageCmd.stdout.toString()));

		var retrieveCmd = child.spawnSync("node", [fdt, 'retrieve'], {
			cwd: tmpobj.name
		});
		assert.deepEqual(retrieveCmd.status, 0);
		assert(/Retrieving from remote env to directory src/.test(retrieveCmd.stdout.toString()));
		assert(/Succeeded/.test(retrieveCmd.stdout.toString()));
	});
});
