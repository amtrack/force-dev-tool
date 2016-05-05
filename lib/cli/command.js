"use strict";

var docopt = require('docopt').docopt;

/**
 * Represents a sub command for the cli.
 * @constructor
 * @param {string} doc - docopt documentation.
 * @param {string} opts - docopt options.
 */
var Command = module.exports = function(doc, project) {
	this.doc = doc || "TODO";
	this.project = project;
};

/**
 * Prints the help
 */
Command.prototype.help = function() {
	console.log(this.doc);
};

Command.prototype.docopt = function(docoptOptions) {
	docoptOptions = docoptOptions || {};
	return docopt(this.doc, docoptOptions);
};

Command.prototype.complete = function(tabtab, data) {
	return tabtab.log([], data, '');
};

/**
 * Processes the command
 * given a proc object with `stdin`, `stdout`, `stderr`
 */
Command.prototype.process = function(proc, callback) {
	this.opts = this.docopt();
	callback("not implemented");
};
