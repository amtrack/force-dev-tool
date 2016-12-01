"use strict";

/*eslint-env es6 */

var Command = require('./command');
var CliUtils = require('../cli/utils');
var FetchResultParser = require('../fetch-result-parser');
var MetadataComponent = require('../metadata-component');
var Nightmare = require('nightmare');
var NightmareSalesforce = require('../nightmare-salesforce');
var Promise = require("bluebird");
var _ = require('underscore')

var doc = "Usage:\n" +
	"	force-dev-tool real-changeset list [options]\n" +
	"	force-dev-tool real-changeset create [options] <changesetName> [--description=<description>]\n" +
	"	force-dev-tool real-changeset info [options] <changesetId>\n" +
	"	force-dev-tool real-changeset delete [options] <changesetId>\n" +
	"	force-dev-tool real-changeset update [options] <changesetId> <metadataFileOrComponentNames>...\n" +
	"\n" +
	"Options:\n" +
	"	-r --remote=<remote>         The remote organization.\n" +
	"	--apiVersion=<apiVersion>    API version. Defaulted to API version of project.\n" +
	"	--show                       Open a browser.\n" +
	"	--progress                   Show progress.\n" +
	"	-f --force                   Overwrites the target directory if it exists already.";

var SubCommand = module.exports = function(project) {
	var self = this;
	Command.call(self, doc, project);
};

SubCommand.prototype = Object.create(Command.prototype);
SubCommand.prototype.constructor = SubCommand;

SubCommand.prototype.complete = function(tabtab, data) {
	// TODO: allow glob completion
	return tabtab.log(['create', '-d', '--destructive', '-f', '--force'], data, '');
};

// var promiseWhile = Promise.method(function(condition, action) {
// 	if (!condition()) {
// 		return;
// 	}
// 	return action().then(promiseWhile.bind(null, condition, action));
// });

var addEntityType = function(fileProperties) {
	// test/data/changeset-metadata-types.json
	var mappings = {
		'ApprovalProcess': 'ProcessDefinition',
		'ChannelLayout': 'CommChannelLayout',
		'CorsWhitelistOrigin': 'CorsWhitelistEntry',
		'CustomApplication': 'TabSet',
		'CustomApplicationComponent': 'CustomConsoleComponent',
		'CustomField': 'CustomFieldDefinition',
		'CustomLabel': 'ExternalString',
		'CustomObject': 'CustomEntityDefinition',
		'CustomTab': 'CustomTabDefinition',
		'EntitlementProcess': 'SlaProcess',
		'GlobalValueSet': 'SharedPicklistDefinition',
		'HomePageComponent': 'PageComponent',
		'HomePageLayout': 'CustomPage',
		'Letterhead': 'BrandTemplate',
		'Queue': 'Queues',
		'QuickAction': 'QuickActionDefinition',
		'ReportType': 'CustomReportType',
		'Role': 'UserRole',
		'SharingReason': 'CustomShareRowCause',
		'Translations': 'Translation',
		'ValidationRule': 'ValidationFormula',
		'WorkflowAlert': 'ActionEmail',
		'WorkflowFieldUpdate': 'ActionFieldUpdate',
		'WorkflowOutboundMessage': 'ActionOutboundMessage',
		'WorkflowTask': 'ActionTask'
	};
	// 'Article Type': '?'
	// 'CustomObject': 'Custom Settings',
	fileProperties.forEach(function(fileProperty) {
		fileProperty.entityType = mappings[fileProperty.type] ? mappings[fileProperty.type] : fileProperty.type;
		if (fileProperty.fullName.match(/.*__mdt$/)) {
			fileProperty.entityType = 'Custom Metadata Type';
		}
		if (fileProperty.type === 'CustomMetadata') {
			fileProperty.entityType = fileProperty.fullName.split('.')[0] + '__mdt';
		}
	});
	fileProperties = _.reject(fileProperties, function(fileProperty) {
		return fileProperty.type === 'CustomLabels';
	});
	return fileProperties;
};

