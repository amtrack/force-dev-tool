"use strict";

/*eslint no-undef: "error"*/
/*eslint-env browser*/

var NightmareSalesforce = module.exports = function(baseUrl) {
	var self = this;
	self.baseUrl = baseUrl;
}

NightmareSalesforce.prototype.login = function(sid) {
	var self = this;
	return function(nightmare) {
		nightmare
			.goto(self.baseUrl + '/secur/frontdoor.jsp?sid=' + sid + '&retURL=setup/forcecomHomepage.apexp')
			.wait('#contentWrapper');
	};
};

NightmareSalesforce.prototype.openOutboundChangesets = function() {
	var self = this;
	return function(nightmare) {
		nightmare
			.goto(self.baseUrl + '/changemgmt/listOutboundChangeSet.apexp')
			.wait('#ListOutboundChangeSetPage')
	};
};

NightmareSalesforce.prototype.openOutboundChangeset = function(changesetId) {
	var self = this;
	return function(nightmare) {
		nightmare
			.goto(self.baseUrl + '/changemgmt/outboundChangeSetDetailPage.apexp?id=' + changesetId)
			.wait('input[id$=":component_list_form_buttons:outboundCs_add"]')
	};
};

NightmareSalesforce.prototype.createChangeset = function(name, description) {
	return function(nightmare) {
		nightmare
			.click('input[id$=":newChangeSet"]')
			.wait(100)
			.wait('input[id$=":changeSetName"]')
			.type('input[id$=":changeSetName"]', name)
			.type('textarea[id$=":changeSetDescription"]', description ? description : '')
			.click('input[value="Save"]')
			.wait(function() {
				return window.location.search.split('?id=').length > 1;
			})
			.evaluate(function() {
				return window.location.search.split('?id=')[1];
			});
	};
};

NightmareSalesforce.prototype.deleteChangeset = function() {
	return function(nightmare) {
		nightmare
			.click('input[id$=":form_buttons:outboundCs_delete"]')
			.wait(100)
			.wait('input[id="simpleDialog0button0"]')
			.click('input[id="simpleDialog0button0"]')
			.wait('#ListOutboundChangeSetPage')
			.evaluate(function() {
				return "Deleted changeset";
			});
	};
};

// TODO: pagination
NightmareSalesforce.prototype.listChangesets = function() {
	return function(nightmare) {
		// "a[id$=':nextPageLink']"
		nightmare
			.evaluate(function() {
				var rows = document.querySelectorAll('form[id*=ListOutboundChangeSetPage] tr.dataRow');
				return [].slice.call(rows).map(function(row) {
					var link = row.cells[1].querySelector('a');
					return {
						name: link.innerText,
						id: link.href.split('?id=')[1]
					};
				});
			});
	};
};

NightmareSalesforce.prototype.getPackageIdForChangeset = function(changesetId) {
	return function(nightmare) {
		nightmare
			.click('input[id$=":component_list_form_buttons:outboundCs_add"]')
			.wait(function() {
				return window.location.href.match(/AddToPackageFromChangeMgmtUi/);
			})
			.evaluate(function(changesetId) {
				var params = window.location.search.split('&id=');
				if (params.length > 1) {
					return params[1];
				}
				throw new Error("Could not determine package id for changeset id: " + changesetId);
			}, changesetId);
	};
};

NightmareSalesforce.prototype.selectMetadataComponents = function(packageId, entityType, fileProperties) {
	var self = this;
	return function(nightmare) {
		var ids = fileProperties.map(function(fileProperty) {
			return fileProperty.id;
		});
		var parts = ids.map(function(cId) {
			return '&ids=' + cId.substr(0, 15);
		});
		var packageUrl = '/p/mfpkg/AddToPackageFromChangeMgmtUi?id=' + packageId;
		var homeUrl = '/setup/forcecomHomepage.apexp';
		var url = self.baseUrl + packageUrl +
			'&entityType=' + entityType +
			'&retURL=' + encodeURIComponent(homeUrl) +
			'&rowsperpage=50000' +
			parts.join('');

		nightmare
			.goto(url)
			.wait(function(entityType) {
				var selectedEntityType = document.querySelector('select[id=entityType]');
				return selectedEntityType && selectedEntityType.value === entityType;
			}, entityType)
			.evaluate(function(fileProperties) {
				var selectedIds = Array.prototype.slice.call(document.querySelectorAll('form[id=editPage] input[type=checkbox]:checked')).map(function(item) {
					return item.value;
				});
				fileProperties.forEach(function(fileProperty) {
					fileProperty.selected = selectedIds.indexOf(fileProperty.id.substr(0, 15)) >= 0;
				});
				return fileProperties;
			}, fileProperties);
	};
};

NightmareSalesforce.prototype.saveSelectedMetadataComponents = function(fileProperties) {
	return function(nightmare) {
		nightmare
			.wait('input[name="save"]')
			.click('input[name="save"]')
			.wait('#qcform') // on Force.com Home page
			.evaluate(function(fileProperties) {
				return fileProperties;
			}, fileProperties);
	};
};
