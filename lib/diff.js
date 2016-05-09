"use strict";

var parseDiff = require('parse-diff');
var MetadataFile = require('./metadata-file');
var MetadataContainer = require('./metadata-container');
var Git = require('./git');
var Utils = require('./utils');

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
		if (Utils.isValidFilename(file.from) || Utils.isValidFilename(file.to)
			|| Utils.isValidMetaFilename(file.from) || Utils.isValidMetaFilename(file.to))
		{
			var fileFrom = new MetadataFile({
				path: Utils.getRelativePathToUnpackaged(file.from),
				contents: new Buffer("")
			});
			var fileTo = new MetadataFile({
				path: Utils.getRelativePathToUnpackaged(file.to),
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
