# CHANGELOG

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
