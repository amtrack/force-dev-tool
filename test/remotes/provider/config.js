"use strict";

var assert = require("assert");
var ConfigRemoteProvider = require("../../../lib/remotes/provider/config");
var tmp = require('tmp');
var path = require('path');

describe('Dummy ConfigRemoteProvider', function(){
	describe('#Constructor', function(){
		it('should initialize a new provider', function(){
			var tmpobj = tmp.dirSync();
			assert.deepEqual(new ConfigRemoteProvider({path: path.join(tmpobj.name, 'foo.json')}).config, {path: path.join(tmpobj.name, 'foo.json')});
		});
	});
	describe('#add()', function(){
		it('configRemoteProvider', function(done){
			var tmpobj = tmp.dirSync();
			var r = {name: 'foo'};
			var configRemoteProvider = new ConfigRemoteProvider({path: path.join(tmpobj.name, 'foo.json')});
			configRemoteProvider.add(r, function(err) {
				assert.deepEqual(err, undefined);
				done();
			});
		});
	});
	describe('#remove()', function(){
		it('configRemoteProvider', function(done){
			var tmpobj = tmp.dirSync();
			var configRemoteProvider = new ConfigRemoteProvider({path: path.join(tmpobj.name, 'foo.json')});
			configRemoteProvider.remove('foo', function(err) {
				assert.deepEqual(err, undefined);
				done();
			});
		});
	});
	describe('#get()', function(){
		it('configRemoteProvider', function(){
			var tmpobj = tmp.dirSync();
			var configRemoteProvider = new ConfigRemoteProvider({path: path.join(tmpobj.name, 'foo.json')});
			var r = {name: 'foo'};
			configRemoteProvider.add(r, function(){
				assert.deepEqual(configRemoteProvider.get('foo'), {name: 'foo'});
			});
		});
	});
});
