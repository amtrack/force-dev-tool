# force-dev-tool

> Command line tool supporting the Force.com development and deployment workflow

[![Build Status](https://travis-ci.org/amtrack/force-dev-tool.svg?branch=master)](https://travis-ci.org/amtrack/force-dev-tool)

## Install

```console
$ npm install --global force-dev-tool
```

## Usage

```console
$ force-dev-tool --help
```

## Examples
**Managing remote environments**

```console
$ force-dev-tool remote add mydev user pass --default
$ force-dev-tool remote add build user pass2
$ force-dev-tool remote add production user pass3 https://login.salesforce.com
```

**Building a manifest**

```console
$ force-dev-tool fetch
Fetching from remote mydev
Created config/mydev-describe-metadata-result.json
Created config/mydev-describe-tooling-objects-result.json
Created config/mydev-manifest.json
Fetching remotes finished.
$ force-dev-tool package -a
Created src/package.xml
```

In order to exclude certain metadata components from being added to the manifest, add patterns (similar to `.gitignore`) to `.forceignore`.

**Retrieving metadata**

```console
$ force-dev-tool retrieve
Retrieving from remote mydev to directory src
Succeeded
```

**Creating deployments**

1\. By explicitly listing metadata files or metadata components
```console
$ force-dev-tool changeset create vat src/pages/AccountExtensionVAT.page CustomField/Account.VAT__c
```

2\. By providing a unified diff (e.g. `git diff`)
```console
$ git diff master feature/vat | force-dev-tool changeset create vat
```

Both approaches lead to the following result
```console
Manifest:
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
 <types>
     <members>Account.VAT__c</members>
     <name>CustomField</name>
 </types>
 <types>
     <members>AccountExtensionVAT</members>
     <name>ApexPage</name>
 </types>
 <version>34.0</version>
</Package>

exported metadata container to config/deployments/vat
```

**Deploying metadata**

```console
$ force-dev-tool validate
$ force-dev-tool validateTest
$ force-dev-tool validateTest -d config/deployments/vat
$ force-dev-tool deploy
$ force-dev-tool deployTest
```

Options:

	-d=<directory>    Directory containing the metadata and package.xml [default: ./src].

**Using `force-dev-tool` in a build script**

The following environment variables will be available as remote environment `env`:

* `SFDC_USERNAME`
* `SFDC_PASSWORD`
* `SFDC_SERVER_URL`

```console
$ force-dev-tool validateTest env
```

## License
MIT © [Matthias Rolke](mailto:mr.amtrack@gmail.com)
