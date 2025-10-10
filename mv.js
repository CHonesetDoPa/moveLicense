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

  await fs.ensureDir(licenseDir);

  const moveFile = async (src, dest) => {
    try {
      // Check if source file exists before moving
      if (await fs.pathExists(src)) {
        await fs.move(src, dest, { overwrite: true });
        console.log(`Moved ${src} to ${dest}`);
      }
    } catch (error) {
      console.error(`Error moving ${src} to ${dest}:`, error);
    }
  };

  const copyFile = async (src, dest) => {
    try {
      // Check if source file exists before copying
      if (await fs.pathExists(src)) {
        await fs.copy(src, dest, { overwrite: true });
        console.log(`Copied ${src} to ${dest}`);
      }
    } catch (error) {
      console.error(`Error copying ${src} to ${dest}:`, error);
    }
  };

  // Move Electron and Chromium license files
  await moveFile(path.join(unpackedDir, 'LICENSE.electron.txt'), path.join(licenseDir, 'LICENSE.electron.txt'));
  await moveFile(path.join(unpackedDir, 'LICENSES.chromium.html'), path.join(licenseDir, 'LICENSES.chromium.html'));

  // Copy custom project license files (case-insensitive detection for 'license' or 'licenses')
  try {
    const rootFiles = await fs.readdir(process.cwd());
    const licenseEntries = rootFiles.filter(file => ['license', 'licenses'].includes(file.toLowerCase()));
    
    for (const licenseEntry of licenseEntries) {
      const projectLicensePath = path.join(process.cwd(), licenseEntry);
      const stats = await fs.stat(projectLicensePath);
      
      if (stats.isDirectory()) {
        const files = await fs.readdir(projectLicensePath);
        for (const file of files) {
          await copyFile(path.join(projectLicensePath, file), path.join(licenseDir, file));
        }
      } else if (stats.isFile()) {
        await copyFile(projectLicensePath, path.join(licenseDir, path.basename(projectLicensePath)));
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Error copying project root LICENSE files:', error);
    }
  }
}; 