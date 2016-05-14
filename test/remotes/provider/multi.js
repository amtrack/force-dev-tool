"use strict";

var assert = require("assert");
var MultiRemoteProvider = require("../../../lib/remotes/provider/multi");
var ConfigRemoteProvider = require("../../../lib/remotes/provider/config");
var EnvRemoteProvider = require("../../../lib/remotes/provider/env");
var tmp = require('tmp');
var path = require('path');

var env = {
	'SFDC_USERNAME': 'default@example.com',
	'SFDC_PASSWORD': 'default',
	'SFDC_FOO_USERNAME': 'foo@example.com',
	'SFDC_FOO_PASSWORD': 'foo',
	'SFDC_FOO_SERVER_URL': 'https://login.salesforce.com'
};

describe('MultiRemoteProvider', function() {
	describe('#Constructor', function() {
		var tmpobj = tmp.dirSync();
		var multiProvider = new MultiRemoteProvider({
			providers: [
				new ConfigRemoteProvider({
					path: path.join(tmpobj.name, 'foo.json')
				}),
				new EnvRemoteProvider({
					env: env
				})
			]
		});
		it('should initialize a new provider', function() {
			assert.deepEqual(multiProvider.config.providers.length, 2);
		});
	});
	describe('#add()', function() {
		var tmpobj = tmp.dirSync();
		var multiProvider = new MultiRemoteProvider({
			providers: [
				new ConfigRemoteProvider({
					path: path.join(tmpobj.name, 'foo.json')
				}),
				new EnvRemoteProvider({
					env: env
				})
			]
		});
		it('multiProvider', function(done) {
			var r = {
				name: 'foo'
			};
			multiProvider.add(r, function(err) {
				assert.deepEqual(err, undefined);
				assert.deepEqual(multiProvider.list().length, 3);
				done();
			});
		});
	});
	describe('#setDefault()', function() {
		var tmpobj = tmp.dirSync();
		var envWithoutDefault = {
			'SFDC_FOO_USERNAME': 'foo@example.com',
			'SFDC_FOO_PASSWORD': 'foo',
			'SFDC_FOO_SERVER_URL': 'https://login.salesforce.com'
		};
		var multiProvider = new MultiRemoteProvider({
			providers: [
				new ConfigRemoteProvider({
					path: path.join(tmpobj.name, 'foo.json')
				}),
				new EnvRemoteProvider({
					env: envWithoutDefault
				})
			]
		});
		it('should set a remote as default', function(done) {
			var r = {
				name: 'foo'
			};
			multiProvider.add(r, function(addErr) {
				assert.deepEqual(addErr, undefined);
				multiProvider.setDefault('foo', function(err) {
					assert.deepEqual(err, undefined);
					assert.deepEqual(multiProvider.getDefault().name, 'foo');
					done();
				});
			});
		});
	});
	describe('#get()', function() {
		var tmpobj = tmp.dirSync();
		var multiProvider = new MultiRemoteProvider({
			providers: [
				new ConfigRemoteProvider({
					path: path.join(tmpobj.name, 'foo.json')
				}),
				new EnvRemoteProvider({
					env: env
				})
			]
		});
		it('multiProvider', function() {
			assert.deepEqual(multiProvider.get('FOO').username, 'foo@example.com');
		});
	});
	describe('#remove()', function() {
		var tmpobj = tmp.dirSync();
		var multiProvider = new MultiRemoteProvider({
			providers: [
				new ConfigRemoteProvider({
					path: path.join(tmpobj.name, 'foo.json')
				}),
				new EnvRemoteProvider({
					env: env
				})
			]
		});
		it('multiProvider', function(done) {
			var r = {
				name: 'foo'
			};
			multiProvider.add(r, function(addErr) {
				assert.deepEqual(addErr, undefined);
				multiProvider.remove('foo', function(err) {
					assert.deepEqual(err, undefined);
					assert.deepEqual(multiProvider.list().length, 2);
					done();
				});
			});
		});
	});
});
