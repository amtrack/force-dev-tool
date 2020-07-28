"use strict";

var child = require('child_process');

var Git = module.exports = function(basedir) {
	this.basedir = basedir;
};

Git.prototype.show = function(revision) {
	var self = this;
	var result = child.spawnSync('git', ['show', revision], {
		cwd: self.basedir
	});
	return result.stdout;
};
