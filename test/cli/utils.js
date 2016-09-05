"use strict";

var assert = require("assert");
var path = require("path");
var CliUtils = require('../../lib/cli/utils');
var stream = require("stream");

describe('CliUtils', function() {
	describe('#readForceIgnore()', function() {
		it('should read a .forceignore file and return an array of ignore patterns', function() {
			var expected = ['labels/*', 'pages/*'];
			assert.deepEqual(CliUtils.readForceIgnore(path.resolve('./test/data/.forceignore')), expected);
		});
	});
	describe('#readFromStdin()', function() {
		it('should read from /dev/stdin', function(done) {
			var proc = {
				stdin: new stream.PassThrough()
			};
			proc.stdin.write("hello world");
			proc.stdin.end();
			CliUtils.readFromStdin(proc, function(err, input) {
				if (err) {
					return done(err);
				}
				assert.deepEqual(input, "hello world");
				done();
			})
		});
		it('should allow /dev/stdin to be empty', function(done) {
			var proc = {
				stdin: new stream.PassThrough()
			};
			proc.stdin.write("\n");
			proc.stdin.end();
			CliUtils.readFromStdin(proc, function(err, input) {
				if (err) {
					return done(err);
				}
				assert.deepEqual(input, "\n");
				done();
			})
		});
	});
});
