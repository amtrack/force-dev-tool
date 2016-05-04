"use strict";

var path = require('path');

var Storage = module.exports = function(opts) {
	var self = this;
	opts = opts || {};
	self.path = opts.path;
};

Storage.prototype.getSrcPath = function() {
	var self = this;
	return path.join(self.path, 'src');
};

Storage.prototype.getPackageXmlPath = function() {
	var self = this;
	return path.join(self.getSrcPath(), 'package.xml');
};

Storage.prototype.getConfigPath = function() {
	var self = this;
	return path.join(self.path, 'config');
};

Storage.prototype.getForceIgnorePath = function() {
	var self = this;
	return path.join(self.path, '.forceignore');
};
