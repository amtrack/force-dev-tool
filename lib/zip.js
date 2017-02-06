var yazl = require('yazl');
var path = require('path');
var glob = require('glob');

var Zip = module.exports = function() {
	var self = this;
	self.zipfile = new yazl.ZipFile();
	self.options = {
		compress: true,
		forceZip64Format: false
	};
};

Zip.prototype.directory = function(dirpath) {
	var self = this
	glob.sync('**/*', {
		cwd: dirpath,
		nodir: true
	}).forEach(function(file) {
		var absolutePath = path.join(dirpath, file);
		var pathWithinArchive = file.normalize(); // Apple HFS
		self.zipfile.addFile(absolutePath, pathWithinArchive, self.options);
	});
	return self;
};

Zip.prototype.stream = function() {
	var self = this;
	self.zipfile.end({
		forceZip64Format: self.options.forceZip64Format
	});
	return self.zipfile.outputStream;
};
