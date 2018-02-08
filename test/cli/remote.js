"use strict";

var assert = require("assert");
var path = require("path");
var child = require("child_process");
var tmp = require("tmp");

describe('force-dev-tool remote', function() {
	var fdt = path.resolve(__dirname, '..', '..', 'bin', 'cli');
	var tmpobj = tmp.dirSync();
	it('should list the default remote', function() {
		this.slow(1000);
		var env = JSON.parse(JSON.stringify(process.env));
		env['SFDC_USERNAME'] = 'user@example.com';
		env['SFDC_PASSWORD'] = '12345';
		env['SFDC_SERVER_URL'] = 'https://login.salesforce.com';
		var remoteListCmd = child.spawnSync("node", [fdt, 'remote', '-v'], {
			cwd: tmpobj.name,
			env: env
		});
		assert.deepEqual(remoteListCmd.status, 0);
		assert(/env \(default\): /.test(remoteListCmd.stdout.toString()));
	});
});
