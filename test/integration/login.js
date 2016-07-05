"use strict";

var assert = require("assert");
var path = require("path");
var child = require("child_process");
var tmp = require("tmp");

// run integration tests against remote organization only when TEST_INTEGRATION environment variable is set to true
(process.env.TEST_INTEGRATION === 'true' ? describe : describe.skip)('force-dev-tool login', function() {
	var fdt = path.resolve(__dirname, '..', '..', 'bin', 'cli');
	var tmpobj = tmp.dirSync();
	it('should login using the Metadata API and print a login URL', function() {
		this.timeout(1000 * 20);
		this.slow(1000 * 5);
		var loginCmd = child.spawnSync("node", [fdt, 'login'], {
			cwd: tmpobj.name
		});
		assert.deepEqual(loginCmd.status, 0);
		assert(/Logged in successfully/.test(loginCmd.stdout.toString()));
		assert(/https/.test(loginCmd.stdout.toString()));
	});
});
