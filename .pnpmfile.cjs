// .pnpmfile.cjs
function readPackage(pkg) {
  // すべてのgit依存関係のSSH URLをHTTPSに変換
  if (pkg.dependencies) {
    Object.keys(pkg.dependencies).forEach((dep) => {
      const value = pkg.dependencies[dep];
      if (typeof value === 'string' && value.includes('git@github.com:')) {
        pkg.dependencies[dep] = value.replace(
            /git@github\.com:/g,
            'https://github.com/'
        );
      }
      if (typeof value === 'string' && value.includes('ssh://git@github.com/')) {
        pkg.dependencies[dep] = value.replace(
            /ssh:\/\/git@github\.com\//g,
            'https://github.com/'
        );
      }
    });
  }

  if (pkg.devDependencies) {
    Object.keys(pkg.devDependencies).forEach((dep) => {
      const value = pkg.devDependencies[dep];
      if (typeof value === 'string' && value.includes('git@github.com:')) {
        pkg.devDependencies[dep] = value.replace(
            /git@github\.com:/g,
            'https://github.com/'
        );
      }
      if (typeof value === 'string' && value.includes('ssh://git@github.com/')) {
        pkg.devDependencies[dep] = value.replace(
            /ssh:\/\/git@github\.com\//g,
            'https://github.com/'
        );
      }
    });
  }

  return pkg;
}

module.exports = {
  hooks: {
    readPackage
  }
};