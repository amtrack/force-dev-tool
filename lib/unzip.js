var yauzl = require('yauzl');
var path = require('path');
var mkdirp = require("mkdirp");
var fs = require('fs-extra');

var Unzip = module.exports = function(zipFilename) {
	var self = this;
	self.zipFilename = zipFilename;
};

Unzip.prototype.target = function(targetDirectory, callback) {
	var self = this;
	yauzl.open(self.zipFilename, function(openErr, zipfile) {
		var base = 'unpackaged';
		zipfile.on("entry", function(entry) {
			zipfile.openReadStream(entry, function(unzipErr, readStream) {
				if (unzipErr) {
					return callback(unzipErr);
				}
				if (/\/$/.test(entry.fileName)) {
					// directory file names end with '/'
					return;
				}
				var outputDir = path.dirname(entry.fileName);
				base = entry.fileName.split('/')[0];
				mkdirp(outputDir, function(mkdirErr) {
					if (mkdirErr) {
						return callback(mkdirErr);
					}
					readStream.pipe(fs.createWriteStream(entry.fileName));
				});
			});
		});
		zipfile.once("close", function() {
			fs.move(path.resolve(base), targetDirectory, {
				clobber: true
			}, callback);
		});
	});
};
