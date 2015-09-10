"use strict";

var path = require('path');

/*var Storage = */module.exports = function(opts) {
	var self = this;
	opts = opts || {};
	self.path = opts.path;
	self.unpackagedDir = path.join(self.path, 'src');
	self.configPath = path.join(self.path, 'config');
	self.forceIgnorePath = path.join(self.path, '.forceignore');
};
