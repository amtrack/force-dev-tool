const child = require('child_process');
const path = require('path');
const tmp = require('tmp');

class Repository {
  addChangeSet(data) {
    this._data = path.join(__dirname, '../data', data);
    this.init();
    this.add('v0');
    this.commit('First commit');
    this.rm();
    this.add('v1');
    this.commit('Last commit');
  }

  init() {
    let tmpobj = tmp.dirSync();
    this._cwd = tmpobj.name;
    return this._execute('git', [ 'init' ]);
  }

  add(testFolder, pathspec = '.') {
    child.spawnSync('cp', ['-r', path.join(this._data, testFolder),  path.join(this._cwd, 'src')]);
    return this._execute('git', ['add', pathspec]);
  }

  rm(folder = 'src') {
    this._execute('git', ['rm', '-r', folder]);
    return this._execute('rm', ['-r', '-f', folder]);
  }

  commit(message = 'no message') {
    return this._execute('git', ['commit', '-m', message]);
  }

  getRepoPath() {
    return this._cwd;
  }

  getDataPath() {
    return this._data;
  }

  _execute(cmd, args) {
    let result = child.spawnSync(cmd, args, {
      cwd: this._cwd
    });
    if (result.status !== 0) {
      throw result.stdout + '\n' + result.stderr;
    }
    return result;
  }
}

module.exports = new Repository();
