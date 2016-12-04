"use strict";

var path = require('path');
var Zip = require('../zip');
var chalk = require('chalk');
var Command = require('./command');
var config = new(require('../config'))();
var Manifest = require('../manifest');
var CliUtils = require('./utils');
var formatting = require('../test-result-formatting');

var doc = "Usage:\n" +
	"	force-dev-tool test [options] [<remote>]\n" +
	"\n" +
	"Run unit tests.\n" +
	"Running all tests is being achieved by performing an **empty** test deployment (validation) with testLevel=RunLocalTests.\n" +
	"Running specified tests is being achieved by using the Tooling API runTestsSynchronous method.\n" +
	"\n" +
	"Options:\n" +
	"	--classNames=<classNames>    Names of Test Classes separated by whitespace. Supported API versions =< 36.0\n" +
	"	--apiVersion=<apiVersion>    API version.\n" +
	"	--verbose                    Print log messages for successful test methods.\n" +
	"	-d=<directory>               Directory containing the metadata and package.xml.\n" +
	"\n" +
	"Examples:\n" +
	"\n" +
	"	Running all local tests\n" +
	"		$ force-dev-tool test\n" +
	"		Running Test execution to remote mydev\n" +
	"		Failures:\n" +
	"		Test_Foo#test_method_one took 32.0\n" +
	"		  - System.AssertException: Assertion Failed: Expected: foo, Actual: bar\n" +
	"		  - Class.Test_Foo.test_method_one: line 8, column 1\n" +
	"		Test_Foo2#test_method_one took 11.0\n" +
	"		  - System.AssertException: Assertion Failed\n" +
	"		  - Class.Test_Foo2.test_method_one: line 7, column 1\n" +
	"		Error: Visit https://mynamespace.my.salesforce.com/changemgmt/monitorDeploymentsDetails.apexp?asyncId=REDACTED for more information.\n" +
	"		3 methods, 2 failures\n" +
	"\n" +
	"	Running specified test classes\n" +
	"		$ force-dev-tool test --classNames 'Test_MockFoo Test_MockBar'\n" +
	"\n" +
	"	Running test classes matching a pattern (in src/package.xml)\n" +
	"		$ force-dev-tool package grep 'ApexClass/Test_Mock*' \\\n" +
	"		 | cut -d '/' -f 2 \\\n" +
	"		 | xargs -0 force-dev-tool test --classNames";

var printStartingMessage = function(remote) {
	console.log('Running Test execution to remote ' + chalk.cyan(remote.name));
};

var logToConsole = function(messages) {
	return console.log(messages.join('\n'));
};

var login = function(remote, onSuccess, onError) {
	return remote.connect(function(loginErr, conn) {
		if (loginErr) {
			return onError('Login failed for remote ' + remote.name + ': ' + loginErr);
		}
		return onSuccess(conn);
	});
};

var runTestsSynchronous = function(connection, classNames, verbose, callback) {
	var conn = connection;

	return conn.tooling.runTestsSynchronous(classNames, function(err, res) {
		if (err) {
			return callback(err);
		}

		var overview = formatting.formatOverview(res);
		var messages = [];

		if (verbose) {
			messages = messages.concat(formatting.formatSuccesses(res));
		}

		messages = messages.concat(formatting.formatFailures(res));

		logToConsole(messages);

		if (res['failures'].length > 0) {
			return callback(new Error(overview));
		}

		return callback(null, overview);
	});
};

var testClassNames = function(command, classNames, callback) {
	command.opts = command.opts ? command.opts : command.docopt();

	var config = new(require('../config'))();
	// see https://github.com/jsforce/jsforce/issues/493
	var apiVersion = command.opts['--apiVersion'] || '36.0'
	config.set('defaultApiVersion', apiVersion);

	var remote;
	try {
		remote = command.project.remotes.get(command.opts['<remote>']);
	} catch (err) {
		return callback(err);
	}

	printStartingMessage(remote);

	var verbose = command.opts['--verbose'] ? true : false
	var whenLoggedIn = function(conn) {
		return runTestsSynchronous(conn, classNames, verbose, callback);
	};
	var onLoginError = function(errMessage) {
		return callback(errMessage);
	};

	return login(remote, whenLoggedIn, onLoginError);
};

var printTestAllResults = function(res, verbose) {
	var deployDetails = res.details;
	var runTestResult = deployDetails.runTestResult;
	var messages = [];

	if (verbose) {
		messages = messages.concat(formatting.formatSuccesses(runTestResult));
	}

	messages = messages.concat(formatting.formatFailures(runTestResult));
	messages = messages.concat(formatting.formatComponentFailures(deployDetails));
	messages = messages.concat(formatting.formatCodeCoverageWarnings(runTestResult));

	return logToConsole(messages);
}

var deployEmptyCheckOnly = function(connection, archive, verbose, callback) {
	var conn = connection;
	var deployOpts = {
		rollbackOnError: true,
		checkOnly: true,
		testLevel: 'RunLocalTests'
	};
	var messages = [];

	conn.metadata.pollTimeout = config.pollTimeout;

	return conn.metadata.deploy(archive, deployOpts).complete({
		details: true
	}, function(err, res) {
		if (err) {
			return callback(err);
		}

		printTestAllResults(res, verbose);

		if (res.id) {
			messages.push('Visit ' + conn.instanceUrl + '/changemgmt/monitorDeploymentsDetails.apexp?asyncId=' + res.id + ' for more information.');
		}

		if (res.details && res.details.runTestResult) {
			messages.push(formatting.formatOverview(res.details.runTestResult));
		}

		if (res.status === 'Failed') {
			return callback(messages.join("\n"));
		}

		return callback(null, messages.join("\n"));
	});
};

var testAll = function(command, callback) {
	var remote;
	var verbose = command.opts['--verbose'] ? true : false

	try {
		remote = command.project.remotes.get(command.opts['<remote>']);
	} catch (err) {
		return callback(err);
	}

	command.archive = new Zip();
	var deployRoot = command.opts['-d'] ? path.resolve(command.opts['-d']) : command.project.storage.getSrcPath();
	var currentPackageXml = new Manifest();
	try {
		currentPackageXml = Manifest.fromPackageXml(CliUtils.readFileSafe(path.join(deployRoot, 'package.xml')));
		config.set('defaultApiVersion', currentPackageXml.apiVersion);
	} catch (err) {
		// ignore since running unit tests using an empty deployment does not require a package.xml
	}

	printStartingMessage(remote);

	var whenLoggedIn = function(conn) {
		return deployEmptyCheckOnly(conn, command.archive.stream(), verbose, callback);
	};

	var onLoginError = function(errMessage) {
		return callback(errMessage);
	};

	return login(remote, whenLoggedIn, onLoginError);
};

var SubCommand = module.exports = function(project) {
	Command.call(this, doc, project);
};

SubCommand.prototype = Object.create(Command.prototype);
SubCommand.prototype.constructor = SubCommand;

SubCommand.prototype.process = function(proc, callback) {
	var command = this;
	command.opts = command.opts ? command.opts : command.docopt();

	var optsClassNames = command.opts['--classNames'];
	// allow even newlines as separator
	var classNames = optsClassNames ? optsClassNames.split(/\s+/g) : [];
	// trim each item and remove empty items
	classNames = classNames.map(function(item) {
		return item.trim();
	}).filter(Boolean);

	if (classNames.length) {
		return testClassNames(command, classNames, callback);
	}
	return testAll(command, callback);
};
