#!/usr/bin/env node

// CLI tool - Allows manual configuration execution
const fs = require('fs');
const path = require('path');
const { program } = require('commander');

program
  .version('1.3.0')
  .description('MoveLicense - Organize LICENSE files for Electron apps')
  .option('-f, --force', 'Force reconfiguration even if already setup')
  .option('--clean', 'Remove moveLicense configuration from project')
  .parse();

const options = program.opts();
const projectRoot = process.cwd();
const packageJsonPath = path.join(projectRoot, 'package.json');

if (options.clean) {
  cleanConfiguration();
} else {
  setupConfiguration(options.force);
}

function setupConfiguration(force = false) {
  console.log('MoveLicense: Setting up license file organization...');

  if (!fs.existsSync(packageJsonPath)) {
    console.error('Error: No package.json found in current directory.');
    console.log('   Please run this command from your project root directory.');
    process.exit(1);
  }

  try {
    const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageJsonContent);

    // Check Electron dependencies
    const hasElectron = packageJson.dependencies?.electron || 
                       packageJson.devDependencies?.electron ||
                       packageJson.dependencies?.['electron-builder'] ||
                       packageJson.devDependencies?.['electron-builder'];

    if (!hasElectron) {
      console.log('Warning: This doesn\'t appear to be an Electron project.');
      console.log('   MoveLicense is designed for Electron applications.');
    }

    // Check if already configured
    if (packageJson.build?.afterPack && !force) {
      console.log('MoveLicense: afterPack hook already configured.');
      console.log('   Use --force flag to reconfigure.');
      return;
    }

    // Copy script file
    const moveLicenseSource = path.join(__dirname, '..', 'mv.js');
    const moveLicenseTarget = path.join(projectRoot, 'moveLicense.js');

    fs.copyFileSync(moveLicenseSource, moveLicenseTarget);

    // Update package.json
    packageJson.build = packageJson.build || {};
    packageJson.build.afterPack = './moveLicense.js';

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

    console.log('MoveLicense: Successfully configured!');
    console.log('   - Added afterPack hook to package.json');
    console.log('   - Copied moveLicense.js to your project root');
    console.log('   - LICENSE files will be organized after each build');

  } catch (error) {
    console.error('Setup failed:', error.message);
    process.exit(1);
  }
}

function cleanConfiguration() {
  console.log('MoveLicense: Cleaning up configuration...');

  try {
    if (fs.existsSync(packageJsonPath)) {
      const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(packageJsonContent);

      // Remove afterPack configuration
      if (packageJson.build?.afterPack === './moveLicense.js') {
        delete packageJson.build.afterPack;
        
        // If build object is empty, delete it too
        if (Object.keys(packageJson.build).length === 0) {
          delete packageJson.build;
        }

        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        console.log('Removed afterPack configuration from package.json');
      }
    }

    // Delete moveLicense.js file
    const moveLicenseFile = path.join(projectRoot, 'moveLicense.js');
    if (fs.existsSync(moveLicenseFile)) {
      fs.unlinkSync(moveLicenseFile);
      console.log('Removed moveLicense.js file');
    }

    console.log('MoveLicense: Configuration cleaned up successfully!');

  } catch (error) {
    console.error('Cleanup failed:', error.message);
    process.exit(1);
  }
}