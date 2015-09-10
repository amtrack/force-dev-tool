"use strict";

var assert = require("assert");
var Provider = require("../../lib/remotes/provider");

describe('Dummy Provider', function(){
	describe('#Constructor', function(){
		it('should initialize a new provider', function(){
			assert.deepEqual(new Provider(), {config: undefined, remotes: []});
		});
	});
	describe('#add()', function(){
		it('dummy', function(done){
			var dummy = new Provider();
			dummy.add({name: 'foo'}, function(err) {
				assert.deepEqual(err, undefined);
				done();
			});
		});
	});
	describe('#remove()', function(){
		it('dummy', function(done){
			var dummy = new Provider();
			dummy.remove('foo', function(err) {
				assert.deepEqual(err, undefined);
				done();
			});
		});
	});
	describe('#get()', function(){
		it('dummy', function(done){
			var dummy = new Provider();
			dummy.add({name: 'foo'},
				function(){
					assert.deepEqual(dummy.get('foo'), {name: 'foo'});
					done();
				});
		});
	});
	describe('#getDefault()', function(){
		it('dummy', function(done){
			var dummy = new Provider();
			dummy.add({name: 'bar'}, function(){
				dummy.add({name: 'foo', default: true}, function(){
					assert.deepEqual(dummy.getDefault(), {name: 'foo', default: true});
					done();
				});
			});
		});
	});
});
