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
	describe('#handleXargsNull()', function() {
		context('when passed an Array with newlines', function() {
			it('returns all items', function() {
				var input = ['foo\nbar baz\nbazn'];
				assert.deepEqual(CliUtils.handleXargsNull(input), ['foo', 'bar baz', 'bazn']);
			});
		});
		context('when passed an Array without newlines', function() {
			it('returns the same items', function() {
				var input = ['foo', 'bar', 'baz'];
				assert.deepEqual(CliUtils.handleXargsNull(input), ['foo', 'bar', 'baz']);
			});
		});
		context('when Array contains additional whitespace', function() {
			it('returns trimmed items', function() {
				var input = ['foo ', ' bar', '\nbaz', 'bazn\n', '\n'];
				assert.deepEqual(CliUtils.handleXargsNull(input), ['foo', 'bar', 'baz', 'bazn']);
			});
		});
	});
});
