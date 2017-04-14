"use strict";

var Command = require('./command');
var stream = require('stream');

var doc = "Usage:\n" +
	"	force-dev-tool query <SOQL> [options] [<remote>]\n" +
	"\n" +
	"Returns the result of a SOQL query as JSON.\n" +
	"\n" +
	"Options:\n" +
	"	--tooling            Use Tooling API.\n" +
	"\n" +
	"Examples:\n" +
	"	$ force-dev-tool query \"SELECT Id, Name FROM Account LIMIT 1\"\n" +
	'	[\n' +
	'	  {\n' +
	'	    "attributes": {\n' +
	'	      "type": "Account",\n' +
	'	      "url": "/services/data/v38.0/sobjects/Account/001200000183ZCFAA2"\n' +
	'	    },\n' +
	'	    "Id": "001200000183ZCFAA2",\n' +
	'	    "Name": "GenePoint"\n' +
	'	  }\n' +
	'	]\n' +
	"\n" +
	"	$ force-dev-tool query \"SELECT COUNT(Id) c FROM Account\"\n" +
	'	[\n' +
	'	  {\n' +
	'	    "attributes": {\n' +
	'	      "type": "AggregateResult"\n' +
	'	    },\n' +
	'	    "c": 15\n' +
	'	  }\n' +
	'	]';

var SubCommand = module.exports = function(project) {
	Command.call(this, doc, project);
};

SubCommand.prototype = Object.create(Command.prototype);
SubCommand.prototype.constructor = SubCommand;

SubCommand.prototype.process = function(proc, callback) {
	var self = this;
	self.opts = self.docopt();
	var remote;
	try {
		remote = self.project.remotes.get(self.opts['<remote>']);
	} catch (err) {
		return callback(err);
	}

	var inputStream = new stream.Readable({
		encoding: 'utf8'
	});
	if (self.opts['<SOQL>'] === '-') {
		inputStream = proc.stdin;
		inputStream.setEncoding('utf8');
	}
	var soql = '';
	inputStream.on('data', function(data) {
		soql += data;
	});
	inputStream.on('end', function() {
		remote.connect(function(loginErr, conn) {
			if (loginErr) {
				return callback(loginErr);
			}
			if (self.opts['--tooling']) {
				conn.tooling.query(soql.trim(), function(err, res) {
					if (err) {
						return callback(err);
					}
					console.log(JSON.stringify(res, null, 4));
					callback();
				});
			} else {
				conn.query(soql.trim(), function(err, res) {
					if (err) {
						return callback(err);
					}
					console.log(JSON.stringify(res, null, 4));
					callback();
				});
			}
		});
	});
	if (self.opts['<SOQL>'] !== '-') {
		inputStream.push(self.opts['<SOQL>']);
		inputStream.push(null);
	}
};
