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
	var explicitTests = [{
		gitCloneUrl: "https://github.com/amtrack/sfdx-playground.git",
		branch: "explicit-custom-field",
		description: "should extract a single CustomField from a CustomObject",
		patterns: ["CustomField/Account.VAT_Number__c"],
		unpackaged_path: "src",
		expected: path.join("config", "deployments", "expected")
	}];
	explicitTests.forEach(function(test) {
		it(test.description, function() {
			if (test.skip) {
				this.skip();
			}
			this.slow(5000);
			this.timeout(20000);
			var tmpobj = tmp.dirSync();
			var gitDir = tmpobj.name;
			var gitCloneCmd = child.spawnSync(
				"git", ["clone", "-c", "core.autocrlf=false", test.gitCloneUrl, gitDir], {
					cwd: gitDir
				}
			);
			assert.deepEqual(gitCloneCmd.status, 0, gitCloneCmd.stderr.toString());
			var gitCheckoutCmd = child.spawnSync("git", ["checkout", test.branch], {
				cwd: gitDir
			});
			assert.deepEqual(gitCheckoutCmd.status, 0, gitCheckoutCmd.stderr.toString());
			var changesetArgs = [fdt, "changeset", "create", "test"];
			[].push.apply(changesetArgs, test.patterns);
			var changesetCreateCmd = child.spawnSync(
				"node", changesetArgs, {
					cwd: gitDir
				}
			);
			assert.deepEqual(
				changesetCreateCmd.status,
				0,
				changesetCreateCmd.stdout.toString()
			);
			var diffDirsCmd = child.spawnSync(
				"diff", [
					"-u",
					"-r",
					path.join(gitDir, test.expected),
					path.join(gitDir, "config", "deployments", "test")
				], {
					cwd: gitDir
				}
			);
			assert.deepEqual(diffDirsCmd.status, 0, diffDirsCmd.stdout.toString());
		});
	});
});
