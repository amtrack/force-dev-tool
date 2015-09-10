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
	'SFDC_FOO_SERVER_URL': 'https://login.salesforce.com',
	'SFDC_INVALID_USERNAME': 'invalid@example.com',
	'SFDC_INVALID_SERVER_URL': 'https://login.salesforce.com'
};

var tmpobj = tmp.dirSync();
var multiProvider = new MultiRemoteProvider({
	providers: [
		new ConfigRemoteProvider({path: path.join(tmpobj.name, 'foo.json')}),
		new EnvRemoteProvider({env: env})
	]
});

describe('Dummy ConfigRemoteProvider', function(){
	describe('#Constructor', function(){
		it('should initialize a new provider', function(){
			assert.deepEqual(multiProvider.config.providers.length, 2);
		});
	});
	describe('#list()', function(){
		it('multiProvider', function(){
			assert.deepEqual(multiProvider.list().length, 3);
		});
	});
	describe('#add()', function(){
		it('multiProvider', function(done){
			var r = {name: 'foo2'};
			multiProvider.add(r, function(err) {
				assert.deepEqual(err, undefined);
				done();
			});
		});
	});
	describe('#get()', function(){
		it('multiProvider', function(){
			assert.deepEqual(multiProvider.get('foo2').name, 'foo2');
		});
	});
	describe('#remove()', function(){
		it('multiProvider', function(done){
			multiProvider.remove('foo2', function(err) {
				assert.deepEqual(err, undefined);
				done();
			});
		});
	});
});
