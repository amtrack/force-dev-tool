"use strict";

var Command = require('./command');
var config = new(require('../config'))();
var Manifest = require('../manifest');
var CliUtils = require('./utils');
var path = require('path');
var Zip = require('../zip');
var chalk = require('chalk');
var fs = require('fs');
var deployDetails = require('../deploy-details');

var doc = "Usage:\n" +
	"	force-dev-tool deploy [options] [<remote>]\n" +
	"\n" +
	"Deploy metadata specified in a package.xml.\n" +
	"\n" +
	"Options:\n" +
	"	-c --checkOnly           Perform a test deployment (validation).\n" +
	"	-t --test                Run local tests.\n" +
	"	--runTests=<classNames>  Names of test classes (one argument, separated by whitespace).\n" +
	"	--runAllTests            Run all tests including tests of managed packages.\n" +
	"	--purgeOnDelete          Don't store deleted components in the recycle bin.\n" +
	"	--noSinglePackage        Allows to deploy multiple packages.\n" +
	"	-d=<directory>           Directory to be deployed [default: src].\n" +
	"	-f=<zipFile>             Zip file to be deployed.\n" +
	"\n" +
	"Examples:\n" +
	"\n" +
	"	Deploying the default directory to the default remote\n" +
	"		$ force-dev-tool deploy\n" +
	"		Running Deployment of directory src to remote mydev\n" +
	"		Visit https://mynamespace.my.salesforce.com/changemgmt/monitorDeploymentsDetails.apexp?asyncId=REDACTED for more information.\n" +
	"\n" +
	"	Deploying to another remote\n" +
	"		$ force-dev-tool deploy myqa\n" +
	"\n" +
	"	Deploying a specified directory\n" +
	"		$ force-dev-tool deploy -d config/deployments/vat\n" +
	"\n" +
	"	Perform a test deployment (validation)\n" +
	"		$ force-dev-tool deploy --checkOnly\n" +
	"		$ force-dev-tool deploy -c\n" +
	"\n" +
	"	Deploying with running local tests\n" +
	"		$ force-dev-tool deploy -t\n" +
	"		$ force-dev-tool deploy --test\n" +
	"\n" +
	"	Deploying with running specified test classes\n" +
	"		$ force-dev-tool deploy --runTests 'Test_MockFoo Test_MockBar'\n" +
	"\n" +
	"	Deploying with running test classes matching a pattern\n" +
	"		$ force-dev-tool package grep 'ApexClass/Test_Mock*' \\\n" +
	"		 | cut -d '/' -f 2 \\\n" +
	"		 | xargs -0 force-dev-tool deploy --runTests\n" +
	"\n" +
	"	Deploying with running only test classes being contained in a deployment\n" +
	"		$ force-dev-tool package -f config/deployments/mock/package.xml grep 'ApexClass/Test_*' \\\n" +
	"		 | cut -d '/' -f 2 \\\n" +
	"		 | xargs -0 force-dev-tool deploy -d config/deployments/mock --runTests";

var SubCommand = module.exports = function(project, subcommandDoc) {
	var self = this;
	Command.call(self, subcommandDoc ? subcommandDoc : doc, project);
	self.action = "Deployment";
	self.deployOpts = {
		rollbackOnError: true,
		singlePackage: true
	};
};

SubCommand.prototype = Object.create(Command.prototype);
SubCommand.prototype.constructor = SubCommand;

SubCommand.prototype.formatDetails = function(details) {
	var messages = [];
	if (details.componentFailures) {
		var componentFailures = details.componentFailures;
		if (!Array.isArray(componentFailures)) {
			componentFailures = [componentFailures];
		}
		messages = messages.concat(componentFailures.map(function(f) {
			if (f.fullName && f.componentType) {
				return ' - ' + f.problemType + " in " + f.componentType + " component '" + f.fullName + "': " + f.problem;
			} else {
				return ' - ' + f.problemType + " in file '" + f.fileName + "': " + f.problem;
			}
		}));
	}
	if (details.runTestResult && details.runTestResult.failures) {
		var failures = details.runTestResult.failures;
		if (!Array.isArray(failures)) {
			failures = [failures];
		}
		messages = messages.concat(failures.map(function(f) {
			return ' - ' + f.message + ', stackTrace: ' + f.stackTrace;
		}));
	}
	if (details.runTestResult && details.runTestResult.codeCoverageWarnings) {
		var warnings = details.runTestResult.codeCoverageWarnings;
		if (!Array.isArray(warnings)) {
			warnings = [warnings];
		}
		messages = messages.concat(warnings.map(function(f) {
			return ' - ' + f.message;
		}));
	}
	return messages.join("\n");
};

