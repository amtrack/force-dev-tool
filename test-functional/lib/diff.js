const child = require('child_process');
const expect = require('chai').expect;

function directoryContentEquals(compare1, compare2) {
  var diffDirsCmd = child.spawnSync("diff", [ "-u", "-r", compare1, compare2]);
  expect(diffDirsCmd.status, diffDirsCmd.stdout.toString()).to.equal(0);
}

module.exports = {
  directoryContentEquals
}