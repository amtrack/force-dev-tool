"use strict";

var xml2js = require('xml2js');

var MetadataWriter = module.exports = function(type, metadataJson) {
	this.metadataJson = {};
	this.metadataJson[type] = metadataJson;
	this.metadataJson[type].$ = {
		xmlns: 'http://soap.sforce.com/2006/04/metadata'
	};
	delete this.metadataJson[type].fullName;
};

MetadataWriter.prototype.toString = function() {
	var self = this;
	var builder = new xml2js.Builder({
		xmldec: {
			version: '1.0',
			encoding: 'UTF-8'
		},
		explicitRoot: false,
		renderOpts: {
			pretty: true,
			indent: '    ',
			newline: '\n'
		}
	});
	var xml = builder.buildObject(self.metadataJson);
	return xml + '\n';
};
