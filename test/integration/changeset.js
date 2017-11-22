"use strict";

var assert = require("assert");
var path = require("path");
var fs = require("fs-extra");
var child = require("child_process");
var tmp = require("tmp");

describe('force-dev-tool changeset', function() {
	var fdt = path.resolve(__dirname, '..', '..', 'bin', 'cli');
	it('should fail to create a changeset if there is no src/package.xml', function() {
		this.slow(1000);
		var tmpobj = tmp.dirSync();
		var changesetCreateCmd = child.spawnSync("node", [fdt, 'changeset', 'create', 'empty'], {
			cwd: tmpobj.name
		});
		assert.deepEqual(changesetCreateCmd.status, 1);
		assert(/Error:.*No XML to parse!/.test(changesetCreateCmd.stdout.toString()));
	});
	it('should create an empty changeset', function() {
		this.slow(1000);
		var tmpobj = tmp.dirSync();
		var packageVersionCmd = child.spawnSync("node", [fdt, 'package', 'version', '38.0'], {
			cwd: tmpobj.name
		});
		assert.deepEqual(packageVersionCmd.status, 0);
		var changesetCreateCmd = child.spawnSync("node", [fdt, 'changeset', 'create', 'empty'], {
			cwd: tmpobj.name
		});
		assert.deepEqual(changesetCreateCmd.status, 0);
		assert(new RegExp('38.0').test(changesetCreateCmd.stdout.toString()));
	});
	it('should create an empty destructive changeset', function() {
		this.slow(1000);
		var tmpobj = tmp.dirSync();
		var packageVersionCmd = child.spawnSync("node", [fdt, 'package', 'version', '38.0'], {
			cwd: tmpobj.name
		});
		assert.deepEqual(packageVersionCmd.status, 0);
		var changesetCreateCmd = child.spawnSync("node", [fdt, 'changeset', 'create', '--destructive', 'empty'], {
			cwd: tmpobj.name
		});
		assert.deepEqual(changesetCreateCmd.status, 0);
		assert(new RegExp('38.0').test(changesetCreateCmd.stdout.toString()));
	});
	it('should create a changeset from a git diff', function() {
		this.slow(1000);
		var tmpobj = tmp.dirSync();
		var env = process.env;
		env['GIT_AUTHOR_NAME'] = 'force-dev-tool';
		env['GIT_AUTHOR_EMAIL'] = 'force-dev-tool@example.com';
		env['EMAIL'] = 'force-dev-tool@example.com';
		var packageVersionCmd = child.spawnSync("node", [fdt, 'package', 'version', '38.0'], {
			cwd: tmpobj.name
		});
		assert.deepEqual(packageVersionCmd.status, 0);
		fs.copySync(path.join('test', 'data', 'unpackaged', 'apex-failing'), path.join(tmpobj.name, 'src'));
		assert.deepEqual(child.spawnSync("git", ['init'], {
			cwd: tmpobj.name
		}).status, 0);
		assert.deepEqual(child.spawnSync("git", ['add', '-A', '.'], {
			cwd: tmpobj.name
		}).status, 0);
		var gitCommitCmd = child.spawnSync("git", ['commit', '-m', 'failing'], {
			cwd: tmpobj.name,
			env: env
		});
		assert.deepEqual(gitCommitCmd.status, 0, gitCommitCmd.stderr.toString());
		assert.deepEqual(child.spawnSync("git", ['checkout', '-b', 'fix'], {
			cwd: tmpobj.name
		}).status, 0);
		fs.copySync(path.join('test', 'data', 'unpackaged', 'apex'), path.join(tmpobj.name, 'src'));
		assert.deepEqual(child.spawnSync("git", ['commit', '-am', 'fixed'], {
			cwd: tmpobj.name,
			env: env
		}).status, 0);
		var diffCmd = child.spawnSync("git", ['diff', 'master', 'fix'], {
			cwd: tmpobj.name
		});
		assert(new RegExp('Hello force-dev-tool').test(diffCmd.stdout.toString()), diffCmd.stdout.toString());
		var changesetCreateCmd = child.spawnSync("node", [fdt, 'changeset', 'create', 'apex'], {
			cwd: tmpobj.name,
			input: diffCmd.stdout
		});
		assert.deepEqual(changesetCreateCmd.status, 0);
		assert(new RegExp('38.0').test(changesetCreateCmd.stdout.toString()));
		assert(fs.existsSync(path.join(tmpobj.name, "config", "deployments", "apex", "package.xml")));
		assert(fs.existsSync(path.join(tmpobj.name, "config", "deployments", "apex", "classes", "Test_HelloWorld.cls")));
		assert(fs.existsSync(path.join(tmpobj.name, "config", "deployments", "apex", "classes", "Test_HelloWorld.cls-meta.xml")));
	});
});
