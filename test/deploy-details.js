'use strict';

var assert = require('assert');
var deployDetails = require('../lib/deploy-details');

describe('deploy-details', function() {
	describe('.getOverallCodeCoverage', function() {
		var tests = [{
				codeCoverage: [{
					numLocations: "1",
					numLocationsNotCovered: "0"
				}, {
					numLocations: "1",
					numLocationsNotCovered: "0"
				}],
				expected: 1,
				message: "should sum up multiple coverages"
			},
			{
				codeCoverage: [{
					numLocations: "1",
					numLocationsNotCovered: "0"
				}, {
					numLocations: "",
					numLocationsNotCovered: ""
				}],
				expected: 1,
				message: "should ignore empty classes"
			},
			{
				codeCoverage: [{
					numLocations: "15",
					numLocationsNotCovered: "0"
				}, {
					numLocations: "5",
					numLocationsNotCovered: "5"
				}],
				expected: 0.75,
				message: "should return decimals"
			},
			{
				codeCoverage: {
					numLocations: "1",
					numLocationsNotCovered: "0"
				},
				expected: 1,
				message: "should handle a single codeCoverage item instead of array"
			},
			{
				codeCoverage: undefined,
				expected: undefined,
				message: "should handle absence of codeCoverage"
			}
		];
		tests.forEach(function(test) {
			it(test.message, function() {
				assert.deepEqual(deployDetails.getOverallCodeCoverage({
					runTestResult: {
						codeCoverage: test.codeCoverage
					}
				}), test.expected);
			});
		});
	});
	describe('.formatOverallCodeCoverage', function() {
		it("should print a coverage", function() {
			assert.deepEqual(deployDetails.formatOverallCodeCoverage(0), "Overall Code Coverage: 0%");
		});
		it("should print an undefined coverage", function() {
			assert.deepEqual(deployDetails.formatOverallCodeCoverage(undefined), "Overall Code Coverage: undefined");
		});
	});
});
