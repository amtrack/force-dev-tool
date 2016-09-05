"use strict";

var chalk = require("chalk");
var fs = require("fs");
var path = require("path");
var mkdirp = require("mkdirp");
var _ = require("underscore");

module.exports.readFileSafe = function(filename) {
	if (fs.existsSync(filename)) {
		try {
			return fs.readFileSync(filename).toString();
		} catch (err) {
			return console.error(chalk.red("Could not read file `" + path.relative(process.cwd(), filename) + "`."));
		}
	}
	return "";
};

module.exports.readFileJsonSafe = function(filename) {
	if (fs.existsSync(filename)) {
		try {
			return JSON.parse(fs.readFileSync(filename).toString());
		} catch (err) {
			console.error(chalk.red("Could not parse `" + path.relative(process.cwd(), filename) + "`."));
			return [];
		}
	}
	return [];
};

module.exports.readJsonFile = function(filepath) {
	if (fs.existsSync(filepath)) {
		try {
			return JSON.parse(fs.readFileSync(filepath).toString());
		} catch (err) {
			console.error(chalk.red("Found a .json file, but it's invalid JSON."));
			return [];
		}
	}
	return [];
};

module.exports.readForceIgnore = function(forceIgnorePath) {
	var commentPattern = new RegExp('^#');
	if (fs.existsSync(forceIgnorePath)) {
		var lines = _.compact(fs.readFileSync(forceIgnorePath).toString().split(/\r?\n/));
		return lines.filter(function(item) {
			return !commentPattern.test(item);
		});
	}
	return [];
};


module.exports.readPackageXml = function(packageXmlPath) {
	if (fs.existsSync(packageXmlPath)) {
		try {
			return fs.readFileSync(packageXmlPath).toString();
		} catch (err) {
			return console.error(chalk.red("Found a package.xml file, but could not read it."));
		}
	}
	return "";
};

module.exports.writePackageXml = function(manifest, packageXmlPath, destructive, callback) {
	mkdirp(path.dirname(packageXmlPath), function(mkdirErr) {
		if (mkdirErr) {
			return callback(mkdirErr);
		} else {
			fs.writeFile(packageXmlPath, manifest.toPackageXml(destructive), function(err) {
				if (err) {
					return callback(err);
				} else {
					return callback(null, "Created " + path.relative(process.cwd(), packageXmlPath));
				}
			});
		}
	});
};

module.exports.readFromStdin = function(proc, callback) {
	var input = "";
	proc.stdin.setEncoding('utf8');
	proc.stdin.on('readable', function() {
		var read = proc.stdin.read();
		if (read === null) {
			proc.stdin.end();
		} else {
			return callback(null, input);
		}
	});
	proc.stdin.on('data', function(data) {
		input += data;
	});
	proc.stdin.on('close', function() {
		return callback(null, input);
	});
	proc.stdin.resume();
};
