"use strict";

var assert = require("assert");
var EnvRemoteProvider = require("../../../lib/remotes/provider/env");
var Remote = require('../../../lib/remotes/remote');

describe('EnvRemoteProvider', function() {
	describe('#list()', function() {
		it('should return remotes defined in environment variables', function() {
			var provider = new EnvRemoteProvider({
				env: {
					'SFDC_USERNAME': 'default@example.com',
					'SFDC_PASSWORD': 'default',
					'SFDC_foo_USERNAME': 'foo@example.com',
					'SFDC_foo_PASSWORD': 'lowercase',
					'SFDC_foo_SERVER_URL': 'https://login.salesforce.com',
					'SFDC_FOO_USERNAME': 'foo@example.com',
					'SFDC_FOO_PASSWORD': 'foo',
					'SFDC_FOO_SERVER_URL': 'https://login.salesforce.com',
					'SFDC_INVALID_USERNAME': 'invalid@example.com',
					'SFDC_INVALID_SERVER_URL': 'https://login.salesforce.com'
				}
			});
			var expected = [
				new Remote('env', 'default@example.com', 'default', {
					default: true
				}),
				new Remote('foo', 'foo@example.com', 'lowercase', {
					serverUrl: 'https://login.salesforce.com'
				}),
				new Remote('FOO', 'foo@example.com', 'foo', {
					serverUrl: 'https://login.salesforce.com'
				})
			];
			assert.deepEqual(provider.list(), expected);
		});
	});
});
