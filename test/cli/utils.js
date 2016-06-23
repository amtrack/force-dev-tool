"use strict";

var assert = require("assert");
var path = require("path");
var CliUtils = require('../../lib/cli/utils');

describe('CliUtils', function() {
	describe('#readForceIgnore()', function() {
		it('should read a .forceignore file and return an array of ignore patterns', function() {
			var expected = ['labels/*', 'pages/*'];
			assert.deepEqual(CliUtils.readForceIgnore(path.resolve('./test/data/.forceignore')), expected);
		});
	});
});
