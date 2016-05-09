"use strict";

var config;

var Config = module.exports = function(opts) {
	opts = opts ? opts : {};
	if (config === undefined) {
		config = {};
		config.pollTimeout = opts.pollTimeout !== undefined ? opts.pollTimeout : 15 * 60 * 1000; // 15 minutes
		config.defaultMetadataTypes = opts.defaultMetadataTypes !== undefined ? opts.defaultMetadataTypes : ['ApexClass', 'ApexComponent', 'ApexPage', 'ApexTrigger', 'CustomField', 'CustomObject', 'CustomTab', 'WebLink'];
		config.defaultApiVersion = opts.defaultApiVersion !== undefined ? opts.defaultApiVersion : "34.0";
		config.folderBasedMetadataMap = opts.folderBasedMetadataMap !== undefined ? opts.folderBasedMetadataMap : {
			'EmailFolder': 'EmailTemplate',
			'DashboardFolder': 'Dashboard',
			'DocumentFolder': 'Document',
			'ReportFolder': 'Report'
		};
	}
};

Config.prototype.get = function(key) {
	return config[key];
};

Config.prototype.set = function(key, value) {
	config[key] = value;
};
