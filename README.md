# force-dev-tool

> Command line tool supporting the Force.com development lifecycle

[![Build Status](https://travis-ci.org/amtrack/force-dev-tool.svg?branch=master)](https://travis-ci.org/amtrack/force-dev-tool) OS X / Linux

[![Build Status Windows](https://ci.appveyor.com/api/projects/status/wmdv146qn3oi582u/branch/master?svg=true)](https://ci.appveyor.com/project/amtrack/force-dev-tool/branch/master) Windows


## Install

```console
$ npm install --global force-dev-tool
```

## Usage

```console
$ force-dev-tool --help
force-dev-tool.

Usage:
  force-dev-tool <command> [<args>...]
  force-dev-tool -h | --help
  force-dev-tool --version

Options:
  -h --help       Show this screen.
  --version       Show version.

Commands:
  help            Print help for a command or in general
  remote          Manage orgs (list, add, remove, set default, set password)
  login           Login using Metadata API and show login URL
  fetch           Fetch describe information from a remote
  info            Show describe information from a remote
  package         Generate a package.xml file from local describe information
  retrieve        Retrieve metadata specified in package.xml
  deploy          Deploy metadata specified in a package.xml
  deployTest      DEPRECATED! Use `deploy -t` instead
  validate        DEPRECATED! Use `deploy -c` instead
  validateTest    DEPRECATED! Use `deploy -ct` instead
  test            Execute unit tests
  changeset       Create a changeset/deployment from a unified diff input or cli args
  query           Execute a SOQL query returing JSON
  bulk            (alpha) Import/export data in CSV format using the bulk API
  execute         (alpha) Execute anonymous Apex
  completion      (alpha) Print command line completion

See 'force-dev-tool help <command>' for more information on a specific command.
```

## Examples
**Managing remote environments**

```console
$ force-dev-tool remote add mydev user pass --default
$ force-dev-tool remote add build user pass2
$ force-dev-tool remote add production user pass3 https://login.salesforce.com
```

**Validating credentials for a given remote (optional)**

```console
$ force-dev-tool login mydev
Logged in successfully to remote mydev.
Use the following URL to open Salesforce in your web browser:

https://mynamespace.my.salesforce.com/secur/frontdoor.jsp?sid=REDACTED
```

**Building a manifest**

Fetch various information from the remote first

```console
$ force-dev-tool fetch --progress
Fetching from remote mydev
API Versions
Available Metadata Types
Folders
Metadata Components
RecordTypes of PersonAccount
Active Flow versions
Created config/mydev-fetch-result.json
Fetching remotes finished.
```

Now generate a `package.xml` file based on the fetched information

```console
$ force-dev-tool package -a
Created src/package.xml
```

In order to exclude certain metadata components from being added to the `package.xml` file, add patterns (similar to `.gitignore`) to `.forceignore`. See [here](https://gist.github.com/amtrack/7b99d31b60971b95dda801fd58288257) for some sane default rules.

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

2\. By providing a unified diff (e.g. `git diff`). Tweak the `git diff` command with `--ignore-space-at-eol` or `--ignore-all-space` to ignore space changes.
```console
$ git diff --no-renames master feature/vat | force-dev-tool changeset create vat
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
 <version>38.0</version>
</Package>

exported metadata container to config/deployments/vat
```

**Creating destructive deployments (reverting changes)**

1\. By explicitly listing metadata files or metadata components
```console
$ force-dev-tool changeset create undo-vat --destructive src/pages/AccountExtensionVAT.page CustomField/Account.VAT__c
```

2\. By providing a unified diff (e.g. `git diff`)
```console
$ git diff --no-renames feature/vat master | force-dev-tool changeset create undo-vat
```

Both approaches lead to the following result
```console
Manifest:
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
 <version>38.0</version>
</Package>

Destructive Manifest:
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
</Package>

exported metadata container to config/deployments/undo-vat
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

**Running unit tests**

Running all local tests

```console
$ force-dev-tool test
Running Test execution to remote mydev
Failures:
Test_Foo#test_method_one took 32.0
  - System.AssertException: Assertion Failed: Expected: foo, Actual: bar
  - Class.Test_Foo.test_method_one: line 8, column 1
Test_Foo2#test_method_one took 11.0
  - System.AssertException: Assertion Failed
  - Class.Test_Foo2.test_method_one: line 7, column 1
Error: Visit https://mynamespace.my.salesforce.com/changemgmt/monitorDeploymentsDetails.apexp?asyncId=REDACTED for more information.
3 methods, 2 failures
```

Running specified test classes

```console
$ force-dev-tool test --classNames 'Test_MockFoo Test_MockBar'
```

Running test classes matching a pattern (in src/package.xml)

```console
$ force-dev-tool package grep 'ApexClass/Test_Mock*' \
 | cut -d '/' -f 2 \
 | xargs -0 force-dev-tool test --classNames
```

**Using `force-dev-tool` in a build script**

The following environment variables can be used to define a default remote environment called `env`:

* `SFDC_USERNAME`
* `SFDC_PASSWORD`
* `SFDC_SERVER_URL`

```console
$ force-dev-tool validateTest env
```

Note: You can also define named remotes using [Environment Variables](https://github.com/amtrack/force-dev-tool/wiki/Environment-Variables) (e.g. `SFDC_ci_USERNAME`, `SFDC_ci_PASSWORD`, `SFDC_ci_SERVER_URL`).

**Executing a SOQL query**

```console
$ force-dev-tool query "SELECT Id, Name FROM Account LIMIT 1"
[
  {
    "attributes": {
      "type": "Account",
      "url": "/services/data/v38.0/sobjects/Account/001200000183ZCFAA2"
    },
    "Id": "001200000183ZCFAA2",
    "Name": "GenePoint"
  }
]

$ force-dev-tool query "SELECT COUNT(Id) c FROM Account"
[
  {
    "attributes": {
      "type": "AggregateResult"
    },
    "c": 15
  }
]
```

**(alpha) Exporting/importing data using the bulk API**

Exporting data

```console
$ force-dev-tool bulk export "SELECT Id, Name FROM Account LIMIT 1"
"Id","Name"
"001200000183ZCFAA2","GenePoint"
$ force-dev-tool bulk export "SELECT Id, Name FROM Account" --out Accounts.csv
```

Updating data

```console
$ force-dev-tool bulk update Account --in Accounts.csv --out Accounts-update-results.csv
```

Note: Importing more than one batch is currently not yet supported.

**(alpha) Executing anonymous Apex**

```console
$ echo "insert new Account(Name = 'Test Account');" | force-dev-tool execute
```

## Getting help

Please see the [wiki](https://github.com/amtrack/force-dev-tool/wiki) for [Motivation](https://github.com/amtrack/force-dev-tool/wiki/Motivation) and [Troubleshooting](https://github.com/amtrack/force-dev-tool/wiki/Troubleshooting) and [Resources](https://github.com/amtrack/force-dev-tool/wiki/Resources).

Feel free to open issues with questions.

## License
MIT © [Matthias Rolke](mailto:mr.amtrack@gmail.com)
