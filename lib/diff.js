"use strict";

var parseDiff = require('parse-diff');
var MetadataUtils = require('force-metadata-utils');
var MetadataFile = MetadataUtils.MetadataFile;
var MetadataContainer = MetadataUtils.MetadataContainer;
var Git = require('./git');
var utils = require('./utils');

var Diff = module.exports = function(data) {
	this.data = data;
	this.git = new Git(process.cwd());
};

Diff.prototype.data = function() {
	return this.data;
};

Diff.prototype.getMetadataContainers = function() {
	var self = this;
	var containerFrom = new MetadataContainer();
	var containerTo = new MetadataContainer();
	var files = parseDiff(self.data);
	files.forEach(function(file) {
		if (MetadataUtils.Utils.isValidFilename(file.from) || MetadataUtils.Utils.isValidFilename(file.to)
			|| MetadataUtils.Utils.isValidMetaFilename(file.from) || MetadataUtils.Utils.isValidMetaFilename(file.to))
		{
			var fileFrom = new MetadataFile({
				path: utils.getRelativePathToUnpackaged(file.from),
				contents: new Buffer("")
			});
			var fileTo = new MetadataFile({
				path: utils.getRelativePathToUnpackaged(file.to),
				contents: new Buffer("")
			});
			if (file.index && file.index.length) {
				// retrieve file using git
				var parts = file.index[0].split('..');
				if (!file.new) {
					fileFrom.contents = new Buffer(self.git.show(parts[0]));
				}
				if (!file.deleted) {
					fileTo.contents = new Buffer(self.git.show(parts[1]));
				}
			}
			containerFrom.add(fileFrom, []);
			containerTo.add(fileTo, []);
		}
	});
	return {
		source: containerFrom,
		target: containerTo
	};
};
