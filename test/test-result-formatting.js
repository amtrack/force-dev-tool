'use strict';

var assert = require('assert');
var chalk = require('chalk');

var formatting = require('../lib/test-result-formatting');
var res = require('./data/run-tests-synchronous').response;

describe('test-result-formatting', function() {
	describe('.formatSuccesses', function() {
		it('formats successful test results', function() {
			assert.deepEqual(
				formatting.formatSuccesses(res), [
					'Successes:',
					chalk.green('Test_OpportunityController#isSoFine took 4661'),
					chalk.green('Test_QuoteController#isSoCool took 717')
				]
			);
		});

		it('can handle test results with a successes Object', function() {
			var testResponse = {
				successes: res.successes[0]
			};
			assert.deepEqual(
				formatting.formatSuccesses(testResponse), [
					'Successes:',
					chalk.green('Test_OpportunityController#isSoFine took 4661')
				]
			);
		});

		it('can handle test results w/o successes', function() {
			assert.deepEqual(formatting.formatSuccesses({}), []);
		});
	});

	describe('.formatFailures', function() {
		it('formats failed test results', function() {
			assert.deepEqual(
				formatting.formatFailures(res), [
					'Failures:',
					chalk.red('Test_QuoteController#CreateAndSendQuoteTest took 4279'),
					'  - System.NullPointerException: Attempt to de-reference a null object',
					'  - Class.Test_QuoteController: line 76, column 1',
					chalk.red('Test_QuoteController#getCurrentUserName took 1518'),
					'  - System.NullPointerException: Attempt to de-reference a null object',
					'  - Class.Test_QuoteController: line 76, column 1',
					chalk.red('Test_QuoteController#getQuoteLineItemTest took 1597'),
					'  - System.NullPointerException: Attempt to de-reference a null object',
					'  - Class.Test_QuoteController: line 76, column 1'
				]
			);

			it('can handle test results with a failures Object', function() {
				var testResponse = {
					failures: res.failures[0]
				};
				assert.deepEqual(
					formatting.formatFailures(testResponse), [
						'Failures:',
						chalk.red('Test_QuoteController#CreateAndSendQuoteTest took 4279'),
						'  - System.NullPointerException: Attempt to de-reference a null object',
						'  - Class.Test_QuoteController: line 76, column 1',
						chalk.red('Test_QuoteController#getCurrentUserName took 1518'),
						'  - System.NullPointerException: Attempt to de-reference a null object',
						'  - Class.Test_QuoteController: line 76, column 1',
						chalk.red('Test_QuoteController#getQuoteLineItemTest took 1597'),
						'  - System.NullPointerException: Attempt to de-reference a null object',
						'  - Class.Test_QuoteController: line 76, column 1'
					]
				);
			});

			it('can handle test results w/o failures', function() {
				assert.deepEqual(formatting.formatFailures({}), []);
			});
		});
	});

	describe('.formatOverview', function() {
		it('formats overview of test results', function() {
			assert.deepEqual(
				formatting.formatOverview(res), ["5 methods, 3 failures"]
			);
		});

		it('can handle test results with failures and successes Objects', function() {
			var testResponse = {
				failures: res.failures[0],
				successes: res.successes[0]
			};
			assert.deepEqual(
				formatting.formatOverview(testResponse), ["2 methods, 1 failure"]
			);
		});

		it('can handle test results w/o tests', function() {
			assert.deepEqual(
				formatting.formatOverview({}), ["0 methods, 0 failures"]
			);
		});
	});

	describe('.formatCodeCoverageWarnings', function() {
		context('when running some tests', function() {
			it('formats code coverage warnings of test result', function() {
				assert.deepEqual(
					formatting.formatCodeCoverageWarnings(res), [
						'Code Coverage Warnings:',
						'OpportunityController: Test coverage of selected Apex Class is 13%, at least 90% test coverage is required'
					]
				);
			});

			it('can handle test results with a codeCoverageWarnings Object', function() {
				var testResponse = {
					codeCoverageWarnings: res.codeCoverageWarnings[0]
				};
				assert.deepEqual(
					formatting.formatCodeCoverageWarnings(testResponse), [
						'Code Coverage Warnings:',
						'OpportunityController: Test coverage of selected Apex Class is 13%, at least 90% test coverage is required'
					]
				);
			});

			it('can handle test results w/o code coverage warnings', function() {
				assert.deepEqual(formatting.formatCodeCoverageWarnings({}), []);
			});
		});
	});
});