SubCommand.prototype.process = function(proc, callback) {
	var self = this;
	self.opts = self.opts ? self.opts : self.docopt();

	if (self.opts['--checkOnly']) {
		self.deployOpts['checkOnly'] = true;
		self.action = "Validation";
	}

	self.deployOpts['purgeOnDelete'] = self.opts['--purgeOnDelete'];

	if (self.opts['--runAllTests']) {
		self.deployOpts['testLevel'] = 'RunAllTestsInOrg';
		self.action += " with RunAllTestsInOrg option";
	} else if (self.opts['--runTests']) {
		var optsClassNames = self.opts['--runTests'];
		// allow even newlines as separator
		var classNames = optsClassNames ? optsClassNames.split(/\s+/g) : [];
		// trim each item and remove empty items
		classNames = classNames.map(function(item) {
			return item.trim();
		}).filter(Boolean);
		self.deployOpts['testLevel'] = 'RunSpecifiedTests';
		self.deployOpts['runTests'] = classNames;
		self.action += " with RunSpecifiedTests option";
	} else if (self.opts['--test']) {
		// run local tests by default
		self.deployOpts['testLevel'] = 'RunLocalTests';
		self.action += " with test execution";
	} else {
		self.deployOpts['testLevel'] = 'NoTestRun';
	}

	if (self.opts['--noSinglePackage']) {
		self.deployOpts['singlePackage'] = false;
	}

	var remote;
	try {
		remote = self.project.remotes.get(self.opts['<remote>']);
	} catch (err) {
		return callback(err);
	}
	var zipStream;
	if (self.opts['-f']) {
		var zipFilePath = path.resolve(self.opts['-f']);
		console.log('Running ' + chalk.cyan(self.action) + ' of zip file ' + chalk.cyan(path.relative(proc.cwd, zipFilePath)) + ' to remote ' + chalk.cyan(remote.name));
		zipStream = fs.createReadStream(zipFilePath);
	} else {
		var deployRoot = self.opts['-d'] ? path.resolve(self.opts['-d']) : self.project.storage.getSrcPath();
		var currentPackageXml = new Manifest();
		try {
			currentPackageXml = Manifest.fromPackageXml(CliUtils.readFileSafe(path.join(deployRoot, 'package.xml')));
			config.set('defaultApiVersion', currentPackageXml.apiVersion);
		} catch (err) {
			// ignore since running unit tests using an empty deployment does not require a package.xml
		}
		var zipFile = new Zip();
		if (self.action === 'Test execution') {
			console.log('Running ' + chalk.cyan(self.action) + ' to remote ' + chalk.cyan(remote.name));
		} else {
			zipFile.directory(deployRoot);
			console.log('Running ' + chalk.cyan(self.action) + ' of directory ' + chalk.cyan(path.relative(proc.cwd, deployRoot)) + ' to remote ' + chalk.cyan(remote.name));
		}
		zipStream = zipFile.stream();
	}
	remote.connect(function(loginErr, conn) {
		if (loginErr) {
			return callback(loginErr);
		}
		conn.metadata.pollTimeout = config.pollTimeout;
		conn.metadata.deploy(zipStream, self.deployOpts).complete({
			details: true
		}, function(err, res) {
			if (err) {
				return callback(err);
			}
			var messages = []
			if (res.status === 'Failed') {
				messages.push(self.action + ' failed.');
				if (res.details) {
					messages.push(self.formatDetails(res.details));
				}
			}
			if (res.details && res.details.runTestResult && res.details.runTestResult.codeCoverage) {
				console.log(deployDetails.formatOverallCodeCoverage(deployDetails.getOverallCodeCoverage(res.details)));
			}
			if (res.id) {
				messages.push('Visit ' + conn.instanceUrl + '/changemgmt/monitorDeploymentsDetails.apexp?asyncId=' + res.id + ' for more information.');
			}
			if (res.status === 'Failed') {
				return callback(messages.join("\n"));
			}
			return callback(null, messages.join("\n"));
		});
	});
};
