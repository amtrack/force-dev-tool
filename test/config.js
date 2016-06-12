"use strict";

var assert = require("assert");
var Config = require('../lib/config');

describe('Config', function() {
	describe('#get(), set()', function() {
		it('should set and get config values', function() {
			var config = new Config();
			config.set('foo', 'bar');
			assert.deepEqual(config.get('foo'), 'bar');
			assert.deepEqual(config.get('nonExistentKey'), undefined);
		});
	});
});
