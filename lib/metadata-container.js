"use strict";

var Manifest = require('./manifest');
var _ = require('underscore');
var MetadataFile = require('./metadata-file');
var MetadataFileContainer = require('./metadata-file-container');
var MetadataFileFactory = require('./metadata-file-factory');
var Stream = require('stream');
var DescribeMetadataService = require('./describe-metadata-service');
var Utils = require('./utils');
var path = require('path');
var fs = require('fs');

/**
 * MetadataContainer contains many MetadataFiles
 * and additionally a manifest (package.xml) and optionally a destructive manifest (destructiveChanges.xml)
 */
var MetadataContainer = module.exports = function(opts) {
	var self = this;
	opts = opts || {};
	self.describeMetadataService = new DescribeMetadataService(opts.describeMetadataResult);
	self.vinyls = opts.vinyls || [];
	self.manifest = opts.manifest || new Manifest();
	self.post = !!opts.post;
	if (!opts.manifest) {
		self.index();
	}
	self.destructiveManifest = opts.destructiveManifest || new Manifest();
};

MetadataContainer.prototype.add = function(vinyl, optComponents) {
	var self = this;
	if (vinyl) {
		var arrayIndex = _.findIndex(self.vinyls, {
			path: vinyl.path
		});
		if (arrayIndex >= 0) {
			// replace already existing file
			self.vinyls[arrayIndex] = vinyl;
		} else {
			self.vinyls.push(vinyl);
		}
		if (Array.isArray(optComponents)) {
			optComponents.forEach(function(cmp) {
				self.manifest.add(cmp);
			});
		} else {
			self.manifest.add(vinyl.getComponent());
		}
	}
};

MetadataContainer.prototype.filter = function(manifest) {
	var self = this;
	var filteredMetadataContainer = new MetadataContainer({
		manifest: self.manifest,
		destructiveManifest: self.destructiveManifest,
		describeMetadataService: self.describeMetadataService
	});
	if (manifest) {
		var componentFileNames = _.unique(_.pluck(manifest.manifestJSON, 'fileName'));
		componentFileNames.forEach(function(componentFileName) {
			var metadataFile = MetadataFileFactory.createInstance({
				path: componentFileName
			});
			var component = metadataFile.getComponent();
			if (!component) {
				throw new Error('Could not determine component for filename: ' + componentFileName);
			}
			var type = component.getMetadataType();
			if (!type) {
				throw new Error('Could not determine type for filename ' + componentFileName);
			}
			// 1. container files
			if (metadataFile instanceof MetadataFileContainer) {
				// get all components with same fileName
				var relatedComponents = _.where(manifest.manifestJSON, {
					fileName: componentFileName
				});
				var containerComponent = _.where(relatedComponents, {
					type: type.xmlName,
					fullName: component.fullName
				});
				var vinylContainer = _.findWhere(self.vinyls, {
					path: componentFileName
				});
				if (containerComponent && containerComponent.length) {
					// container itself is being referenced in manifest
					filteredMetadataContainer.add(vinylContainer, []);
				} else {
					// construct a new File containing only related components
					var containerFile = new MetadataFileContainer({
						path: componentFileName
					});
					relatedComponents.forEach(function(cmp) {
						var c = _.findWhere(vinylContainer.components, {
							type: cmp.type,
							fullName: cmp.fullName
						});
						if (!c) {
							throw new Error("Could not find component '" + cmp + "' in '" + component + "'");
						}
						containerFile.addComponent(c);
					});
					containerFile.writeContents();
					filteredMetadataContainer.add(containerFile, []);
				}
			}
			// 2. folder based files
			// 3. meta files
			else {
				var vinyls = _.filter(self.vinyls, function(vinyl) {
					return vinyl.path && vinyl.path.indexOf(componentFileName) > -1;
				});
				if (vinyls) {
					vinyls.forEach(function(vinyl) {
						filteredMetadataContainer.add(vinyl, []);
					});
				}
			}
		});
	}
	return filteredMetadataContainer;
};

MetadataContainer.prototype.index = function() {
	var self = this;
	self.vinyls.forEach(function(vinyl) {
		var component = vinyl.getComponent();
		if (!component) {
			console.error('Could not determine component for filename ' + vinyl.path);
			return;
		}
		var type = component.getMetadataType();
		if (!type) {
			console.error('Could not determine type for filename ' + vinyl.path);
			return;
		}
		if (vinyl instanceof MetadataFileContainer) {
			self.manifest.merge(vinyl.getManifest());
		} else {
			self.manifest.add(component);
		}
	});
};

