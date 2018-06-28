"use strict";

var Command = require('./command');
var path = require('path');
var fs = require('fs-extra');
var stream = require('stream');

var doc = "Usage:\n" +
	"	force-dev-tool bulk export <SOQL> [options] [<remote>]\n" +
	"	force-dev-tool bulk insert <sObjectName> [options] [<remote>]\n" +
	"	force-dev-tool bulk update <sObjectName> [options] [<remote>]\n" +
	"	force-dev-tool bulk upsert <sObjectName> --extIdField=<extIdField> [options] [<remote>]\n" +
	"	force-dev-tool bulk delete <sObjectName> [options] [<remote>]\n" +
	"	force-dev-tool bulk hardDelete <sObjectName> [options] [<remote>]\n" +
	"\n" +
	"Import/export data in CSV format using the bulk API.\n" +
	"\n" +
	"Examples:\n" +
	"	Exporting data\n" +
	"		$ force-dev-tool bulk export \"SELECT Id, Name FROM Account LIMIT 1\"\n" +
	'		"Id","Name"\n' +
	'		"001200000183ZCFAA2","GenePoint"\n' +
	"\n" +
	"		$ force-dev-tool bulk export \"SELECT Id, Name FROM Account\" --out Accounts.csv\n" +
	"\n" +
	"	Updating data\n" +
	"		$ force-dev-tool bulk update Account --in Accounts.csv --out Accounts-update-results.csv\n" +
	"\n" +
	"Options:\n" +
	"	--in=<in>               Path to source file.\n" +
	"	--out=<out>             Path to destination file.\n" +
	"	--pollInterval=<sec>    Polling interval in seconds [default: 5].\n" +
	"	--pollTimeout=<sec>     Polling timeout in seconds [default: 600].";

var SubCommand = module.exports = function(project) {
	Command.call(this, doc, project);
};

SubCommand.prototype = Object.create(Command.prototype);
SubCommand.prototype.constructor = SubCommand;

SubCommand.prototype.process = function(proc, callback) {
	var self = this;
	self.opts = self.opts ? self.opts : self.docopt();
	self.inFile = self.opts['--in'] ? path.resolve(self.opts['--in']) : null;
	self.outFile = self.opts['--out'] ? path.resolve(self.opts['--out']) : null;
	self.extIdField = self.opts['--extIdField'];
	self.sObjectName = self.opts['<sObjectName>'];
	var pollInterval = parseInt(self.opts['--pollInterval']) * 1000;
	var pollTimeout = parseInt(self.opts['--pollTimeout']) * 1000;

	self.action;
	if (self.opts.export) {
		self.action = 'query';
	} else if (self.opts.insert) {
		self.action = 'insert';
	} else if (self.opts.update) {
		self.action = 'update';
	} else if (self.opts.upsert) {
		self.action = 'upsert';
	} else if (self.opts.delete) {
		self.action = 'delete';
	} else if (self.opts.hardDelete) {
		self.action = 'hardDelete';
	} else {
		return callback(new Error('Unsupported action: ' + self.action));
	}

	var inputStream;
	if (self.inFile) {
		// 1. read from file
		inputStream = fs.createReadStream(self.inFile);
	} else {
		// 2. try to read from stdin
		inputStream = proc.stdin;
		inputStream.setEncoding('utf8');
	}

	var remote;
	try {
		remote = self.project.remotes.get(self.opts['<remote>']);
	} catch (err) {
		return callback(err);
	}

	var outputStream = proc.stdout;
	if (self.outFile) {
		outputStream = fs.createWriteStream(self.outFile);
	}
	remote.connect(function(loginErr, conn) {
		if (loginErr) {
			return callback(loginErr);
		}
		conn.bulk.pollInterval = pollInterval;
		conn.bulk.pollTimeout = pollTimeout;
		if (self.action === 'query') {
			if (self.opts['<SOQL>'] !== '-') {
				inputStream = new stream.Readable({
					encoding: 'utf8'
				});
			}
			var soql = '';
			inputStream.on('data', function(data) {
				soql += data;
			});
			inputStream.on('end', function() {
				var q = conn.bulk.query(soql.trim());
				q.on('error', function(queryError) {
					return callback(queryError);
				})
				var s = q.stream();
				s.on('error', function(streamError) {
					return callback(streamError);
				})
				s.pipe(outputStream);
			});
			if (self.opts['<SOQL>'] !== '-') {
				inputStream.push(self.opts['<SOQL>']);
				inputStream.push(null);
			}
		} else {
			var loadOptions = {};
			if (self.extIdField) {
				loadOptions.extIdField = self.extIdField;
			}
			conn.bulk.load(self.sObjectName, self.action, loadOptions, inputStream, function(loadErr, response) {
				if (loadErr) {
					return callback(loadErr);
				}
				// TODO: combine all batch streams like in Bulk.prototype.query and return csv stream
				outputStream.write(["Id", "Success", "Errors"].join(",") + "\n");
				response.forEach(function(item) {
					outputStream.write([item.id, item.success, item.errors.join(";")].join(",") + "\n");
				});
			});
		}
	});
};
