"use strict";

var assert = require("assert");
var Remote = require("../../lib/remotes/remote");
var sinon = require("sinon");
var jsforce = require("jsforce");

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
	describe('#connect()', function() {
		afterEach(function() {
			jsforce.Connection.prototype.login.restore();
		});
		it('should return a connection for a successful login', function(done) {
			// login callback with err, userInfo
			sinon.stub(jsforce.Connection.prototype, 'login').yieldsAsync(
				null, {
					id: "asdf",
					organizationId: "asdf",
					url: "https://test.salesforce.com"
				});
			var r = new Remote('default', 'default@example.com', 'foo');
			r.connect(function(connErr, conn) {
				assert(!connErr);
				assert.deepEqual(conn.loginUrl, "https://test.salesforce.com");
				done();
			});
		});
		it('should return an error for a failed login', function(done) {
			// login callback with err, userInfo
			sinon.stub(jsforce.Connection.prototype, 'login').yieldsAsync(
				new Error("INVALID_LOGIN: Invalid username, password, security token; or user locked out."),
				null
			);
			var r = new Remote('default', 'default@example.com', 'fooInvalid');
			r.connect(function(connErr, conn) {
				assert.deepEqual(connErr, /INVALID_LOGIN/);
				assert(!conn);
				done();
			});
		});
	});
});
