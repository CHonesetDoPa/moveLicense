// moveLicense.js @ 1.1.0
// This file is used to move the LICENSE files to the root of the app directory.

const fs = require('fs');
const path = require('path');

const packageJsonPath = path.resolve(__dirname, 'package.json');
const moveLicensePath = path.resolve(__dirname, 'moveLicense.js');
const scriptPath = __filename;

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

        const moveLicenseContent = `
// moveLicense.js @ 1.1.0
// This file is used to move the LICENSE files to the root of the app directory.

const path = require('path');
const fs = require('fs-extra');

module.exports = async (context) => {
  const { appOutDir, electronPlatformName } = context;

  let unpackedDir;
  switch (electronPlatformName) {
    case 'win32':
    case 'linux':
      unpackedDir = path.join(appOutDir);
      break;
    default:
      throw new Error(\`Unsupported platform: \${electronPlatformName}\`);
  }

  const licenseDir = path.join(appOutDir, 'license');
  const projectLicenseDir = path.join(process.cwd(), 'license'); 

  await fs.ensureDir(licenseDir);

  const moveFile = async (src, dest) => {
    try {
      await fs.move(src, dest, { overwrite: true });
      console.log(\`Moved \${src} to \${dest}\`);
    } catch (error) {
      console.error(\`Error moving \${src} to \${dest}:\`, error);
    }
  };

  await moveFile(path.join(unpackedDir, 'LICENSE.electron.txt'), path.join(licenseDir, 'LICENSE.electron.txt'));
  await moveFile(path.join(unpackedDir, 'LICENSES.chromium.html'), path.join(licenseDir, 'LICENSES.chromium.html'));

  try {
    const files = await fs.readdir(projectLicenseDir);
    for (const file of files) {
      await moveFile(path.join(projectLicenseDir, file), path.join(licenseDir, file));
    }
  } catch (error) {
    console.error('Error copying project root LICENSE files:', error);
  }
};
`;

        fs.writeFile(moveLicensePath, moveLicenseContent, (moveLicenseErr) => {
          if (moveLicenseErr) {
            console.error('Failed to write moveLicense.js file:', moveLicenseErr);
          } else {
            console.log('moveLicense.js has been successfully generated!');
          }
        });
      }
    });
  } catch (parseErr) {
    console.error('Failed to parse package.json file:', parseErr);
  }
});