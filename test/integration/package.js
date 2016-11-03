"use strict";

var assert = require("assert");
var path = require("path");
var child = require("child_process");
var tmp = require("tmp");

describe('force-dev-tool package', function() {
	var fdt = path.resolve(__dirname, '..', '..', 'bin', 'cli');
	var tmpobj = tmp.dirSync();
	it('should fail to get an api version if there is no src/package.xml', function() {
		this.slow(1000);
		var packageVersionCmd = child.spawnSync("node", [fdt, 'package', 'version'], {
			cwd: tmpobj.name
		});
		assert.deepEqual(packageVersionCmd.status, 1);
		assert(/Error:.*does not exist/.test(packageVersionCmd.stdout.toString()));
	});
	it('should get/set the api version of a package', function() {
		this.slow(1000);
		var packageVersionSetCmd = child.spawnSync("node", [fdt, 'package', 'version', '38.0'], {
			cwd: tmpobj.name
		});
		assert.deepEqual(packageVersionSetCmd.status, 0);
		var packageVersionCmd = child.spawnSync("node", [fdt, 'package', 'version'], {
			cwd: tmpobj.name
		});
		assert.deepEqual(packageVersionCmd.status, 0);
		assert(new RegExp('38.0').test(packageVersionCmd.stdout.toString()));
	});
});
