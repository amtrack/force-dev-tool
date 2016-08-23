'use strict';

var chalk = require('chalk');
var _ = require('underscore');
var utils = require('./utils');

var formatSuccessLine = function(success) {
	return success.name + '#' + success.methodName + ' took ' + success.time
};

var formatSuccesses = function(testResult) {
	var successes = utils.ensureArray(testResult.successes);

	if (!successes.length) {
		return [];
	}

	return ['Successes:'].concat(_.map(
		successes, _.compose(chalk.green, formatSuccessLine)
	));
};

var formatFailure = function(failure) {
	return [
		chalk.red(failure['name'] + '#' + failure['methodName'] + ' took ' + failure['time']),
		'  - ' + failure['message'],
		'  - ' + failure['stackTrace']
	];
};

var formatFailures = function(testResult) {
	var failures = utils.ensureArray(testResult.failures);

	if (!failures.length) {
		return [];
	}

	return _.flatten(['Failures:'].concat(_.map(failures, function(failure) {
		return formatFailure(failure);
	})));
};

var formatOverview = function(testResult) {
	var successCount = utils.ensureArray(testResult.successes).length;
	var failureCount = utils.ensureArray(testResult.failures).length;
	var testCount = successCount + failureCount;
	var testCountText = testCount + ' method' + (testCount === 1 ? '' : 's');
	var failureCountText = failureCount + ' failure' + (failureCount === 1 ? '' : 's');

	return [testCountText + ', ' + failureCountText];
};

var formatCodeCoverageWarnings = function(testResult) {
	var warnings = utils.ensureArray(testResult.codeCoverageWarnings);

	if (!warnings.length) {
		return [];
	}

	return ['Code Coverage Warnings:'].concat(warnings.map(function(warning) {
		var name = warning.name;
		var prefix = '';

		if (_.isString(name)) {
			prefix = name + ': ';
		}

		return prefix + warning.message;
	}));
};

var formatComponentFailures = function(deployDetails) {
	var componentFailures = utils.ensureArray(deployDetails.componentFailures);

	if (!componentFailures.length) {
		return [];
	}

	return ['Component Failures:'].concat(componentFailures.map(function(f) {
		if (f.fullName && f.componentType) {
			return ' - ' + f.problemType + " in " + f.componentType + " component '" + f.fullName + "': " + f.problem;
		} else {
			return ' - ' + f.problemType + " in file '" + f.fileName + "': " + f.problem;
		}
	}));
};

module.exports = {
	formatSuccesses: formatSuccesses,
	formatFailures: formatFailures,
	formatOverview: formatOverview,
	formatCodeCoverageWarnings: formatCodeCoverageWarnings,
	formatComponentFailures: formatComponentFailures
};
