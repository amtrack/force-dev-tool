"use strict";

var assert = require("assert");
var Provider = require("../../lib/remotes/provider");

describe('Dummy Provider', function() {
	describe('#Constructor', function() {
		it('should initialize a new provider', function() {
			assert.deepEqual(new Provider(), {
				config: undefined,
				remotes: []
			});
		});
	});
	describe('#add()', function() {
		it('dummy', function(done) {
			var dummy = new Provider();
			dummy.add({
				name: 'foo'
			}, function(err) {
				assert.deepEqual(err, undefined);
				done();
			});
		});
	});
	describe('#remove()', function() {
		it('should remove an existing remote', function(done) {
			var dummy = new Provider();
			dummy.add({
				name: 'foo'
			}, function(err) {
				assert.deepEqual(err, undefined);
				dummy.remove('foo', function(removeErr) {
					assert.deepEqual(removeErr, undefined);
					done();
				});
			});
		});
		it('should not fail on removing a non existing remote', function(done) {
			var dummy = new Provider();
			dummy.remove('foo', function(err) {
				assert.deepEqual(err, undefined);
				done();
			});
		});
	});
	describe('#get()', function() {
		it('dummy', function(done) {
			var dummy = new Provider();
			dummy.add({
					name: 'foo'
				},
				function() {
					assert.deepEqual(dummy.get('foo'), {
						name: 'foo'
					});
					done();
				}
			);
		});
		it('should return default remote when no name given', function(done) {
			var dummy = new Provider();
			dummy.add({
					name: 'foo',
					default: true
				},
				function() {
					assert.deepEqual(dummy.get().name, 'foo');
					done();
				}
			);
		});
		it('should fail when remote does not exist', function() {
			var dummy = new Provider();
			assert.throws(function() {
					dummy.get('nonexistent remote');
				},
				/Could not determine remote/
			);
		});
	});
	describe('#getDefault()', function() {
		it('should return the default remote', function(done) {
			var dummy = new Provider();
			dummy.add({
				name: 'bar'
			}, function() {
				dummy.add({
					name: 'foo',
					default: true
				}, function() {
					assert.deepEqual(dummy.getDefault(), {
						name: 'foo',
						default: true
					});
					done();
				});
			});
		});
		it('should fail when no default remote exists', function() {
			var dummy = new Provider();
			assert.throws(function() {
					dummy.getDefault();
				},
				/Could not determine default remote/
			);
		});
	});
	describe('#setDefault()', function() {
		it('should set and get the default remote', function(done) {
			var dummy = new Provider();
			dummy.add({
				name: 'bar'
			}, function() {
				dummy.setDefault('bar', function() {
					assert.deepEqual(dummy.getDefault(), {
						name: 'bar',
						default: true
					});
					done();
				});
			});
		});
	});
});
