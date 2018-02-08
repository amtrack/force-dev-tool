"use strict";

var assert = require("assert");
var path = require("path");
var child = require("child_process");
var tmp = require("tmp");

var tests = [{
		gitCloneUrl: "https://github.com/amtrack/sfdx-playground.git",
		branch: "apex",
		description: "should handle added/modified/deleted Apex classes including -meta.xml changes",
		a: "HEAD^{/v0:}",
		b: "HEAD",
		unpackaged_path: "src",
		expected: path.join("config", "deployments", "expected")
	},
	{
		gitCloneUrl: "https://github.com/amtrack/sfdx-playground.git",
		branch: "folders",
		description: "should handle added/deleted folders",
		a: "HEAD^{/v0:}",
		b: "HEAD",
		unpackaged_path: "src",
		expected: path.join("config", "deployments", "expected")
	},
	{
		gitCloneUrl: "https://github.com/amtrack/sfdx-playground.git",
		branch: "objects",
		description: "should handle added/modified/deleted CustomObjects with children",
		a: "HEAD^{/v0:}",
		b: "HEAD",
		unpackaged_path: "src",
		expected: path.join("config", "deployments", "expected")
	},
	{
		gitCloneUrl: "https://github.com/amtrack/sfdx-playground.git",
		branch: "object-properties",
		description: "should handle changed properties of CustomObjects",
		a: "HEAD^{/v0:}",
		b: "HEAD",
		unpackaged_path: "src",
		expected: path.join("config", "deployments", "expected"),
		skip: true
	},
	{
		gitCloneUrl: "https://github.com/amtrack/sfdx-playground.git",
		branch: "permissionset-v40",
		description: "should handle added/modified/deleted PermissionSet v40 changes",
		a: "HEAD^{/v0:}",
		b: "HEAD",
		unpackaged_path: "src",
		expected: path.join("config", "deployments", "expected"),
		skip: true
	}
];

describe("git diff | force-dev-tool changeset create", function() {
	var fdt = path.resolve(__dirname, "..", "bin", "cli");
	tests.forEach(function(test) {
		it(test.description, function() {
			if (test.skip) {
				this.skip();
			}
			this.slow(5000);
			this.timeout(20000);
			var tmpobj = tmp.dirSync();
			var gitDir = tmpobj.name;
			var gitCloneCmd = child.spawnSync(
				"git", ["clone", test.gitCloneUrl, gitDir], {
					cwd: gitDir
				}
			);
			assert.deepEqual(gitCloneCmd.status, 0, gitCloneCmd.stderr);
			var gitCheckoutCmd = child.spawnSync("git", ["checkout", test.branch], {
				cwd: gitDir
			});
			assert.deepEqual(gitCheckoutCmd.status, 0, gitCheckoutCmd.stderr);
			var diffCmd = child.spawnSync("git", ["diff", "--no-renames", test.a, test.b, test.unpackaged_path], {
				cwd: gitDir
			});
			var changesetCreateCmd = child.spawnSync(
				"node", [fdt, "changeset", "create", "test"], {
					cwd: gitDir,
					input: diffCmd.stdout
				}
			);
			assert.deepEqual(
				changesetCreateCmd.status,
				0,
				changesetCreateCmd.stdout
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
			assert.deepEqual(diffDirsCmd.status, 0, diffDirsCmd.stdout);
		});
	});
});
