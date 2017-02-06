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
	yauzl.open(self.zipFilename, {
		lazyEntries: true
	}, function(openErr, zipfile) {
		if (openErr) {
			return callback(openErr);
		}
		var overwrite = true;
		if (overwrite) {
			fs.removeSync(targetDirectory);
		}
		zipfile.readEntry();
		zipfile.once("close", callback);
		zipfile.on("entry", function(entry) {
			zipfile.openReadStream(entry, function(unzipErr, readStream) {
				if (unzipErr) {
					return callback(unzipErr);
				}
				if (/\/$/.test(entry.fileName)) {
					// directory file names end with '/'
					zipfile.readEntry();
					return;
				}
				var outputDir = path.join(targetDirectory, path.dirname(entry.fileName));
				var outputFile = path.join(targetDirectory, entry.fileName);
				mkdirp(outputDir, function(mkdirErr) {
					if (mkdirErr) {
						return callback(mkdirErr);
					}
					readStream.pipe(fs.createWriteStream(outputFile));
					readStream.on("end", function() {
						zipfile.readEntry();
					});
				});
			});
		});
	});
};
