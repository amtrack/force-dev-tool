"use strict";

var assert = require("assert");
var Remote = require("../../lib/remotes/remote");

describe('Remote', function() {
	describe('#getJSON()', function() {
		it('should return a JSON object with sane defaults', function() {
			assert.deepEqual(
				new Remote('default', 'default@example.com', 'foo').getJSON(), {
					username: 'default@example.com',
					password: 'foo',
					serverUrl: 'https://test.salesforce.com'
				}
			);
		});
	});
});
