"use strict";

var assert = require("assert");
var path = require("path");
var child = require("child_process");
var tmp = require("tmp");

describe('force-dev-tool package', function() {
	var fdt = path.resolve(__dirname, '..', '..', 'bin', 'cli');
	it('should fail to get an api version if there is no src/package.xml', function() {
		this.slow(1000);
		var tmpobj = tmp.dirSync();
		var packageVersionCmd = child.spawnSync("node", [fdt, 'package', 'version'], {
			cwd: tmpobj.name
		});
		assert.deepEqual(packageVersionCmd.status, 1);
		assert(/Error:.*does not exist/.test(packageVersionCmd.stderr.toString()));
	});
	it('should get/set the api version of a package', function() {
		this.slow(1000);
		var tmpobj = tmp.dirSync();
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
	context('add', function() {
		it('should fail adding invalid components', function() {
			this.slow(2000);
			var tmpobj = tmp.dirSync();
			var packageAddCmd = child.spawnSync("node", [fdt, 'package', 'add', 'Foo/Bar', 'ApexClass/Foo'], {
				cwd: tmpobj.name
			});
			assert.deepEqual(packageAddCmd.status, 1);
			assert(/Error:.*Invalid components.*/.test(packageAddCmd.stderr.toString()));
		});
	});
	context('add/list/grep/remove', function() {
		it('should add/remove components', function() {
			this.slow(2000);
			this.timeout(5000);
			var tmpobj = tmp.dirSync();
			var packageAddCmd = child.spawnSync("node", [fdt, 'package', 'add', 'ApexClass/Foo'], {
				cwd: tmpobj.name
			});
			assert.deepEqual(packageAddCmd.status, 0);

			var packageListCmd = child.spawnSync("node", [fdt, 'package', 'list'], {
				cwd: tmpobj.name
			});
			assert.deepEqual(packageListCmd.status, 0);
			assert(new RegExp('ApexClass/Foo').test(packageListCmd.stdout.toString()));

			var packageGrepCmd = child.spawnSync("node", [fdt, 'package', 'grep', '**/*'], {
				cwd: tmpobj.name
			});
			assert.deepEqual(packageGrepCmd.status, 0);
			assert(new RegExp('ApexClass/Foo').test(packageGrepCmd.stdout.toString()));

			var packageRemoveCmd = child.spawnSync("node", [fdt, 'package', 'remove', 'ApexClass/Foo'], {
				cwd: tmpobj.name
			});
			assert.deepEqual(packageRemoveCmd.status, 0);

			var packageGrep2Cmd = child.spawnSync("node", [fdt, 'package', 'grep', '**/*'], {
				cwd: tmpobj.name
			});
			assert.deepEqual(packageGrep2Cmd.status, 1);
			assert(/Error:.*No matches found/.test(packageGrep2Cmd.stderr.toString()));
		});
	});
});
