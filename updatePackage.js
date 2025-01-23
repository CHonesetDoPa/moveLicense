// updatePackage.js @ 1.0.0
// This file is used to update the package.json file to add the afterPack configuration.

const fs = require('fs');
const path = require('path');

const packageJsonPath = path.resolve(__dirname, 'package.json');

fs.readFile(packageJsonPath, 'utf8', (err, data) => {
  if (err) {
    console.error('Failed to read package.json file:', err);
    return;
  }

  try {
    const packageJson = JSON.parse(data);

    packageJson.build = packageJson.build || {};
    packageJson.build.afterPack = 'moveLicense.js'; 

    fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), (writeErr) => {
      if (writeErr) {
        console.error('Failed to write package.json file:', writeErr);
      } else {
        console.log('afterPack configuration has been successfully added to package.json!');
      }
    });
  } catch (parseErr) {
    console.error('Failed to parse package.json file:', parseErr);
  }
});
