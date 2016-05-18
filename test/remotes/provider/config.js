"use strict";

var assert = require("assert");
var ConfigRemoteProvider = require("../../../lib/remotes/provider/config");
var tmp = require('tmp');
var path = require('path');

describe('ConfigRemoteProvider', function() {
	describe('#Constructor', function() {
		it('should initialize a new provider', function() {
			var tmpobj = tmp.dirSync();
			assert.deepEqual(new ConfigRemoteProvider({
				path: path.join(tmpobj.name, 'foo.json')
			}).config, {
				path: path.join(tmpobj.name, 'foo.json')
			});
		});
	});
	describe('#add()', function() {
		it('should add a remote', function(done) {
			var tmpobj = tmp.dirSync();
			var r = {
				name: 'foo'
			};
			var configRemoteProvider = new ConfigRemoteProvider({
				path: path.join(tmpobj.name, 'foo.json')
			});
			configRemoteProvider.add(r, function(err) {
				assert(!err);
				done();
			});
		});
		it('should add a default remote', function(done) {
			var tmpobj = tmp.dirSync();
			var r = {
				name: 'foo',
				default: true
			};
			var configRemoteProvider = new ConfigRemoteProvider({
				path: path.join(tmpobj.name, 'foo.json')
			});
			configRemoteProvider.add(r, function(err) {
				assert(!err);
				done();
			});
		});
		it('should add a remote when config does not exist yet', function(done) {
			var tmpobj = tmp.dirSync();
			var r = {
				name: 'foo'
			};
			var configRemoteProvider = new ConfigRemoteProvider({
				path: path.join(tmpobj.name, 'subdir', 'foo.json')
			});
			configRemoteProvider.add(r, function(err) {
				assert(!err);
				done();
			});
		});
	});
	describe('#setDefault()', function() {
		it('should set an existing remote as default', function(done) {
			var tmpobj = tmp.dirSync();
			var r = {
				name: 'foo'
			};
			var r2 = {
				name: 'foo2'
			};
			var configRemoteProvider = new ConfigRemoteProvider({
				path: path.join(tmpobj.name, 'foo.json')
			});
			configRemoteProvider.add(r, function(addErr) {
				assert(!addErr);
				configRemoteProvider.add(r2, function(add2Err) {
					assert(!add2Err);
					configRemoteProvider.setDefault('foo2', function(setDefaultErr) {
						assert(!setDefaultErr);
						assert.deepEqual(configRemoteProvider.getDefault().name, 'foo2');
						done();
					});
				});
			});
		});
		it('should fail to set an non existing remote as default', function(done) {
			var tmpobj = tmp.dirSync();
			var r = {
				name: 'foo',
				default: true
			};
			var configRemoteProvider = new ConfigRemoteProvider({
				path: path.join(tmpobj.name, 'foo.json')
			});
			configRemoteProvider.add(r, function(addErr) {
				assert(!addErr);
				configRemoteProvider.setDefault('foo2', function(setDefaultErr) {
					assert.deepEqual(setDefaultErr, "Could not determine remote `foo2`");
					assert.deepEqual(configRemoteProvider.getDefault().name, 'foo');
					done();
				});
			});
		});
	});
	describe('#remove()', function() {
		it('configRemoteProvider', function(done) {
			var tmpobj = tmp.dirSync();
			var configRemoteProvider = new ConfigRemoteProvider({
				path: path.join(tmpobj.name, 'foo.json')
			});
			configRemoteProvider.remove('foo', function(err) {
				assert(!err);
				done();
			});
		});
	});
	describe('#get()', function() {
		it('should get a remote', function() {
			var tmpobj = tmp.dirSync();
			var configRemoteProvider = new ConfigRemoteProvider({
				path: path.join(tmpobj.name, 'foo.json')
			});
			var r = {
				name: 'foo'
			};
			configRemoteProvider.add(r, function() {
				assert.deepEqual(configRemoteProvider.get('foo').name, 'foo');
			});
		});
		it('should return default remote when no name given', function(done) {
			var tmpobj = tmp.dirSync();
			var configRemoteProvider = new ConfigRemoteProvider({
				path: path.join(tmpobj.name, 'foo.json')
			});
			configRemoteProvider.add({
					name: 'foo',
					default: true
				},
				function(addErr) {
					assert(!addErr);
					assert.deepEqual(configRemoteProvider.get().name, 'foo');
					done();
				}
			);
		});
		it('should fail when remote does not exist', function() {
			var tmpobj = tmp.dirSync();
			var configRemoteProvider = new ConfigRemoteProvider({
				path: path.join(tmpobj.name, 'foo.json')
			});
			assert.throws(function() {
					configRemoteProvider.get('nonexistent remote');
				},
				/Could not determine remote/
			);
		});
	});
});
