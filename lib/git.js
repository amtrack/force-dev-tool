"use strict";

var child = require('child_process');

var Git = module.exports = function(basedir) {
	this.basedir = basedir;
};

Git.prototype.show = function(revision) {
	var self = this;
	return child.spawnSync('git', ['show', revision], {cwd: self.basedir}).stdout;
};
