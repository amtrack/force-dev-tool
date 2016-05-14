"use strict";

var RemoteProvider = require('../provider');
var Remote = require('../remote');

var EnvRemoteProvider = module.exports = function(config) {
	var self = this;
	RemoteProvider.call(self, config);
	self.readOnly = true;
};

EnvRemoteProvider.prototype = Object.create(RemoteProvider.prototype);
EnvRemoteProvider.prototype.constructor = EnvRemoteProvider;

EnvRemoteProvider.prototype.list = function() {
	var self = this;
	var envPattern = new RegExp('^SFDC(.*)(USERNAME|PASSWORD|SERVER_URL)$');
	var remoteCandidates = {};
	Object.keys(self.config.env).forEach(function(item) {
		var match = envPattern.exec(item);
		if (match !== null && match[1] && match[2]) {
			var key = match[0];
			var name = match[1].replace(/^_/, '').replace(/_$/, '');
			if (name === '') {
				name = 'env';
			}
			var suffix = match[2];
			if (!remoteCandidates[name]) {
				remoteCandidates[name] = {
					name: name
				};
				if (name === 'env') {
					remoteCandidates[name].default = true;
				}
			}
			switch (suffix) {
				case 'USERNAME':
					remoteCandidates[name].username = self.config.env[key];
					break;
				case 'PASSWORD':
					remoteCandidates[name].password = self.config.env[key];
					break;
				case 'SERVER_URL':
					remoteCandidates[name].serverUrl = self.config.env[key];
					break;
			}
		}
	});
	var remotes = [];
	Object.keys(remoteCandidates).forEach(function(remoteCandidateName) {
		var remoteCandidate = remoteCandidates[remoteCandidateName];
		if (remoteCandidate.name !== undefined && remoteCandidate.username && remoteCandidate.password) {
			var opts = {};
			if (remoteCandidate.serverUrl) {
				opts.serverUrl = remoteCandidate.serverUrl;
			}
			if (remoteCandidate.default !== undefined) {
				opts.default = remoteCandidate.default;
			}
			remotes.push(new Remote(remoteCandidate.name, remoteCandidate.username, remoteCandidate.password, opts));
		}
	});
	return remotes;
};
