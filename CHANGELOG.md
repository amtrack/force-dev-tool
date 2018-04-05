# CHANGELOG

## 1.1.1
Fixed
 * changeset: handle recordType in layoutAssignments of Profile @leboff (#126)

## 1.1.0
Added
 * implement multiple packaging options (`-p, --no-recursive` and `-m, --include-managed`)
 * implement `remote display` command to show `sfdx`-like JSON
 * add some unit and integration tests for changeset command
 * deploy/test: show overall code coverage when available

Changed
 * reimplement changeset command using streams @leboff (#99)
 * bump default API version to 41.0
 * print to stderr on failure

Fixed
 * handle DashboardFolder, DocumentFolder, EmailFolder and ReportFolder (#103)
 * TypeError: field.childNamed is not a function (#97)
 * improve package generation for translation types

## 1.0.0
Removed (breaking change)
 * drop support for node 0.12

Added
 * implement querying using Tooling API
 * .forceignore: implement whitelisting
 * add package-lock.json to speed up installation

Fixed
 * fix standard picklists
 * fix regex alerted by eslint
 * adjust timeout of flaky unit test
 * xmldoc: use main repository again and fix indentation for metadata

Changed
 * update dev dependencies
 * clarify usage of environment variables
 * use metadata-writer for writing packages

## 0.13.1

 * fix sort order of childXmlTypes in metadata file container
 * declare EscalationRule as childType

## 0.13.0

 * fix package.xml generation (#82)
 * implement `info list`, `info grep` and `info show` subcommands
 * implement `package add`, `package remove` and `package list` subcommands
 * implement retrieving packages (outbound changesets)
 * add support for more DeployOptions: `--runTests` (#76) and `--purgeOnDelete`
 * deprecate aliases for `deploy`: `deployTest`, `validate` and `validateTest`

## 0.12.0

 * fix running specific tests (#80)
 * implement `package grep` subcommand (#77)
 * implement workaround for standard picklists (#75)

## 0.11.0

 * fix PersonAccount RecordType
 * add info command to README
 * bump API version to 38.0

## 0.10.0

 * add --classNames option to test command (#42)

## 0.9.0

 * fix `npm run fmt` for macOS
 * fix getApiVersion() of fetch-result-parser
 * implement zipping and unzipping based on yazl and yauzl
	* fixes issues deploying metadata with file names containing umlauts
	* adds ability to deploy zip files instead of directories
 * add `package version` command to get/set api version of a `package.xml`
 * add `info` command to show describe information for a remote

## 0.8.0

 * improve generating the package.xml file by fetching more information from remotes
	* determine active Flow version by running a SOQL query
	* identify PersonAccount RecordTypes listed as Account RecordTypes by running a SOQL query
	* retrieve api versions from remote
 * improve creating changesets
	* implement diffing profiles and permissionsets

## 0.7.1

 * fix issue with minor release of vinyl npm package

## 0.7.0

 * implement custom sort order for `package.xml`
 * update default API version to `37.0`
 * add integration test to validate deploying metadata
 * update dependencies

## 0.6.0

 * add `login` command to log in using the Metadata API
 * add example for creating a destructive deployment to README

## 0.5.0
 * drop support for node v0.10
 * format code using js-prettify
 * refactoring
 * improve code coverage
 * add integration tests for cli

## 0.4.0
 * add `query` command for running a SOQL query
 * add `bulk` command for importing/exporting data
 * add `execute` command for executing anonymous Apex
 * remove undocumented `backup` command
 * `force-dev-tool` can now handle being called from within a subdirectory of the project (e.g. `src/`)
 * import force-metadata-utils package for making maintenance easier
 * update dependencies

## 0.3.2
 * allow overwriting deployment directory if `--force` flag is provided
 * improve stability of `remote` command
 * make `fetch` command work with PE editions where Apex is not available

## 0.3.1
 * fix `changeset create` command with binaries
 * include `codeCoverageWarnings` in output of `deploy` command

## 0.3.0
 * add support for windows

## 0.2.0
 * implement running unit tests

## 0.1.2
 * fix deploy command

## 0.1.1
 * explicitly specify test level 'RunLocalTests' for test execution

## 0.1.0
 * intitial release
