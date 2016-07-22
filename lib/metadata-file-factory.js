"use strict";

var MetadataFile = require('./metadata-file');
var MetadataFileContainer = require('./metadata-file-container');

exports.createInstance = function(opts) {
	var file = new MetadataFile(opts);
	var metadataType = file.getMetadataType();
	if (metadataType && metadataType.childXmlNames) {
		return new MetadataFileContainer(opts);
	}
	return file;
};
