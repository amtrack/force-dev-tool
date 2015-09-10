"use strict";

var path = require('path');

exports.getMatches = function(string, regex, ind) {
	var index = ind || (ind = 1); // default to the first capturing group
	var matches = [];
	var match;
	while ((match = regex.exec(string)) !== null) {
		matches.push(match[index]);
	}
	return matches;
};

exports.getRelativePathToUnpackaged = function(filepath) {
	if (filepath === '/dev/null') {
		return filepath;
	}
	return path.relative(path.join(process.cwd(), 'src'), filepath);
};