SubCommand.prototype.process = function(proc, callback) {
	var self = this;
	self.opts = self.docopt();
	var fetchResult = new FetchResultParser(CliUtils.readJsonFile(self.project.getFetchResultPath(self.opts['--remote'])));

	var remote;
	try {
		remote = self.project.remotes.get(self.opts['--remote']);
	} catch (err) {
		return callback(err);
	}
	remote.connect(function(loginErr, conn) {
		if (loginErr) {
			return callback('Login failed for remote ' + remote.name + ': ' + loginErr);
		}
		var nightmare = new Nightmare({
				show: self.opts['--show'],
				alwaysOnTop: false
			})
			.viewport(1024, 768);
		var nightmareSalesforce = new NightmareSalesforce(conn.instanceUrl);

		return nightmare.then(function() {
				if (self.opts.list) {
					// var hasMore = false
					// var currentPage = 1;
					// var maxPages = 2;
					// while (hasMore && currentPage < maxPages) {
					//
					// 	hasMore = result.hasMore;
					// 	currentPage++;
					// }
					return nightmare
						.use(nightmareSalesforce.login(conn.accessToken))
						.use(nightmareSalesforce.openOutboundChangesets())
						.use(nightmareSalesforce.listChangesets())
						.then(function(results) {
							// TODO: csv output with description column
							var res = results.map(function(row) {
								return row.id + '\t\t' + row.name;
							}).join('\n');
							return Promise.resolve(res);
						});
				} else if (self.opts.create) {
					return nightmare
						.use(nightmareSalesforce.login(conn.accessToken))
						.use(nightmareSalesforce.openOutboundChangesets())
						.use(nightmareSalesforce.createChangeset(self.opts['<changesetName>'], self.opts['--description']))
						.then(function(results) {
							return Promise.resolve(results);
						});
				} else if (self.opts.info) {
					return nightmare
						.use(nightmareSalesforce.login(conn.accessToken))
						.use(nightmareSalesforce.openOutboundChangeset(self.opts['<changesetId>']))
						.use(nightmareSalesforce.getPackageIdForChangeset(self.opts['<changesetId>']))
						.then(function(results) {
							return Promise.resolve(results);
						});
				} else if (self.opts.delete) {
					return nightmare
						.use(nightmareSalesforce.login(conn.accessToken))
						.use(nightmareSalesforce.openOutboundChangeset(self.opts['<changesetId>']))
						.use(nightmareSalesforce.deleteChangeset())
						.then(function(results) {
							return Promise.resolve(results);
						});
				} else if (self.opts.update) {
					var componentNames = CliUtils.handleXargsNull(self.opts['<metadataFileOrComponentNames>']);
					var unresolvedComponents = [];
					var fileProperties = [];
					componentNames.forEach(function(componentName) {
						var component = new MetadataComponent(componentName);
						if (!component) {
							unresolvedComponents.push(componentName);
							return;
						}
						var match = _.findWhere(fetchResult.fileProperties, {
							type: component.type,
							fullName: component.fullName
						});
						if (match) {
							fileProperties.push(match);
						} else {
							unresolvedComponents.push(componentName);
						}
					});
					if (unresolvedComponents.length) {
						var message = "Could not resolve some component ids. Did you run `force-dev-tool fetch " + remote.name + "` yet?";
						message += "\n" + unresolvedComponents.join("\n");
						throw new Error(message);
					}
					fileProperties = addEntityType(fileProperties);
					var groupedAndSortedComponents = _.groupBy(fileProperties, 'entityType');
					return nightmare
						.use(nightmareSalesforce.login(conn.accessToken))
						.use(nightmareSalesforce.openOutboundChangeset(self.opts['<changesetId>']))
						.use(nightmareSalesforce.getPackageIdForChangeset(self.opts['<changesetId>']))
						.then(function(packageId) {
							return Promise.mapSeries(Object.keys(groupedAndSortedComponents).sort(), function(entityType) {
								if (self.opts['--progress']) {
									console.log('Processing', entityType);
								}
								return nightmare
									.use(nightmareSalesforce.selectMetadataComponents(packageId, entityType, groupedAndSortedComponents[entityType]))
									.then(function(selectResult) {
										var saveRequired = _.where(selectResult, {
											selected: true
										}).length > 0;
										if (saveRequired) {
											return nightmare
												.use(nightmareSalesforce.saveSelectedMetadataComponents(selectResult));
										} else {
											return selectResult;
										}
									});
							});
						}).then(function(results) {
							var processed = _.flatten(results);
							var added = _.where(processed, {
								selected: true
							});
							return added.map(function(item) {
								return item.type + "/" + item.fullName;
							}).join("\n");
						});
				}
			})
			.then(function(results) {
				if (results) {
					console.log(results);
				}
				return nightmare.end()
					.then(function() {
						return callback();
					});
			})
			.catch(function(err) {
				return nightmare.end()
					.then(function() {
						return callback(err);
					});
			});
	});
};
