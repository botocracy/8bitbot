const fs = require('fs');
const Path = require('path');

deleteFolderRecursive = function (path) {
  var files = [];

  if (fs.existsSync(path)) {
    files = fs.readdirSync(path);

    files.forEach(function (file, index) {
      const curPath = Path.join(path, file);

      if (fs.lstatSync(curPath).isDirectory()) {
        // Recurse
        deleteFolderRecursive(curPath);
      } else {
        // Delete file
        fs.unlinkSync(curPath);
      }
    });

    fs.rmdirSync(path);
  }
};

console.log('Cleaning working tree...');

deleteFolderRecursive('./.build');
deleteFolderRecursive('./build');
deleteFolderRecursive('./node_modules');
deleteFolderRecursive('./web_modules');

console.log('Successfully cleaned working tree!');
