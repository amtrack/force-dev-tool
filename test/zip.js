"use strict";

var assert = require("assert");
var Zip = require('../lib/zip');
var Unzip = require('../lib/unzip');
var path = require('path');
var fs = require('fs');
var tmp = require("tmp");

describe('UnZip Zip', function() {
	var tmpDir = tmp.dirSync();
	describe('using temp dir: ' + tmpDir.name, function() {
		it('should unzip and zip', function(done) {
			var testZipPath = path.join(__dirname, 'data', 'unpackaged', 'layout-with-umlauts.zip');
			var unzipDir = path.join(tmpDir.name, 'unzipped');
			new Unzip(testZipPath).target(unzipDir, function(err) {
				if (err) {
					return done(err);
				}
				var unzipFiles = fs.readdirSync(unzipDir);
				assert.deepEqual(unzipFiles, ['layouts', 'package.xml']);
				var unzipLayoutFiles = fs.readdirSync(path.join(unzipDir, 'layouts'));
				assert.deepEqual(path.join(unzipLayoutFiles[0]).normalize(), 'Account-Umlautsäöü And Spaces.layout');
				var zipPath = path.join(tmpDir.name, 'zipped.zip');
				var output = fs.createWriteStream(zipPath);
				output.on('close', function() {
					var zippedStat = fs.statSync(zipPath);
					assert(zippedStat.isFile());
					return done();
				});
				new Zip().directory(unzipDir).stream().pipe(output);
			});
		});
	});
});