MetadataContainer.prototype.diff = function(other) {
	var self = this;
	var metadataContainer = new MetadataContainer({
		vinyls: other.vinyls,
		manifest: new Manifest()
	});
	var allFileNames = _.unique(
		[].concat(
			_.pluck(self.vinyls, 'path'),
			_.pluck(other.vinyls, 'path')
		)
	);
	allFileNames = allFileNames.filter(function(filename) {
		return Utils.isValidFilename(filename) || Utils.isValidMetaFilename(filename);
	});
	allFileNames.forEach(function(filename) {
		var from = _.findWhere(self.vinyls, {
			path: filename
		});
		var to = _.findWhere(other.vinyls, {
			path: filename
		});
		if (from && to) {
			var diffResult = from.diff(to);
			metadataContainer.manifest.merge(diffResult.added);
			metadataContainer.manifest.merge(diffResult.modified);
			metadataContainer.destructiveManifest.merge(diffResult.deleted);
		} else if (from) {
			metadataContainer.destructiveManifest.add(from.getComponent());
		} else if (to) {
			metadataContainer.manifest.add(to.getComponent());
		}
	});
	metadataContainer = metadataContainer.filter(metadataContainer.manifest);
	return metadataContainer;
};

MetadataContainer.prototype.attachManifestFiles = function() {
	var self = this;
	if (self.manifest) {
		self.add(
			new MetadataFile({
				path: 'package.xml',
				contents: new Buffer(self.manifest.toPackageXml(false))
			}), []
		);
	}
	if (self.destructiveManifest && self.destructiveManifest.manifest().length) {
		self.add(
			new MetadataFile({
				path: self.post ? 'destructiveChangesPost.xml' : 'destructiveChanges.xml',
				contents: new Buffer(self.destructiveManifest.toPackageXml(true))
			}), []
		);
	}
	return self;
};

MetadataContainer.prototype.determineMissingFiles = function() {
	var self = this;
	var missingFiles = [];
	self.manifest.getFileNames().forEach(function(filename) {
		var type = self.describeMetadataService.getTypeForFilepath(filename);
		if (!type) {
			return;
		}
		if (_.findIndex(self.vinyls, {
				path: filename
			}) < 0) {
			missingFiles.push(filename);
		}
		if (type.metaFile) {
			// TODO: move this to Manifest getComponent (metaFile -> metaFile: ..-meta.xml)
			var metaFilename = filename + "-meta.xml";
			if (_.findIndex(self.vinyls, {
					path: metaFilename
				}) < 0) {
				missingFiles.push(metaFilename);
			}
		}
	});
	return _.unique(missingFiles);
};

MetadataContainer.prototype.completeMetadataWith = function(opts) {
	var self = this;
	opts = opts || {};
	var missingFiles = self.determineMissingFiles();
	if (missingFiles.length) {
		// console.error('There are some files missing:');
		// console.error(JSON.stringify(missingFiles));
		if (opts.path) {
			// console.error('Trying to complete metadata from path: ' + opts.path);
			missingFiles.forEach(function(filename) {
				var realPath = path.join(opts.path, filename);
				if (fs.existsSync(realPath)) {
					var stat = fs.statSync(realPath);
					var relativePaths = [];
					if (stat.isDirectory()) {
						var foo = _.map(fs.readdirSync(realPath), function(f) {
							return path.join(filename, f);
						});
						relativePaths = [].concat(relativePaths, foo);
					} else {
						relativePaths.push(filename);
					}
					relativePaths.forEach(function(relativePath) {
						var fullPath = path.join(opts.path, relativePath);
						self.vinyls.push(
							MetadataFileFactory.createInstance({
								path: relativePath,
								contents: fs.readFileSync(fullPath)
							})
						);
					});
				} else {
					console.error('Error completing missing metadata: ' + filename);
				}
			});
		} else {
			console.error('Could not complete missing metadata.');
		}
	}
	return self;
};

MetadataContainer.prototype.stream = function() {
	var self = this;
	var s = new Stream();
	s.readable = true;
	self.vinyls.forEach(function(file) {
		setImmediate(function() {
			s.emit('data', file);
		});
	});
	setImmediate(function() {
		s.emit('end');
	});
	return s;
};
