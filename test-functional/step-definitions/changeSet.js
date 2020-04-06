const { Given, When, Then, After } = require('cucumber');
const forceDevTool = require('../lib/force-dev-tool')
const git = require('../lib/git');
const chai = require('chai');
const expect = chai.expect;
chai.use(require('chai-fs'));
const diff = require('../lib/diff');

Given('a list of {string} metadata in {string} folder which has been added and updated in a git repository', function (child, data) {
  git.addChangeSet(data);
});

Given('a list of {string} metadata in {string} folder which has been removed in a git repository', function (child, data) {
  git.addChangeSet(data);
});

Given('a list of {string} metadata in {string} folder which is not a deployable {string} and has been changed in a git repository', function (parent, data, child) {
  git.addChangeSet(data);
});

Given('a list of {string} metadata in {string} folder which has been changed in a git repository', function (simple, data) {
  git.addChangeSet(data);
});

When('a user launches a change set with force-dev-tool', function () {
  let ret = forceDevTool.setCwd(git.getRepoPath()).changeSetCreate();
  expect(ret.stdout.toString()).to.include('Manifest:');
});

Then('it will create a change set with the list of {string} metadata', function (child) {
  let pathOf = forceDevTool.setExpectedFolder(git.getDataPath()).getPathList();
  diff.directoryContentEquals(pathOf.changeSet, pathOf.expected);
  expect(pathOf.packageXml).to.be.a.file().with.contents.that.match(new RegExp(`<name>${child}</name>`));
});

Then('excluding any {string} metadata in the change set', function (parent) {
  let pathOf = forceDevTool.getPathList();
  expect(pathOf.packageXml).to.be.a.file().and.not.have.contents.that.match(new RegExp(`<name>${parent}</name>`));
});

Then('it will create a destructive change with the list of {string} metadata', function (child) {
  let pathOf = forceDevTool.setExpectedFolder(git.getDataPath()).getPathList();
  diff.directoryContentEquals(pathOf.changeSet, pathOf.expected);
  expect(pathOf.destructiveXml).to.be.a.file().with.contents.that.match(new RegExp(`<name>${child}</name>`));
});

Then('it will create a change set with all {string} metadata', function (parent) {
  let pathOf = forceDevTool.setExpectedFolder(git.getDataPath()).getPathList();
  diff.directoryContentEquals(pathOf.changeSet, pathOf.expected);
  expect(pathOf.packageXml).to.be.a.file().with.contents.that.match(new RegExp(`<name>${parent}</name>`));
});

Then('it will create a destructive change with the list of removed {string} metadata', function (simple) {
  let pathOf = forceDevTool.setExpectedFolder(git.getDataPath()).getPathList();
  expect(pathOf.destructiveXml).to.be.a.file().with.contents.that.match(new RegExp(`<name>${simple}</name>`));
});

Then('the change set could be deployed correctly', function () {
  forceDevTool.checkDeploy(forceDevTool.deployFirstCommit());
  forceDevTool.checkDeploy(forceDevTool.deployChangeSet());
});

Then('the change set must fail when it is deployed', function () {
  forceDevTool.checkDeploy(forceDevTool.deployFirstCommit());
  forceDevTool.checkDeployFail(forceDevTool.deployChangeSet());
});

After(function(scenario) {
  if (scenario.result.status !== 'passed' || scenario.pickle.tags.some(t => t.name === '@doing')) {
    console.log(`\n    Temporal folder with git is '${git.getRepoPath()}'`);
  }
});