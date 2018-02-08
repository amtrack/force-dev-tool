"use strict";

var assert = require("assert");
var path = require("path");
var child = require("child_process");
var tmp = require("tmp");

describe("force-dev-tool changeset", function() {
	var fdt = path.resolve(__dirname, "..", "..", "bin", "cli");
	it("should fail to create a changeset if there is no src/package.xml", function() {
		this.slow(1000);
		this.timeout(5000);
		var tmpobj = tmp.dirSync();
		var changesetCreateCmd = child.spawnSync(
			"node", [fdt, "changeset", "create", "empty"], {
				cwd: tmpobj.name
			}
		);
		assert.deepEqual(changesetCreateCmd.status, 1);
		assert(
			/Error:.*No XML to parse!/.test(changesetCreateCmd.stderr.toString())
		);
	});
	it("should create an empty changeset", function() {
		this.slow(1000);
		this.timeout(5000);
		var tmpobj = tmp.dirSync();
		var packageVersionCmd = child.spawnSync(
			"node", [fdt, "package", "version", "38.0"], {
				cwd: tmpobj.name
			}
		);
		assert.deepEqual(packageVersionCmd.status, 0);
		var changesetCreateCmd = child.spawnSync(
			"node", [fdt, "changeset", "create", "empty"], {
				cwd: tmpobj.name
			}
		);
		assert.deepEqual(changesetCreateCmd.status, 0);
		assert(new RegExp("38.0").test(changesetCreateCmd.stdout.toString()));
	});
	it("should create an empty destructive changeset", function() {
		this.slow(1000);
		this.timeout(5000);
		var tmpobj = tmp.dirSync();
		var packageVersionCmd = child.spawnSync(
			"node", [fdt, "package", "version", "38.0"], {
				cwd: tmpobj.name
			}
		);
		assert.deepEqual(packageVersionCmd.status, 0);
		var changesetCreateCmd = child.spawnSync(
			"node", [fdt, "changeset", "create", "--destructive", "empty"], {
				cwd: tmpobj.name
			}
		);
		assert.deepEqual(changesetCreateCmd.status, 0);
		assert(new RegExp("38.0").test(changesetCreateCmd.stdout.toString()));
	});
});
