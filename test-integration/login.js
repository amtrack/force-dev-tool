"use strict";

var assert = require("assert");
var path = require("path");
var child = require("child_process");
var tmp = require("tmp");

describe('force-dev-tool login', function() {
	var fdt = path.resolve(__dirname, '..', 'bin', 'cli');
	var tmpobj = tmp.dirSync();
	it('should login using the Metadata API and print a login URL', function() {
		this.timeout(1000 * 20);
		this.slow(1000 * 5);
		var loginCmd = child.spawnSync("node", [fdt, 'login'], {
			cwd: tmpobj.name
		});
		assert.deepEqual(loginCmd.status, 0, loginCmd.stderr);
		assert(/Logged in successfully/.test(loginCmd.stdout.toString()));
		assert(/https/.test(loginCmd.stdout.toString()));
	});
	it('should fail login using invalid credentials', function() {
		var env = JSON.parse(JSON.stringify(process.env));
		env["SFDC_USERNAME"] = "invalidUsername";
		env["SFDC_PASSWORD"] = "invalidPassword";
		env["SFDC_SERVER_URL"] = "https://test.salesforce.com";
		this.timeout(1000 * 20);
		this.slow(1000 * 5);
		var loginCmd = child.spawnSync("node", [fdt, 'login'], {
			cwd: tmpobj.name,
			env: env
		});
		assert.deepEqual(loginCmd.status, 1);
		assert(/Login failed/.test(loginCmd.stderr.toString()));
	});
});
