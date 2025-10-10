// mv.js @ 1.2.2
// This file is used to move the LICENSE files to the root of the app directory.
// But this time, you'll need to add it to the `package.json` file yourself.

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
      throw new Error(`Unsupported platform: ${electronPlatformName}`);
  }

  const licenseDir = path.join(appOutDir, 'license');
  const projectLicenseDir = path.join(process.cwd(), 'license'); 

  await fs.ensureDir(licenseDir);

  const moveFile = async (src, dest) => {
    try {
      await fs.move(src, dest, { overwrite: true });
      console.log(`Moved ${src} to ${dest}`);
    } catch (error) {
      console.error(`Error moving ${src} to ${dest}:`, error);
    }
  };

  await moveFile(path.join(unpackedDir, 'LICENSE.electron.txt'), path.join(licenseDir, 'LICENSE.electron.txt'));
  await moveFile(path.join(unpackedDir, 'LICENSES.chromium.html'), path.join(licenseDir, 'LICENSES.chromium.html'));

  try {
    const projectLicensePath = path.join(process.cwd(), 'license');
    const stats = await fs.stat(projectLicensePath);
    
    if (stats.isDirectory()) {
      const files = await fs.readdir(projectLicensePath);
      for (const file of files) {
        await moveFile(path.join(projectLicensePath, file), path.join(licenseDir, file));
      }
    } else if (stats.isFile()) {
      await moveFile(projectLicensePath, path.join(licenseDir, 'license'));
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Error copying project root LICENSE files:', error);
    }
  }
}; 