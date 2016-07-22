"use strict";

var parseDiff = require('parse-diff');
var MetadataFileFactory = require('./metadata-file-factory');
var MetadataContainer = require('./metadata-container');
var Git = require('./git');
var Utils = require('./utils');
var path = require('path');

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
	var unpackagedPath = path.join(process.cwd(), 'src');
	files.forEach(function(file) {
		if (Utils.isValidFilename(file.from) || Utils.isValidFilename(file.to) || Utils.isValidMetaFilename(file.from) || Utils.isValidMetaFilename(file.to)) {
			var fileFrom = MetadataFileFactory.createInstance({
				path: file.from === '/dev/null' ? file.from : path.relative(unpackagedPath, file.from),
				contents: new Buffer("")
			});
			var fileTo = MetadataFileFactory.createInstance({
				path: file.to === '/dev/null' ? file.to : path.relative(unpackagedPath, file.to),
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
