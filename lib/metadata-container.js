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
var miss = require('mississippi');
var chalk = require('chalk');

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
				contents: Buffer.from(self.manifest.toPackageXml(false))
			}), []
		);
	}
	if (self.destructiveManifest && self.destructiveManifest.manifest().length) {
		self.add(
			new MetadataFile({
				path: 'destructiveChanges.xml',
				contents: Buffer.from(self.destructiveManifest.toPackageXml(true))
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

// Recursively navigate through a file tree and create an array of the files
// Returns a nested array with the RELATIVE paths of the files
function listFilesInTree(absolutePath, relativePath) {
	if (fs.lstatSync(absolutePath).isDirectory()) {
		return fs.readdirSync(absolutePath).map(function(contents) {
			return listFilesInTree(path.join(absolutePath, contents), path.join(relativePath, contents))
		});
	}
	return relativePath;
}

// Combines an array of sub-arrays into a single 'flat' array
function flatten(arr) {
	return arr.reduce(function(flat, toFlatten) {
		return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
	}, []);
}

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
						// add all files in that directory in case of AuraDefinitionBundle or a WaveTemplate
						if (filename.indexOf('aura') === 0 || filename.indexOf('waveTemplates') === 0) {
							var foo = listFilesInTree(realPath, filename);
							relativePaths = flatten(foo);
						}
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


MetadataContainer.diffStream = function() {
	return miss.through.obj(function(results, enc, cb) {
		var metadataContainer = new MetadataContainer({
			vinyls: results.target.vinyls,
			manifest: new Manifest()
		});
		var allFileNames = _.unique(
			[].concat(
				_.pluck(results.source.vinyls, 'path'),
				_.pluck(results.target.vinyls, 'path')
			)
		);
		allFileNames = allFileNames.filter(function(filename) {
			return Utils.isValidFilename(filename) || Utils.isValidMetaFilename(filename);
		});
		allFileNames.forEach(function(filename) {
			var from = _.findWhere(results.source.vinyls, {
				path: filename
			});
			var to = _.findWhere(results.target.vinyls, {
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
		cb(null, metadataContainer);
	});

}

MetadataContainer.prototype.getStream = function() {
	var stream = miss.from.obj();
	stream.push(this);
	stream.push(null);
	return stream;
}

MetadataContainer.completeMetadataStream = function(opts) {
	opts = opts || {};
	return miss.through.obj(function(metadataContainer, enc, cb) {

		metadataContainer = metadataContainer.completeMetadataWith({
			path: opts.path || 'src'
		}).filter(metadataContainer.manifest);
		metadataContainer.manifest.rollup();
		metadataContainer.destructiveManifest.filterUnnamed();

		cb(null, metadataContainer);
	});
}
MetadataContainer.outputStream = function(opts) {
	opts = opts || {}
	var manifest = new Manifest({
		apiVersion: opts.apiVersion
	});
	var destructiveManifest = new Manifest();

	return miss.through.obj(function(metadataContainer, enc, cb) {
		var self = this;
		metadataContainer.vinyls.forEach(function(vinyl) {
			self.push(vinyl);
		})
		manifest.merge(metadataContainer.manifest);
		destructiveManifest.merge(metadataContainer.destructiveManifest);
		cb();
	}, function(cb) {
		var self = this;

		if (manifest) {
			console.log('Manifest:\n' + chalk.grey(manifest.toPackageXml()));
		}
		if (destructiveManifest && destructiveManifest.manifest().length) {
			console.log('Destructive Manifest:\n' + chalk.grey(destructiveManifest.toPackageXml(true)));
		}

		self.push(
			new MetadataFile({
				path: 'package.xml',
				contents: Buffer.from(manifest.toPackageXml(false))
			})
		);
		if (destructiveManifest.manifest().length) {
			self.push(
				new MetadataFile({
					path: 'destructiveChanges.xml',
					contents: Buffer.from(destructiveManifest.toPackageXml(true))
				})
			);
		}
		cb();
	});
}
